import { describe, expect, it } from "vitest";
import {
  assertLifecycleMonotonicity,
  buildGovernedIngestionCandidate,
  createGovernanceEvent,
} from "./referencePipelineBridge";

describe("reference pipeline bridge", () => {
  it("maps preserved records to governed ingestion candidates without implicit canonical/chat promotion", () => {
    const candidate = buildGovernedIngestionCandidate({
      record: {
        url: "https://official.example/law.pdf",
        depth: 1,
        kind: "artifact",
        httpStatus: 200,
        bodySha256: "a".repeat(64),
        artifact: {
          artifactId: "artifact-1",
          versionId: "version-1",
          collectionId: "official",
          canonicalSourceUrl: "https://official.example/law.pdf",
          retrievedAt: "2026-09-21T00:00:00Z",
          contentType: "application/pdf",
          byteSize: 10,
          sha256: "a".repeat(64),
          storageKey: "official/a",
          previousVersionId: null,
          relationship: "initial",
          immutable: true,
          metadata: {},
        },
        admission: {
          trustLevel: "R3_STATUS_VERIFIED",
          reviewMode: "AUTO_PRESERVE",
          riskScore: 0,
          preserved: true,
          structuredIndexCandidate: true,
          ragCandidate: true,
          canonicalReference: false,
          chatEligible: false,
          publicDisplayEligible: false,
          reasons: [],
        },
        reviewerRoles: [],
      },
    });
    expect(candidate.lifecycle.preserved).toBe(true);
    expect(candidate.lifecycle.currentStatusVerified).toBe(true);
    expect(candidate.lifecycle.canonical).toBe(false);
    expect(candidate.lifecycle.chatEligible).toBe(false);
  });

  it("enforces monotonic trust prerequisites and auditable human events", () => {
    expect(
      assertLifecycleMonotonicity(
        {
          preserved: true,
          trusted: false,
          currentStatusVerified: false,
          canonical: false,
          chatEligible: false,
        },
        {
          preserved: true,
          trusted: true,
          currentStatusVerified: true,
          canonical: false,
          chatEligible: true,
        }
      )
    ).toContain("chat_requires_canonical");
    expect(() =>
      createGovernanceEvent({
        eventType: "CANONICAL_PROMOTION",
        artifactVersionId: "v1",
        actorType: "human",
        reason: "reviewed",
        at: "2026-09-21T00:00:00Z",
      })
    ).toThrow("human_actor_ref_required");
  });
});
