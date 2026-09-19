import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);

export type HardwareAdaptiveProfile = {
  fingerprint: string;
  cpu: { model: string; logicalCores: number; speedMHz: number };
  memory: { totalGiB: number; freeGiB: number };
  ollama: { models: string[]; gpuOffloadObserved: boolean };
  tier: "constrained" | "balanced" | "accelerated";
  budgets: { contextTokens: number; outputTokens: number; attemptTimeoutMs: number; evidenceCharsPerSource: number };
};

let cached: HardwareAdaptiveProfile | null = null;

async function ollamaText(args: string[]): Promise<string> {
  try { return (await execFileAsync("ollama", args, { timeout: 5000 })).stdout || ""; } catch { return ""; }
}

export async function detectHardwareAdaptiveProfile(force = false): Promise<HardwareAdaptiveProfile> {
  if (cached && !force) return cached;
  const cpus = os.cpus();
  const totalGiB = os.totalmem() / 2 ** 30;
  const freeGiB = os.freemem() / 2 ** 30;
  const list = await ollamaText(["list"]);
  const ps = await ollamaText(["ps"]);
  const models = list.split(/\r?\n/).slice(1).map(x => x.trim().split(/\s{2,}/)[0]).filter(Boolean);
  const gpuOffloadObserved = /GPU/i.test(ps) && !/100% CPU/i.test(ps);
  const logicalCores = cpus.length;
  const cpuScore = Math.max(1, logicalCores) * Math.max(1, cpus[0]?.speed || 1000);
  const accelerated = gpuOffloadObserved && totalGiB >= 16;
  const constrained = !accelerated && (totalGiB < 16 || logicalCores <= 4 || cpuScore < 16000);
  const tier = accelerated ? "accelerated" : constrained ? "constrained" : "balanced";
  const budgets = tier === "accelerated"
    ? { contextTokens: 8192, outputTokens: 768, attemptTimeoutMs: 60000, evidenceCharsPerSource: 1800 }
    : tier === "balanced"
      ? { contextTokens: 4096, outputTokens: 512, attemptTimeoutMs: 45000, evidenceCharsPerSource: 1200 }
      : { contextTokens: 2048, outputTokens: 256, attemptTimeoutMs: 30000, evidenceCharsPerSource: 700 };
  const fingerprint = [cpus[0]?.model, logicalCores, Math.round(totalGiB), models.join(","), gpuOffloadObserved].join("|");
  cached = { fingerprint, cpu: { model: cpus[0]?.model || "unknown", logicalCores, speedMHz: cpus[0]?.speed || 0 }, memory: { totalGiB, freeGiB }, ollama: { models, gpuOffloadObserved }, tier, budgets };
  return cached;
}

export function clearHardwareAdaptiveProfileCache() { cached = null; }
