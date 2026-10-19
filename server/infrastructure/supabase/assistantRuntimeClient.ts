import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isLegacyReviewContentUatEnabled,
  resolveAssistantSupabaseConfig,
} from "../../canonicalRuntimeBinding";

let assistantSupabaseClient: SupabaseClient<any, any, any, any, any> | null = null;

export function getAssistantSupabaseClient() {
  const config = resolveAssistantSupabaseConfig(process.env);
  if (!config) return null;

  if (!assistantSupabaseClient) {
    assistantSupabaseClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: { schema: "assistant" },
      global: {
        headers: {
          "x-assistant-runtime": "palwakf-local-assistant",
          ...(isLegacyReviewContentUatEnabled(process.env)
            ? { "x-palwakf-legacy-content-uat": "enabled" }
            : {}),
        },
      },
    });
  }

  return assistantSupabaseClient;
}

export type AssistantRuntimeReadComponent =
  | "knowledge_documents"
  | "knowledge_sources"
  | "reference_documents"
  | "reference_files"
  | "knowledge_citations";

type AssistantRuntimeReadState = {
  status: "unknown" | "ready" | "degraded";
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  retryAfter: string | null;
  failureClass: "configuration" | "network" | "permission_or_schema" | "unknown" | null;
  failureCount: number;
};

const ASSISTANT_BUNDLE_RETRY_MS = 30_000;
const states: Record<AssistantRuntimeReadComponent, AssistantRuntimeReadState> = {
  knowledge_documents: { status: "unknown", lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  knowledge_sources: { status: "unknown", lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  reference_documents: { status: "unknown", lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  reference_files: { status: "unknown", lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  knowledge_citations: { status: "unknown", lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
};

function classifyFailure(error: any): AssistantRuntimeReadState["failureClass"] {
  const message = String(error?.message || error || "").toLowerCase();
  if (/missing|not available|not configured|service role|supabase/.test(message) && /key|url|config|available|configured/.test(message)) return "configuration";
  if (/fetch failed|network|socket|timeout|econn|enotfound/.test(message)) return "network";
  if (/permission|rls|does not exist|schema|column|relation|42501|42p01/.test(message)) return "permission_or_schema";
  return "unknown";
}

export function recordAssistantRuntimeReadSuccess(component: AssistantRuntimeReadComponent): void {
  const state = states[component];
  state.status = "ready";
  state.lastSuccessAt = new Date().toISOString();
  state.retryAfter = null;
  state.failureClass = null;
  state.failureCount = 0;
}

export function recordAssistantRuntimeReadFailure(component: AssistantRuntimeReadComponent, error: any): void {
  const state = states[component];
  const now = Date.now();
  state.status = "degraded";
  state.lastFailureAt = new Date(now).toISOString();
  state.retryAfter = new Date(now + ASSISTANT_BUNDLE_RETRY_MS).toISOString();
  state.failureClass = classifyFailure(error);
  state.failureCount += 1;

  if (state.failureCount === 1) {
    console.warn(
      `[assistantRuntimeClient] bundle companion rejected: component=${component}; failure_class=${state.failureClass}; retry_backoff_seconds=30`,
    );
  }
}

export function assistantRuntimeBundleCircuitOpen(): boolean {
  const now = Date.now();
  return Object.values(states).some((state) => {
    const retryMs = state.retryAfter ? Date.parse(state.retryAfter) : 0;
    return state.status === "degraded" && Number.isFinite(retryMs) && retryMs > now;
  });
}

export function runtimeGetAssistantKnowledgeReadDiagnostics() {
  const configured = Boolean(getAssistantSupabaseClient());
  const components = Object.fromEntries(
    Object.entries(states).map(([component, state]) => [
      component,
      {
        status: state.status,
        lastSuccessAt: state.lastSuccessAt,
        lastFailureAt: state.lastFailureAt,
        retryAfter: state.retryAfter,
        failureClass: state.failureClass,
        failureCount: state.failureCount,
      },
    ]),
  );
  const circuitOpen = assistantRuntimeBundleCircuitOpen();
  const degraded = Object.values(states).some((state) => state.status === "degraded");
  return {
    contract: "assistant_runtime_read_diagnostics_v1",
    runtimeConfigured: configured,
    bundleGate: !configured
      ? "not_configured"
      : circuitOpen
        ? "cooldown_active"
        : degraded
          ? "degraded_recovery_pending"
          : "ready_or_not_yet_exercised",
    partialBundlePolicy: "reject_partial_bundle_and_fall_back_to_existing_safe_store",
    retryBackoffSeconds: ASSISTANT_BUNDLE_RETRY_MS / 1000,
    components,
  };
}
