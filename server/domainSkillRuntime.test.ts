import { describe, expect, it } from "vitest";
import {
  resolveWaqfLegalEvidenceSkillBinding,
  WAQF_LEGAL_EVIDENCE_SKILL_ID,
  WAQF_LEGAL_RESEARCH_DOMAIN,
} from "./domainSkillRuntime";
import type { ResearchSourceResult } from "./researchSources";

const source = (
  kind: ResearchSourceResult["kind"],
  content: string,
): ResearchSourceResult => ({
  id: `test:${kind}`,
  provider: "test",
  kind,
  title: `test ${kind}`,
  url: "https://example.test/source",
  content,
  authority: kind === "legal" ? "reference" : "scholarly",
  reviewed: false,
});

describe("Waqf legal domain skill runtime binding", () => {  it("binds the canonical skill when verified legal evidence enters the runtime path", () => {
    const binding = resolveWaqfLegalEvidenceSkillBinding(
      "ما أثر الحكر على رقبة العقار وحق المنفعة؟",
      [source("legal", "المحكمة قررت بقاء رقبة العقار للوقف")],
    );
    expect(binding.skillId).toBe(WAQF_LEGAL_EVIDENCE_SKILL_ID);
    expect(binding.domainProfile).toBe(WAQF_LEGAL_RESEARCH_DOMAIN);
    expect(binding.status).toBe("active");
    expect(binding.applicable).toBe(true);
    expect(binding.applied).toBe(true);
  });

  it("fails closed for an explicit waqf legal question without verified legal evidence", () => {
    const binding = resolveWaqfLegalEvidenceSkillBinding(
      "ما حكم القانون في تسجيل ملكية رقبة الوقف؟",
      [source("academic", "دراسة تاريخية عن الوقف")],
    );
    expect(binding.status).toBe("fail_closed_missing_verified_legal_evidence");
    expect(binding.applicable).toBe(true);
    expect(binding.applied).toBe(false);
  });  it("does not auto-enable the legal skill for a purely historical waqf question", () => {
    const binding = resolveWaqfLegalEvidenceSkillBinding(
      "متى أُنشئت الوقفية تاريخيًا؟",
      [source("academic", "The waqfiyya was created in the sixteenth century.")],
    );
    expect(binding.status).toBe("inactive_outside_domain");
    expect(binding.applicable).toBe(false);
    expect(binding.applied).toBe(false);
  });

  it("does not turn domain admission into universal runtime authority", () => {
    const binding = resolveWaqfLegalEvidenceSkillBinding(
      "لخص هذا الخبر العام.",
      [source("web", "خبر عام")],
    );
    expect(binding.globalAutomaticLoading).toBe(false);
    expect(binding.canonicalClass).toBe("DOMAIN");
    expect(binding.authorityGrants).toEqual({
      network: false,
      filesystem: false,
      git: false,
      database: false,
      secrets: false,
      production: false,
    });
  });
});
