import { ENV } from "../_core/env";
import { runtimeGetSystemSettings } from "../runtimeRepository";

export type LlmProviderHealthMode = "connected" | "fallback" | "disabled";

export type LlmProviderHealth = {
  available: boolean;
  provider: string;
  model: string | null;
  baseUrl: string | null;
  latencyMs: number | null;
  mode: LlmProviderHealthMode;
  checkedAt: string;
  reason?: string;
  availableModels?: string[];
};

type OllamaTagsResponse = {
  models?: Array<{ name?: string | null; model?: string | null }>;
};

const trim = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function normalizeReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "unknown_error");
  if (/ECONNREFUSED|connection refused|fetch failed/i.test(message)) return "connection_refused";
  if (/ETIMEDOUT|timeout|AbortError/i.test(message)) return "timeout";
  if (/ENOTFOUND|getaddrinfo/i.test(message)) return "host_not_found";
  return message.slice(0, 180);
}

function inferProvider(baseUrl: string, configuredProvider?: string | null): string {
  if (configuredProvider) return configuredProvider;
  if (baseUrl.includes("11434") || baseUrl.toLowerCase().includes("ollama")) return "ollama";
  return "openai_compatible";
}

function tagsUrlForProvider(provider: string, baseUrl: string): string | null {
  if (provider === "ollama") return `${baseUrl.replace(/\/$/, "")}/api/tags`;
  return null;
}

export async function checkLlmProviderHealth(): Promise<LlmProviderHealth> {
  const checkedAt = new Date().toISOString();
  const settings = await runtimeGetSystemSettings().catch(() => null);
  const enabled = settings?.llmEnabled ?? true;
  const baseUrl = trim(settings?.llmBaseUrl) || trim(ENV.serviceApiUrl);
  const model = trim(settings?.llmModel) || trim(ENV.serviceModel) || null;
  const provider = inferProvider(baseUrl, settings?.llmProvider as string | undefined);

  if (!enabled || provider === "disabled") {
    return {
      available: false,
      provider: "disabled",
      model,
      baseUrl: baseUrl || null,
      latencyMs: null,
      mode: "disabled",
      checkedAt,
      reason: "llm_disabled",
    };
  }

  if (!baseUrl) {
    return {
      available: false,
      provider,
      model,
      baseUrl: null,
      latencyMs: null,
      mode: "fallback",
      checkedAt,
      reason: "base_url_not_configured",
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const tagsUrl = tagsUrlForProvider(provider, baseUrl);
    if (!tagsUrl) {
      return {
        available: Boolean(baseUrl && model),
        provider,
        model,
        baseUrl,
        latencyMs: Date.now() - started,
        mode: Boolean(baseUrl && model) ? "connected" : "fallback",
        checkedAt,
        reason: Boolean(baseUrl && model) ? undefined : "provider_metadata_only",
      };
    }

    const response = await fetch(tagsUrl, { method: "GET", signal: controller.signal });
    if (!response.ok) {
      return {
        available: false,
        provider,
        model,
        baseUrl,
        latencyMs: Date.now() - started,
        mode: "fallback",
        checkedAt,
        reason: `http_${response.status}`,
      };
    }

    const json = (await response.json()) as OllamaTagsResponse;
    const availableModels = Array.isArray(json.models)
      ? Array.from(new Set(json.models.map((item) => trim(item.name || item.model)).filter(Boolean)))
      : [];
    const modelAvailable = model ? availableModels.includes(model) : true;

    return {
      available: modelAvailable,
      provider,
      model,
      baseUrl,
      latencyMs: Date.now() - started,
      mode: modelAvailable ? "connected" : "fallback",
      checkedAt,
      reason: modelAvailable ? undefined : "configured_model_not_found",
      availableModels,
    };
  } catch (error) {
    return {
      available: false,
      provider,
      model,
      baseUrl,
      latencyMs: Date.now() - started,
      mode: "fallback",
      checkedAt,
      reason: normalizeReason(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
