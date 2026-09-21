import { describe, expect, it } from "vitest";
import {
  evaluateReferenceAdmission,
  reviewerRolesForDecision,
  type ReferenceAdmissionInput,
} from "./referenceGovernance";

function input(
  overrides: Partial<ReferenceAdmissionInput> = {}
): ReferenceAdmissionInput {
  return {
    authorityClass: "official_primary",
    authorityVerified: true,
    identityVerified: true,
    legalStatus: "IN_FORCE",
    legalStatusVerified: true,
    rights: {
      preserveAllowed: true,
      fullTextRetentionAllowed: true,
      ragAllowed: true,
      publicDisplayAllowed: true,
      downloadAllowed: false,
      quoteAllowed: true,
      reviewStatus: "verified",
    },
    extractionConfidence: 0.99,
    hasEvidenceConflict: false,
    citationAlignmentVerified: true,
    sensitivePersonalData: false,
    ...overrides,
  };
}

describe("reference governance", () => {
  it("blocks preservation when retention itself is not authorized", () => {
    const result = evaluateReferenceAdmission(
      input({ rights: { ...input().rights, preserveAllowed: false } })
    );
    expect(result.reviewMode).toBe("BLOCKED");
    expect(result.preserved).toBe(false);
    expect(result.ragCandidate).toBe(false);
  });

  it("never auto-promotes a low-risk official source to canonical or chat", () => {
    const result = evaluateReferenceAdmission(input());
    expect(result.trustLevel).toBe("R3_STATUS_VERIFIED");
    expect(result.reviewMode).toBe("AUTO_PRESERVE");
    expect(result.ragCandidate).toBe(true);
    expect(result.canonicalReference).toBe(false);
    expect(result.chatEligible).toBe(false);
  });

  it("escalates unresolved status, pending rights, conflicts and sensitive data", () => {
    const candidate = input({
      legalStatus: "UNRESOLVED",
      legalStatusVerified: false,
      hasEvidenceConflict: true,
      sensitivePersonalData: true,
      rights: { ...input().rights, reviewStatus: "pending", ragAllowed: false },
    });
    const result = evaluateReferenceAdmission(candidate);
    expect(result.reviewMode).toBe("ITEM_REVIEW");
    expect(result.ragCandidate).toBe(false);
    const roles = reviewerRolesForDecision(candidate);
    expect(roles).toContain("LEGAL_STATUS_REVIEWER");
    expect(roles).toContain("RIGHTS_REVIEWER");
    expect(roles).toContain("SECURITY_PRIVACY_REVIEWER");
    expect(roles).toContain("HISTORICAL_EVIDENCE_REVIEWER");
  });
});
