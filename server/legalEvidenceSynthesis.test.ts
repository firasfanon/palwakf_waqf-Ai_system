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

  it("renders a concise grounded definition for Khalil al-Rahman waqf from official guidance", () => {
    const khalilClaims: EvidenceClaim[] = [
      {
        claimId:"K1",
        sourceId:"pla:waqf-types-khalil-al-rahman",
        sourceIndex:1,
        sourceType:"legal",
        authorityClass:"primary",
        legalRole:"source_excerpt",
        exactQuote:"الوقت غير الصحيح: وهي الأراضي المفروزة من الأراضي الأميرية التي أوقفتها السلاطين العثمانيين وتكون عبارة عن تخصيص منافع القطع المفرزة من الأراضي الأميرية لجهة معينة (مادة ٤ من القانون العثماني سنة 1858) مثال عليها (وقف صخرة الله المشرفة أو وقف خليل الرحمن او تميم الداري)",
        qualifiers:[],
        applicabilityStatus:"direct",
        verificationStatus:"verbatim_match"
      },
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "ما هو وقف خليل الرحمن",
      khalilClaims,
      [1],
    );
    expect(result?.sourceIndexes).toEqual([1]);
    expect(result?.answer).toContain("وقف خليل الرحمن");
    expect(result?.answer).toContain("الوقف غير الصحيح");
    expect(result?.answer).toContain("تخصيص منافع");
    expect(result?.answer).toContain("المادة (4)");
    expect(result?.answer).toContain("[مصدر خارجي 1]");
    expect(result?.answer).toContain("حدود الدليل");
    expect(result?.answer).not.toContain("المحكمة:");
    expect(result?.answer).not.toContain("الوقت غير الصحيح");
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


describe("multipart deterministic source coverage", () => {
  it("can render two independently relevant claims from the same required source", () => {
    const multipartClaims: EvidenceClaim[] = [
      {claimId:"M1",sourceId:"maqam:appeal-96-2017",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"نوع الارض هي وقف خاسكي سلطان وبقيت نوع الارض وقف خاسكي سلطان.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
      {claimId:"M2",sourceId:"maqam:appeal-96-2017",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"الطعن في نوع الارض يكون من اختصاص المحاكم الشرعية وليس من قبل محكمتنا كونها ليست صاحبة صلاحية واختصاص.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "من صاحب الاختصاص بالطعن في نوع الأرض المسجل كوقف خاسكي سلطان في استئناف 96/2017، ولماذا امتنعت محكمة الاستئناف عن بحثه؟",
      multipartClaims,
      [1],
    );
    expect(result?.sourceIndexes).toEqual([1,1]);
    expect(result?.answer).toMatch(/وقف خاسكي سلطان/u);
    expect(result?.answer).toMatch(/اختصاص المحاكم الشرعية/u);
  });
});

describe("composite deterministic legal synthesis", () => {
  it("covers both correct-waqf and takhsisat sides when both are asked", () => {
    const localClaims: EvidenceClaim[] = [
      {claimId:"C1",sourceId:"cass",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"الوقف الصحيح تكون رقبة العقار الموقوف وجميع حقوق التصرف عائدة إلى جانب الوقف.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
      {claimId:"C2",sourceId:"cass",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"أما وقف التخصيصات فهو تخصيص منافع مع بقاء رقبتها لبيت المال.",qualifiers:["بقاء رقبتها لبيت المال"],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "ما الفرق بين الوقف الصحيح ووقف التخصيصات وأين تبقى رقبة الأرض؟",
      localClaims,
      [1],
    );
    expect(result?.answer).toContain("الوقف الصحيح");
    expect(result?.answer).toContain("وقف التخصيصات");
    expect(result?.answer).toContain("بيت المال");
  });
  it("adds an explicit evidence limit for Haseki registry classification", () => {
    const localClaims: EvidenceClaim[] = [
      {claimId:"R1",sourceId:"appeal",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"نوع الارض هي وقف خاسكي سلطان وبقيت نوع الارض وقف خاسكي سلطان.",qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
      {claimId:"R2",sourceId:"law",sourceIndex:2,sourceType:"legal",authorityClass:"reference",legalRole:"statute",exactQuote:"وقف التخصيصات تخصيص منافع مع بقاء الرقبة لبيت المال.",citationPointer:"المادة (4)",qualifiers:["بقاء الرقبة لبيت المال"],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "هل يكفي وصف وقف خاسكي سلطان وحده لإثبات أنها وقف تخصيصات، أم يلزم دليل آخر؟",
      localClaims,
      [1,2],
    );
    expect(result?.answer).toContain("لا يكفي وحده");
    expect(result?.answer).toContain("[مصدر خارجي 1]");
    expect(result?.answer).toContain("[مصدر خارجي 2]");
  });
  it("adds a jurisdiction-to-land-classification boundary", () => {
    const localClaims: EvidenceClaim[] = [
      {claimId:"J1",sourceId:"sharia",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",exactQuote:"المادة (2) تنظر المحاكم الشرعية في الوقف والتولية عليه واستبداله.",citationPointer:"المادة (2)",qualifiers:[],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "ما اختصاص المحاكم الشرعية في التولية والاستبدال، وهل هذا النص يقرر تصنيف الأرض ملكاً أو ميرية؟",
      localClaims,
      [1],
    );
    expect(result?.answer).toContain("لا تقرر بذاتها تصنيف الأرض");
    expect(result?.answer).toContain("[مصدر خارجي 1]");
  });

  it("adds the historical-evidence classification limit", () => {
    const localClaims: EvidenceClaim[] = [
      {claimId:"H1",sourceId:"study",sourceIndex:1,sourceType:"academic",authorityClass:"scholarly",legalRole:"historical_evidence",exactQuote:"endowment deed (waqfiyya) dated 958 AH / 1552 C.E.",qualifiers:[],applicabilityStatus:"contextual",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "ما الذي تثبته وقفية خاصكي سلطان 958هـ/1552م، وما الذي لا تثبته بشأن التصنيف القانوني الحالي؟",
      localClaims,
      [1],
    );
    expect(result?.answer).toContain("لا تثبت وحدها التصنيف القانوني الحالي");
    expect(result?.answer).toContain("[مصدر خارجي 1]");
  });

  it("adds a case-specific municipal-boundary limitation", () => {
    const localClaims: EvidenceClaim[] = [
      {claimId:"B1",sourceId:"appeal",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"دخول الأرض الموقوفة ضمن حدود البلدية لا يجوز أن يحولها إلى أرض ملك.",qualifiers:["لا يجوز أن يحولها إلى أرض ملك"],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match"},
    ];
    const result = synthesizeDeterministicGroundedClaims(
      "هل دخول وقف التخصيصات ضمن حدود البلدية يغير طبيعتها وما حدود الاستدلال من الحكم؟",
      localClaims,
      [1],
    );
    expect(result?.answer).toContain("لا يثبت بذاته حكماً عاماً");
    expect(result?.answer).toContain("[مصدر خارجي 1]");
  });
});
