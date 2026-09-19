import { describe, expect, it } from "vitest";
import type { EvidenceClaim } from "./evidenceDistillation";
import { buildLegalSynthesisPlan, renderLegalSections, synthesizeDeterministicGroundedClaims, type LegalSectionSynthesis } from "./legalEvidenceSynthesis";

const q = "هل تنطبق المادة الثانية من قانون الأراضي العثماني على وقف خاصكي سلطان إذا اعتُبر وقف تخصيصات؟ وما الدليل على طبيعة إنشائه؟";
const claims: EvidenceClaim[] = [
  {claimId:"E1-C1",sourceId:"law",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",exactQuote:"المادة (2) الأراضي المملوكة أربعة أنواع",citationPointer:"المادة (2)",qualifiers:[],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E1-C2",sourceId:"law",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",exactQuote:"القسم الثاني من المادة (4) وقف تخصيصات من الأراضي الأميرية ورقبتها عائدة إلى بيت المال",citationPointer:"المادة (4)",qualifiers:["رقبتها عائدة إلى بيت المال"],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E2-C1",sourceId:"appeal",sourceIndex:2,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"نوع الارض هي وقف خاسكي سلطان وبقيت نوع الارض وقف خاسكي سلطان",qualifiers:[],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E3-C1",sourceId:"cass",sourceIndex:3,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"أما وقف التخصيصات فهو تخصيص منافع مع بقاء رقبتها لبيت المال",qualifiers:["مع بقاء رقبتها لبيت المال"],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E4-C1",sourceId:"study",sourceIndex:4,sourceType:"academic",authorityClass:"scholarly",legalRole:"historical_evidence",exactQuote:"endowment deed (waqfiyya) of Haseki Sultan dated 958 AH /1552 C.E.",qualifiers:[],applicabilityStatus:"contextual",verificationStatus:"verbatim_match"},
];

describe("structured legal evidence synthesis", () => {
  it("builds isolated sections with deterministic citation ownership", () => {
    const plan = buildLegalSynthesisPlan(q, claims);
    expect(plan?.map(x => x.kind)).toEqual(["statute_scope","controlling_rule","historical_creation","entity_application"]);
    expect(plan?.find(x => x.kind === "statute_scope")?.citations).toEqual([1]);
    expect(plan?.find(x => x.kind === "controlling_rule")?.citations).toEqual([1,3]);
    expect(plan?.find(x => x.kind === "entity_application")?.citations).toEqual([2]);
    expect(plan?.find(x => x.kind === "historical_creation")?.citations).toEqual([4]);
  });

  it("renders citations outside model text", () => {
    const sections: LegalSectionSynthesis[] = [
      {kind:"statute_scope",text:"الأراضي المملوكة تُقسم إلى أربعة أنواع.",citations:[1],model:"llama3.2:3b"},
      {kind:"controlling_rule",text:"وقف التخصيصات تخصيص منافع من أرض أميرية مع بقاء الرقبة لبيت المال.",citations:[1,3],model:"llama3.2:3b"},
      {kind:"entity_application",text:"السند يسجل وقف خاسكي سلطان، ولا يمكن من المقتطف وحده إثبات كونه وقف تخصيصات.",citations:[2],model:"qwen2.5:3b"},
      {kind:"historical_creation",text:"الوقفية دليل تاريخي على الإنشاء بتاريخ 958هـ/1552م.",citations:[4],model:"llama3.2:3b"},
    ];
    const answer = renderLegalSections(sections);
    expect(answer).toContain("المادة (2):");
    expect(answer).toContain("المادة (4):");
    expect(answer).toContain("[مصدر خارجي 1] [مصدر خارجي 3]");
    expect(answer).toContain("[مصدر خارجي 2]");
    expect(answer).toContain("[مصدر خارجي 4]");
  });

  it("renders a generic legal answer from only the required grounded source", () => {
    const genericClaims: EvidenceClaim[] = [
      {claimId:"G1",sourceId:"maqam:cassation-1383-2019",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"كان على المحكمة أن تقضي بتسجيل رقبة العقار للوقف وملكية حق المنفعة بمقتضى التحكير للمدعي.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
      {claimId:"G2",sourceId:"other",sourceIndex:2,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"نص آخر غير لازم للسؤال.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "ما أثر الحكر على رقبة العقار وحق المنفعة وفق نقض 1383/2019؟",
      genericClaims,
      [1],
    );
    expect(result?.sourceIndexes).toEqual([1]);
    expect(result?.answer).toContain("رقبة العقار للوقف");
    expect(result?.answer).toContain("حق المنفعة");
    expect(result?.answer).toContain("[مصدر خارجي 1]");
    expect(result?.answer).not.toContain("[مصدر خارجي 2]");
  });
});
