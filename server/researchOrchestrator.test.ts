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

  it("does not impose Ottoman Land Code scope on article 2 of a different statute", () => {
    const shariaQuestion = "ما سند اختصاص المحاكم الشرعية في إنشاء الوقف وصحته وفق المادة 2 من قانون أصول المحاكمات الشرعية؟";
    const shariaClaims: EvidenceClaim[] = [{
      claimId:"S1",sourceId:"maqam:sharia-procedure-art2",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",
      exactQuote:"اختصاصات المحاكم الشرعية تنظر المحاكم الشرعية وتفصل في الوقف وإنشاؤه والدعاوى المتعلقة بصحة الوقف.",
      citationPointer:"المادة (2)",qualifiers:[],applicabilityStatus:"direct",verificationStatus:"verbatim_match",
    }];
    const answer = "المادة (2) تجعل من اختصاص المحاكم الشرعية مسائل الوقف وإنشائه وصحته. [مصدر خارجي 1]";
    expect(auditResearchSemantics(shariaQuestion, answer, shariaClaims)).toEqual({valid:true,missing:[],conflations:[]});
  });
});


describe("general semantic answer coverage", () => {
  it("rejects a case answer that omits an evidence-supported jurisdiction issue asked by the user", () => {
    const q = "من صاحب الاختصاص بالطعن في نوع الأرض المسجل كوقف خاسكي سلطان في استئناف 96/2017؟";
    const localClaims: EvidenceClaim[] = [
      {claimId:"J1",sourceId:"maqam:appeal-96-2017",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"نوع الارض هي وقف خاسكي سلطان.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
      {claimId:"J2",sourceId:"maqam:appeal-96-2017",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"الطعن في نوع الارض يكون من اختصاص المحاكم الشرعية ومحكمتنا ليست صاحبة صلاحية واختصاص.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
    ];
    const audit = auditResearchSemantics(q, "نوع الأرض وقف خاسكي سلطان. [مصدر خارجي 1]", localClaims);
    expect(audit.valid).toBe(false);
    expect(audit.missing).toContain("JURISDICTION_SCOPE");
  });

  it("does not require an explicit article 4 label when the question asks a case-specific takhsisat issue", () => {
    const q = "وفق نقض 1543/2016، هل الحكر يرد على وقف التخصيصات أم فرقت المحكمة بينهما؟";
    const localClaims: EvidenceClaim[] = [{
      claimId:"K1",sourceId:"maqam:cassation-1543-2016",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",
      exactQuote:"وقف التخصيصات هو تخصيص منافع مع بقاء الرقبة لبيت المال، والحكر يتعلق بالوقف الصحيح.",qualifiers:["بقاء الرقبة لبيت المال"],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match",
    }];
    const answer = "فرقت المحكمة بين وقف التخصيصات بوصفه تخصيص منافع مع بقاء الرقبة لبيت المال وبين الحكر المتعلق بالوقف الصحيح. [مصدر خارجي 1]";
    const audit = auditResearchSemantics(q, answer, localClaims);
    expect(audit.valid).toBe(true);
    expect(audit.missing).not.toContain("ARTICLE_4");
  });

  it("requires the municipal-boundary effect when the question asks it and evidence contains it", () => {
    const q = "هل دخول وقف التخصيصات ضمن حدود البلدية يحوله إلى ملك؟";
    const localClaims: EvidenceClaim[] = [{
      claimId:"B1",sourceId:"maqam:appeal-96-2017",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",
      exactQuote:"دخول الارض الموقوفة وقف تخصيصات ضمن حدود البلدية لا يتم تحويلها الى اراضي ملك.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match",
    }];
    const audit = auditResearchSemantics(q, "وقف التخصيصات يبقى وقفاً. [مصدر خارجي 1]", localClaims);
    expect(audit.valid).toBe(false);
    expect(audit.missing).toContain("MUNICIPAL_BOUNDARY_EFFECT");
  });
});
