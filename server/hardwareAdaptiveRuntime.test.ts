import { describe, expect, it } from "vitest";
import { isCapabilityRuntimeEligible, type ModelCapability } from "./hardwareAdaptiveRuntime";

const capability = (
  overrides: Partial<ModelCapability> = {}
): ModelCapability => ({
  model: "qwen2.5:3b",
  latencyMs: 12000,
  usable: false,
  tokensPerSecond: 0,
  evalCount: 0,
  promptEvalCount: 0,
  promptTokensPerSecond: 0,
  workloadTokens: 1024,
  processor: "unknown",
  failureReason: "timeout",
  ...overrides,
});

describe("hardware adaptive runtime eligibility", () => {
  it("keeps unmeasured models eligible for a bounded runtime attempt", () => {
    expect(isCapabilityRuntimeEligible(undefined)).toBe(true);
  });

  it("keeps benchmark-certified models eligible", () => {
    expect(isCapabilityRuntimeEligible(capability({ usable: true, failureReason: undefined }))).toBe(true);
  });

  it("treats benchmark timeout as retryable at runtime", () => {
    expect(isCapabilityRuntimeEligible(capability({ failureReason: "timeout" }))).toBe(true);
  });

  it("rejects models with benchmark HTTP errors", () => {
    expect(isCapabilityRuntimeEligible(capability({ failureReason: "http_error" }))).toBe(false);
  });

  it("rejects models with invalid benchmark responses", () => {
    expect(isCapabilityRuntimeEligible(capability({ failureReason: "invalid_response" }))).toBe(false);
  });
});
