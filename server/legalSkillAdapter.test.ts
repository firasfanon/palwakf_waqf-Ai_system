import { describe, expect, it } from "vitest";
import type { EvidenceClaim } from "./evidenceDistillation";
import type { ResearchSourceResult } from "./researchSources";
import { auditLegalDraftWithSkillRules } from "./legalSkillAdapter";

const claims: EvidenceClaim[] = [
  {claimId:"E1-C1",sourceId:"law",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",exactQuote:"المادة (2) الأراضي المملوكة أربعة أنواع",citationPointer:"المادة (2)",qualifiers:[],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E1-C2",sourceId:"law",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",exactQuote:"المادة (4) وقف التخصيصات هو تخصيص منافع مع بقاء رقبتها عائدة إلى بيت المال",citationPointer:"المادة (4)",qualifiers:["بيت المال"],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E2-C1",sourceId:"appeal",sourceIndex:2,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"نوع الارض هي وقف خاسكي سلطان وتمت به اعمال التسوية في عام 2014 وبقيت نوع الارض وقف خاسكي سلطان",qualifiers:[],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E3-C1",sourceId:"cass",sourceIndex:3,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",exactQuote:"أما وقف التخصيصات فهو تخصيص منافع مع بقاء رقبتها لبيت المال",qualifiers:["بيت المال"],applicabilityStatus:"direct",verificationStatus:"verbatim_match"},
  {claimId:"E4-C1",sourceId:"study",sourceIndex:4,sourceType:"academic",authorityClass:"scholarly",legalRole:"historical_evidence",exactQuote:"endowment deed (waqfiyya) of Haseki Sultan dated 958 AH /1552 C.E.",qualifiers:[],applicabilityStatus:"contextual",verificationStatus:"verbatim_match"},
];

const rows: ResearchSourceResult[] = [
  {id:"law",provider:"p",kind:"legal",title:"law",url:"u1",content:"المادة (2) الأراضي المملوكة أربعة أنواع المادة (4) وقف التخصيصات تخصيص منافع رقبتها عائدة إلى بيت المال",authority:"reference",reviewed:false},
  {id:"appeal",provider:"p",kind:"legal",title:"appeal",url:"u2",content:"اسباب الاستئناف 1. اخطأت المحكمة في عدم اعتبار الاراضي التي دخلت حدود البلدية اراضي ملك. 2. اخطأت المحكمة في عدم اعتبار الاراضي التي تم وقفها وقف غير صحيح هي اراضي اميرية. 3. اخطأت المحكمة في اعتبار نوع الارض هو وقف خاسكي سلطان. المحكمة بعد التدقيق والمداولة ومن خلال الرجوع الى السند نجد بان نوع الارض هي وقف خاسكي سلطان وتمت به اعمال التسوية في عام 2014 وبقيت نوع الارض وقف خاسكي سلطان",authority:"reference",reviewed:false},
  {id:"cass",provider:"p",kind:"legal",title:"cass",url:"u3",content:"المحكمة بالتدقيق وبعد المداولة أما وقف التخصيصات فهو تخصيص منافع مع بقاء رقبتها لبيت المال",authority:"reference",reviewed:false},
  {id:"study",provider:"p",kind:"academic",title:"study",url:"u4",content:"endowment deed (waqfiyya) of Haseki Sultan dated 958 AH /1552 C.E.",authority:"scholarly",reviewed:false},
];

describe("PalWakf deterministic legal skill adapter", () => {
  it("passes a clean grounded draft", () => {
    const draft=[
      "المادة (2) تتناول الأراضي المملوكة [مصدر خارجي 1].",
      "المادة (4) تنظم وقف التخصيصات بوصفه تخصيص منافع مع بقاء الرقبة لبيت المال [مصدر خارجي 1].",
      "السند يذكر أن نوع الأرض وقف خاسكي سلطان، ولا يكفي هذا المقتطف وحده لإثبات أنه وقف تخصيصات [مصدر خارجي 2].",
      "الوقفية مؤرخة 958هـ/1552م [مصدر خارجي 4].",
    ].join("\n");
    const audit=auditLegalDraftWithSkillRules(draft,claims,rows);
    expect(audit.valid).toBe(true);
    expect(audit.defects).toEqual([]);
  });

  it("accepts a faithful long-form statute excerpt cited to the same provision", () => {
    const longClaim: EvidenceClaim = {
      claimId:"LONG-4",sourceId:"law",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"statute",
      exactQuote:"القسم الثاني هو الأراضي المفرزة من الأراضي الأميرية التي أوقفها السلاطين أو أوقفها آخرون بالإذن السلطاني وبما أن وقفية مثل هذه الأراضي هي عبارة عن تخصيص منافع فمثل هذه الأراضي الموقوفة ليست من الأوقاف الصحيحة وتكون رقبتها عائدة إلى بيت المال.",
      citationPointer:"المادة (4)",qualifiers:["رقبتها عائدة إلى بيت المال"],applicabilityStatus:"direct",verificationStatus:"verbatim_match",
    };
    const draft="المادة (4): القسم الثاني هو الأراضي المفرزة من الأراضي الأميرية التي أوقفها السلاطين أو أوقفها آخرون بالإذن السلطاني وبما أن وقفية مثل هذه الأراضي هي عبارة عن تخصيص منافع فمثل هذه الأراضي الموقوفة ليست من الأوقاف الصحيحة وتكون رقبتها عائدة إلى بيت المال [مصدر خارجي 1]";
    expect(auditLegalDraftWithSkillRules(draft,[longClaim],[rows[0]])).toEqual({valid:true,defects:[],details:[]});
  });

  it("does not confuse separated hukr usufruct and waqf raqaba assignments", () => {
    const hukrClaim: EvidenceClaim = {
      claimId:"H1",sourceId:"hukr",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",
      exactQuote:"تقضي بتسجيل رقبة العقار للوقف وملكية حق المنفعة بمقتضى التحكير للمدعي، على أن تسجل ملكية رقبة العقار باسم الوقف وحق الحكر المنفعة باسم المدعي.",
      qualifiers:["رقبة العقار باسم الوقف","حق الحكر المنفعة باسم المدعي"],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match",
    };
    const hukrRow: ResearchSourceResult = {id:"hukr",provider:"p",kind:"legal",title:"حكم الحكر",url:"u",content:hukrClaim.exactQuote,authority:"reference",reviewed:false};
    const draft="المحكمة: تقضي بتسجيل رقبة العقار للوقف وملكية حق المنفعة بمقتضى التحكير للمدعي [مصدر خارجي 1]";
    expect(auditLegalDraftWithSkillRules(draft,[hukrClaim],[hukrRow]).defects).not.toContain("RIGHT_TYPE_CONFLATION");
  });

  it("accepts court reasoning that discusses a statute while citing the judgment", () => {
    const courtClaim: EvidenceClaim = {
      claimId:"CR1",sourceId:"judgment",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning",
      exactQuote:"المحكمة قررت أن الفرق بين الوقف الصحيح ووقف التخصيصات وفق المادة 4 من قانون الأراضي العثماني، وأن رقبة الوقف الصحيح للوقف بينما تبقى رقبة وقف التخصيصات لبيت المال.",
      qualifiers:["رقبة وقف التخصيصات لبيت المال"],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match",
    };
    const courtRow: ResearchSourceResult = {id:"judgment",provider:"p",kind:"legal",title:"نقض 1543/2016",url:"u",content:courtClaim.exactQuote,authority:"reference",reviewed:false};
    const draft="المحكمة: الفرق بين الوقف الصحيح ووقف التخصيصات وفق المادة 4 من قانون الأراضي العثماني، ورقبة وقف التخصيصات لبيت المال [مصدر خارجي 1]";
    expect(auditLegalDraftWithSkillRules(draft,[courtClaim],[courtRow]).defects).not.toContain("CITATION_SOURCE_MISMATCH");
  });

  it("detects article and Haseki overclaim defects", () => {
    const draft=[
      "المادة (2) تقرر أن وقف التخصيصات تخصيص منافع ورقبته لبيت المال [مصدر خارجي 1].",
      "حكم الاستئناف حسم أن وقف خاسكي سلطان هو وقف تخصيصات [مصدر خارجي 2].",
    ].join("\n");
    const audit=auditLegalDraftWithSkillRules(draft,claims,rows);
    expect(new Set(audit.defects)).toEqual(new Set([
      "ARTICLE_2_ARTICLE_4_CONFLATION",
      "HASEKI_CLASSIFICATION_OVERCLAIM",
    ]));
  });

  it("detects party-role, historical and citation defects", () => {
    const draft=[
      "قررت المحكمة أن الأراضي التي تم وقفها وقفاً غير صحيح هي أراضٍ أميرية [مصدر خارجي 2].",
      "وتاريخ إنشاء الوقف ثابت من أعمال التسوية سنة 2014 [مصدر خارجي 2].",
      "والوقفية مؤرخة 958هـ/1552م [مصدر خارجي 2].",
    ].join("\n");
    const audit=auditLegalDraftWithSkillRules(draft,claims,rows);
    expect(new Set(audit.defects)).toEqual(new Set([
      "PARTY_ARGUMENT_AS_COURT_REASONING",
      "HISTORICAL_2014_1552_CONFLATION",
      "CITATION_SOURCE_MISMATCH",
    ]));
  });

  it("detects cassation misapplication and unsupported authority", () => {
    const draft=[
      "قضية النقض 1543/2016 حكمت مباشرة في وقف خاسكي سلطان [مصدر خارجي 3].",
      "كما توجد حجة سلطانية سنة 1550 تؤكد أن وقف خاسكي سلطان وقف تخصيصات [مصدر خارجي 4].",
    ].join("\n");
    const audit=auditLegalDraftWithSkillRules(draft,claims,rows);
    expect(new Set(audit.defects)).toEqual(new Set([
      "CASSATION_DIRECT_HASEKI_MISAPPLICATION",
      "UNSUPPORTED_AUTHORITY_OR_FACT",
      "HASEKI_CLASSIFICATION_OVERCLAIM",
    ]));
  });
});


  it("does not treat an incidental procedural article inside a grounded court holding as a statute claim", () => {
    const localClaims: EvidenceClaim[] = [{
      claimId:"H1",sourceId:"maqam:cassation-1383-2019",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_holding",
      exactQuote:"لهذه الأسباب نقرر قبول الطعن موضوعا وعملا باحكام المادة 237/2-أ والفصل في موضوع الدعوى، والحكم بتسجيل ملكية رقبة العقار باسم الوقف وحق الحكر المنفعة باسم المدعي الطاعن.",
      qualifiers:[],applicabilityStatus:"case_specific",verificationStatus:"verbatim_match",
    }];
    const localRows: ResearchSourceResult[] = [{
      id:"maqam:cassation-1383-2019",provider:"p",kind:"legal",title:"نقض 1383/2019",url:"u",
      content:localClaims[0].exactQuote,authority:"reference",reviewed:false,
    }];
    const draft = "المحكمة: لهذه الأسباب نقرر قبول الطعن موضوعا وعملا باحكام المادة 237/2-أ والفصل في موضوع الدعوى، والحكم بتسجيل ملكية رقبة العقار باسم الوقف وحق الحكر المنفعة باسم المدعي الطاعن. [مصدر خارجي 1]";
    expect(auditLegalDraftWithSkillRules(draft, localClaims, localRows)).toEqual({
      valid:true, defects:[], details:[],
    });
  });
