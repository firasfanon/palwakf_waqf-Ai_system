import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const CAPABILITY_CACHE_VERSION = 2;
const CAPABILITY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CAPABILITY_CACHE_FILE = path.join(os.tmpdir(), "palwakf-waqf-ai-model-capabilities-v1.json");

export type ModelCapability = {
  model: string;
  latencyMs: number;
  usable: boolean;
  tokensPerSecond: number;
  evalCount: number;
  promptEvalCount: number;
  promptTokensPerSecond: number;
  workloadTokens: number;
  processor: "cpu" | "gpu" | "mixed" | "unknown";
  failureReason?: "timeout" | "http_error" | "invalid_response";
};

export type HardwareAdaptiveProfile = {
  fingerprint: string;
  cpu: { model: string; logicalCores: number; speedMHz: number };
  memory: { totalGiB: number; freeGiB: number };
  ollama: { models: string[]; gpuOffloadObserved: boolean };
  gpu: { nvidiaDetected: boolean; names: string[]; totalVramMiB: number };
  tier: "constrained" | "balanced" | "accelerated";
  budgets: { contextTokens: number; outputTokens: number; attemptTimeoutMs: number; evidenceCharsPerSource: number };
  modelCapabilities?: ModelCapability[];
};

let cached: HardwareAdaptiveProfile | null = null;
const capabilityCache = new Map<string, ModelCapability>();
let persistentCacheLoaded = false;

type PersistentCapabilityCache = {
  version: number;
  entries: Record<string, { measuredAt: number; capability: ModelCapability }>;
};

async function loadPersistentCapabilityCache() {
  if (persistentCacheLoaded) return;
  persistentCacheLoaded = true;
  try {
    const raw = JSON.parse(await fs.readFile(CAPABILITY_CACHE_FILE, "utf8")) as PersistentCapabilityCache;
    if (raw.version !== CAPABILITY_CACHE_VERSION) return;
    const now = Date.now();
    for (const [key, entry] of Object.entries(raw.entries || {})) {
      if (now - Number(entry.measuredAt || 0) <= CAPABILITY_CACHE_TTL_MS) capabilityCache.set(key, entry.capability);
    }
  } catch { /* cold cache */ }
}

async function persistCapabilityCache() {
  const now = Date.now();
  const entries = Object.fromEntries([...capabilityCache.entries()].map(([key, capability]) => [key, { measuredAt: now, capability }]));
  await fs.writeFile(CAPABILITY_CACHE_FILE, JSON.stringify({ version: CAPABILITY_CACHE_VERSION, entries }), "utf8").catch(() => undefined);
}

function workloadBucket(tokens: number) {
  if (tokens <= 512) return 512;
  if (tokens <= 1024) return 1024;
  if (tokens <= 1536) return 1536;
  return 2048;
}

function failedCapability(model: string, started: number, workloadTokens: number, failureReason: ModelCapability["failureReason"]): ModelCapability {
  return { model, latencyMs: Date.now() - started, usable: false, tokensPerSecond: 0, evalCount: 0, promptEvalCount: 0, promptTokensPerSecond: 0, workloadTokens, processor: "unknown", failureReason };
}

async function ollamaText(args: string[], timeout = 5000): Promise<string> {
  try { return (await execFileAsync("ollama", args, { timeout })).stdout || ""; } catch { return ""; }
}

async function detectNvidiaHardware(): Promise<{ names: string[]; totalVramMiB: number }> {
  try {
    const { stdout } = await execFileAsync(
      "nvidia-smi",
      ["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
      { timeout: 4000 },
    );
    const rows = String(stdout || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const names: string[] = [];
    let totalVramMiB = 0;
    for (const row of rows) {
      const comma = row.lastIndexOf(",");
      if (comma < 0) continue;
      const name = row.slice(0, comma).trim();
      const memory = Number(row.slice(comma + 1).trim());
      if (name) names.push(name);
      if (Number.isFinite(memory)) totalVramMiB += memory;
    }
    return { names, totalVramMiB };
  } catch {
    return { names: [], totalVramMiB: 0 };
  }
}

async function benchmarkModel(model: string, timeoutMs: number, workloadTokens = 900, fingerprint = "unknown"): Promise<ModelCapability> {
  await loadPersistentCapabilityCache();
  const bucket = workloadBucket(workloadTokens);
  const cacheKey = `${fingerprint}|${model}|${bucket}`;
  const hit = capabilityCache.get(cacheKey);
  if (hit) return hit;
  workloadTokens = bucket;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt: ("Evidence context for performance calibration. " + "waqf evidence legal historical source citation analysis. ".repeat(Math.max(1, Math.floor(workloadTokens / 9)))) + "\nReply only with: OK",
        stream: false,
        think: false,
        keep_alive: "30s",
        options: { num_predict: 8, num_ctx: Math.min(2048, Math.max(1024, workloadTokens + 256)), temperature: 0 },
      }),
    });
    if (!response.ok) {
      const result = failedCapability(model, started, workloadTokens, "http_error");
      capabilityCache.set(cacheKey, result);
      await persistCapabilityCache();
      return result;
    }
    const body = await response.json() as { response?: string; eval_count?: number; eval_duration?: number; prompt_eval_count?: number; prompt_eval_duration?: number };
    const evalCount = Number(body.eval_count || 0);
    const evalDuration = Number(body.eval_duration || 0);
    const tokensPerSecond = evalDuration > 0 ? evalCount / (evalDuration / 1_000_000_000) : 0;
    const promptEvalCount = Number(body.prompt_eval_count || 0);
    const promptEvalDuration = Number(body.prompt_eval_duration || 0);
    const promptTokensPerSecond = promptEvalDuration > 0 ? promptEvalCount / (promptEvalDuration / 1_000_000_000) : 0;
    const ps = await ollamaText(["ps"], 2000);
    const line = ps.split(/\r?\n/).find(item => item.includes(model)) || "";
    const processor = /GPU/i.test(line) && /CPU/i.test(line) ? "mixed" : /GPU/i.test(line) ? "gpu" : /CPU/i.test(line) ? "cpu" : "unknown";
    const result: ModelCapability = { model, latencyMs: Date.now() - started, usable: Boolean(body.response), tokensPerSecond, evalCount, promptEvalCount, promptTokensPerSecond, workloadTokens, processor, failureReason: body.response ? undefined : "invalid_response" };
    capabilityCache.set(cacheKey, result);
    await persistCapabilityCache();
    await ollamaText(["stop", model], 3000);
    return result;
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    const result = failedCapability(model, started, workloadTokens, timeout ? "timeout" : "http_error");
    capabilityCache.set(cacheKey, result);
    await persistCapabilityCache();
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export async function detectHardwareAdaptiveProfile(force = false): Promise<HardwareAdaptiveProfile> {
  if (cached && !force) return cached;
  const cpus = os.cpus();
  const totalGiB = os.totalmem() / 2 ** 30;
  const freeGiB = os.freemem() / 2 ** 30;
  const list = await ollamaText(["list"]);
  const ps = await ollamaText(["ps"]);
  const nvidia = await detectNvidiaHardware();
  const models = list.split(/\r?\n/).slice(1).map(x => x.trim().split(/\s{2,}/)[0]).filter(Boolean);
  const gpuOffloadObserved = /GPU/i.test(ps) && !/100% CPU/i.test(ps);
  const logicalCores = cpus.length;
  const cpuScore = Math.max(1, logicalCores) * Math.max(1, cpus[0]?.speed || 1000);
  const nvidiaDetected = nvidia.names.length > 0;
  const accelerated = gpuOffloadObserved && nvidia.totalVramMiB >= 4096 && totalGiB >= 16;
  const constrained = !accelerated && (totalGiB < 16 || logicalCores <= 4 || cpuScore < 16000);
  const tier = accelerated ? "accelerated" : constrained ? "constrained" : "balanced";
  const partialGpuAvailable = nvidiaDetected && nvidia.totalVramMiB >= 2048;
  const budgets = tier === "accelerated"
    ? { contextTokens: 8192, outputTokens: 768, attemptTimeoutMs: 60000, evidenceCharsPerSource: 1800 }
    : tier === "balanced"
      ? { contextTokens: 4096, outputTokens: 512, attemptTimeoutMs: 45000, evidenceCharsPerSource: 1200 }
      : partialGpuAvailable
        ? { contextTokens: 2048, outputTokens: 256, attemptTimeoutMs: 45000, evidenceCharsPerSource: 700 }
        : { contextTokens: 2048, outputTokens: 256, attemptTimeoutMs: 30000, evidenceCharsPerSource: 700 };
  const fingerprint = [
    cpus[0]?.model,
    logicalCores,
    Math.round(totalGiB),
    models.join(","),
    nvidia.names.join(","),
    nvidia.totalVramMiB,
  ].join("|");
  cached = {
    fingerprint,
    cpu: { model: cpus[0]?.model || "unknown", logicalCores, speedMHz: cpus[0]?.speed || 0 },
    memory: { totalGiB, freeGiB },
    ollama: { models, gpuOffloadObserved },
    gpu: { nvidiaDetected, names: nvidia.names, totalVramMiB: nvidia.totalVramMiB },
    tier,
    budgets,
    modelCapabilities: [],
  };
  return cached;
}

export async function benchmarkInstalledModels(profile: HardwareAdaptiveProfile, workloadTokens = 900): Promise<ModelCapability[]> {
  const localModels = profile.ollama.models.filter(model => !model.endsWith(":cloud"));
  const preferred = ["qwen2.5:3b", "llama3.2:3b", "palwakf-llama3.2-3b-64k:ctx64k", "palwakf-llama3.2-3b-64k:local", "deepseek-r1:latest"];
  const candidates = preferred.filter(model => localModels.includes(model));
  const partialGpuAvailable = profile.gpu.nvidiaDetected && profile.gpu.totalVramMiB >= 2048;
  const limit = profile.tier === "constrained" ? (partialGpuAvailable ? 2 : 4) : 6;
  const benchmarkTimeoutMs = profile.tier === "constrained"
    ? (partialGpuAvailable ? 35000 : 12000)
    : 25000;
  const results: ModelCapability[] = [];
  for (const model of candidates.slice(0, limit)) {
    results.push(await benchmarkModel(model, benchmarkTimeoutMs, workloadTokens, profile.fingerprint));
  }
  profile.modelCapabilities = results;
  return results;
}

export function orderModelsByCapability(models: string[], profile: HardwareAdaptiveProfile): string[] {
  const capabilities = new Map((profile.modelCapabilities || []).map(item => [item.model, item]));
  return [...models].sort((a, b) => {
    const left = capabilities.get(a);
    const right = capabilities.get(b);
    if (left?.usable !== right?.usable) return left?.usable ? -1 : right?.usable ? 1 : 0;
    if (left?.usable && right?.usable) {
      if (Math.abs(left.tokensPerSecond - right.tokensPerSecond) > 0.5) return right.tokensPerSecond - left.tokensPerSecond;
      return left.latencyMs - right.latencyMs;
    }
    if (left && !left.usable && !right) return 1;
    if (right && !right.usable && !left) return -1;
    return 0;
  });
}

export function clearHardwareAdaptiveProfileCache() { cached = null; capabilityCache.clear(); }
