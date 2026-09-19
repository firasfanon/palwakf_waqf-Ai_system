import { describe, expect, it } from "vitest";
import { auditResearchAnswer, auditResearchSemantics } from "./researchOrchestrator";
import type { EvidenceClaim } from "./evidenceDistillation";

const claims: EvidenceClaim[] = [
  { claimId:"E1-C1", sourceId:"law", sourceIndex:1, sourceType:"legal", authorityClass:"reference", legalRole:"statute", exactQuote:"المادة (2) الأراضي المملوكة أربعة أنواع", citationPointer:"المادة (2)", qualifiers:[], applicabilityStatus:"direct", verificationStatus:"verbatim_match" },
  { claimId:"E1-C2", sourceId:"law", sourceIndex:1, sourceType:"legal", authorityClass:"reference", legalRole:"statute", exactQuote:"المادة (4) وقف التخصيصات تخصيص منافع ورقبتها عائدة إلى بيت المال", citationPointer:"المادة (4)", qualifiers:["رقبتها عائدة إلى بيت المال"], applicabilityStatus:"direct", verificationStatus:"verbatim_match" },
  { claimId:"E2-C1", sourceId:"appeal", sourceIndex:2, sourceType:"legal", authorityClass:"reference", legalRole:"court_reasoning", exactQuote:"نوع الارض هي وقف خاسكي سلطان وبقيت نوع الارض وقف خاسكي سلطان", qualifiers:[], applicabilityStatus:"direct", verificationStatus:"verbatim_match" },
  { claimId:"E3-C1", sourceId:"cass", sourceIndex:3, sourceType:"legal", authorityClass:"reference", legalRole:"court_reasoning", exactQuote:"وقف التخصيصات هو تخصيص منافع مع بقاء رقبتها لبيت المال", qualifiers:["مع بقاء رقبتها لبيت المال"], applicabilityStatus:"direct", verificationStatus:"verbatim_match" },
  { claimId:"E4-C1", sourceId:"study", sourceIndex:4, sourceType:"academic", authorityClass:"scholarly", legalRole:"historical_evidence", exactQuote:"endowment deed (waqfiyya) of Haseki Sultan dated 958 AH / 1552 C.E.", qualifiers:[], applicabilityStatus:"contextual", verificationStatus:"verbatim_match" },
];

const question = "هل تنطبق المادة الثانية من قانون الأراضي العثماني على وقف خاصكي سلطان إذا اعتُبر وقف تخصيصات؟ وما الدليل على طبيعة إنشائه؟";

describe("research evidence audit", () => {
  it("accepts valid internal and external citations", () => {
    const audit = auditResearchAnswer("[ثابت بالمصدر] حكم [مرجع 1]. دعم [مصدر خارجي 2].", 2, 2);
    expect(audit.valid).toBe(true);
    expect(audit.citedInternal).toEqual([1]);
    expect(audit.citedExternal).toEqual([2]);
    expect(audit.evidenceStateCounts.established).toBe(1);
  });

  it("rejects hallucinated citation indexes", () => {
    const audit = auditResearchAnswer("ادعاء [مرجع 4] وآخر [مصدر خارجي 3]", 2, 1);
    expect(audit.valid).toBe(false);
    expect(audit.invalidTokens).toEqual(["[مرجع 4]", "[مصدر خارجي 3]"]);
  });

  it("requires all authoritative external citations when requested", () => {
    const audit = auditResearchAnswer("نتيجة [مصدر خارجي 1] ودعم [مصدر خارجي 3].", 0, 4, [1,2,3,4]);
    expect(audit.valid).toBe(false);
    expect(audit.missingRequiredExternal).toEqual([2,4]);
  });

  it("counts evidence states", () => {
    const audit = auditResearchAnswer("[استنتاج تحليلي] أ. [مختلف فيه] ب. [غير محسوم] ج.", 0, 0);
    expect(audit.evidenceStateCounts).toEqual({ established: 0, inference: 1, contested: 1, unresolved: 1 });
  });

  it("accepts a semantically disciplined benchmark answer", () => {
    const answer = [
      "المادة (2) تتناول الأراضي المملوكة. [مصدر خارجي 1]",
      "أما وقف التخصيصات فينظمه نص المادة (4) بوصفه تخصيص منافع مع بقاء الرقبة لبيت المال. [مصدر خارجي 1] [مصدر خارجي 3]",
      "وبالنسبة إلى وقف خاسكي سلطان، يثبت الحكم بقاء هذا الاسم في السند؛ أما اعتباره وقف تخصيصات فيبقى مشروطًا بثبوت هذا التصنيف. [مصدر خارجي 2]",
      "والدليل التاريخي هو وقفية waqfiyya مؤرخة 958 AH / 1552 C.E. [مصدر خارجي 4]",
    ].join("\n");
    expect(auditResearchSemantics(question, answer, claims)).toEqual({ valid:true, missing:[], conflations:[] });
  });

  it("rejects article-2/article-4 conflation", () => {
    const bad = "المادة (2) تقرر أن وقف التخصيصات هو تخصيص منافع وتبقى الرقبة لبيت المال. وقف خاسكي سلطان وقف تخصيصات. الوقفية سنة 1552.";
    const audit = auditResearchSemantics(question, bad, claims);
    expect(audit.valid).toBe(false);
    expect(audit.conflations).toContain("ARTICLE_2_WITH_ARTICLE_4_RULE");
  });
});
