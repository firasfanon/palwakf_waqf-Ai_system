import { describe, expect, it } from "vitest";
import { assessKnowledgeTrust } from "./assistantTrust";
import { buildLearningCandidateKnowledgeDraft } from "./learningCandidate";

const question =
  "هل تنطبق المادة الثانية من قانون الأراضي العثماني على وقف خاصكي سلطان إذا اعتُبر وقف تخصيصات؟";
const references = [
  {
    id: "law",
    title: "قانون الأراضي العثماني 1858",
    category: "external_legal",
    sourceUrl: "https://example.test/law",
  },
  {
    id: "case",
    title: "حكم قضائي",
    category: "external_legal",
    sourceUrl: "https://example.test/case",
  },
] as any[];

function draft() {
  return buildLearningCandidateKnowledgeDraft({
    question,
    answer: "جواب موثق [مصدر خارجي 1].",
    references,
    synthesisMode: "deterministic_grounded_claims",
    skillRuntime: { skillId: "PALWAKF_WAQF_LEGAL_EVIDENCE_ASSURANCE_V1", status: "active" },
    citationAudit: { valid: true },
    semanticAudit: { valid: true },
    legalSkillAudit: { valid: true },
    createdBy: 0,
  });
}

describe("learning candidate governance", () => {
  it("captures a research result as review-only and not chat eligible", () => {
    const candidate = draft();
    const trust = assessKnowledgeTrust(candidate, { role: "admin" });

    expect(candidate.status).toBe("review_only");
    expect(candidate.isActive).toBe(0);
    expect(candidate.isChatEligible).toBe(0);
    expect(candidate.metadataJson.promotion_policy).toBe("human_verified_only");
    expect(candidate.metadataJson.source_verification_status).toBe("pending");
    expect(candidate.citations.every(c => c.verificationStatus === "linked")).toBe(true);
    expect(trust.allowForChat).toBe(false);
    expect(trust.reasons).toContain("knowledge_document_not_approved");
    expect(trust.reasons).toContain("knowledge_document_not_chat_eligible");
    expect(trust.reasons).toContain("source_not_human_verified");
    expect(trust.reasons).toContain("citation_not_human_verified");
  });

  it("does not reuse a candidate after approval alone", () => {
    const candidate = {
      ...draft(),
      status: "approved",
      isActive: 1,
      isChatEligible: 1,
      approvalVersion: 1,
    };
    const trust = assessKnowledgeTrust(candidate, { role: "admin" });

    expect(trust.allowForChat).toBe(false);
    expect(trust.reasons).not.toContain("knowledge_document_not_approved");
    expect(trust.reasons).not.toContain("knowledge_document_not_chat_eligible");
    expect(trust.reasons).toContain("source_not_human_verified");
    expect(trust.reasons).toContain("citation_not_human_verified");
  });

  it("allows reuse only after approval plus human source and citation verification", () => {
    const base = draft();
    const candidate = {
      ...base,
      status: "approved",
      isActive: 1,
      isChatEligible: 1,
      approvalVersion: 1,
      metadataJson: {
        ...base.metadataJson,
        source_verification_status: "verified",
      },
      citations: base.citations.map(citation => ({
        ...citation,
        verificationStatus: "verified",
        metadataJson: {
          ...citation.metadataJson,
          citation_verification_status: "verified",
        },
      })),
    };
    const trust = assessKnowledgeTrust(candidate, { role: "admin" });

    expect(trust.allowForChat).toBe(true);
    expect(trust.sourceVerificationStatus).toBe("verified");
    expect(trust.citationStatus).toBe("verified");
    expect(trust.reasons).toEqual([]);
  });
});
