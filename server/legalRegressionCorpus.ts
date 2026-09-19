import type { EvidenceClaim } from "./evidenceDistillation";
import type { LegalSkillDefect } from "./legalSkillAdapter";
import type { ResearchSourceResult } from "./researchSources";

export type LegalRegressionCase = {
  id: string;
  family: string;
  question: string;
  draft: string;
  expectedDefects: LegalSkillDefect[];
  claims: EvidenceClaim[];
  sources: ResearchSourceResult[];
};

const source = (
  id: string,
  title: string,
  url: string,
  content: string,
): ResearchSourceResult => ({
  id,
  provider: "مقام - جامعة النجاح",
  kind: "legal",
  title,
  url,
  content,
  authority: "reference",
  reviewed: false,
});

const claim = (
  claimId: string,
  sourceId: string,
  sourceIndex: number,
  legalRole: EvidenceClaim["legalRole"],
  exactQuote: string,
  citationPointer?: string,
  qualifiers: string[] = [],
): EvidenceClaim => ({
  claimId,
  sourceId,
  sourceIndex,
  sourceType: "legal",
  authorityClass: "reference",
  legalRole,
  exactQuote,
  citationPointer,
  qualifiers,
  applicabilityStatus: legalRole === "statute" ? "direct" : "case_specific",
  verificationStatus: "verbatim_match",
});

const ottomanLand = source(
  "maqam:ottoman-land-code-1858",
  "قانون الأراضي العثماني 1858",
  "https://maqam.najah.edu/legislation/169/",
  [
    "المادة (1) تقسم الأراضي الكائنة في بلاد الدولة العلية إلى خمسة أقسام: الأراضي المملوكة، الأميرية، الموقوفة، المتروكة، الموات.",
    "المادة (2) الأراضي المملوكة أربعة أنواع.",
    "المادة (4) القسم الثاني هو الأراضي المفرزة من الأراضي الأميرية التي أوقفها السلاطين أو أوقفها آخرون بالإذن السلطاني، ووقفية مثل هذه الأراضي تخصيص منافع، وتكون رقبتها عائدة إلى بيت المال.",
  ].join(" "),
);
const ottomanClaims: EvidenceClaim[] = [
  claim("OLC-1", ottomanLand.id, 1, "statute", "المادة (1) تقسم الأراضي الكائنة في بلاد الدولة العلية إلى خمسة أقسام: الأراضي المملوكة، الأميرية، الموقوفة، المتروكة، الموات.", "المادة (1)"),
  claim("OLC-2", ottomanLand.id, 1, "statute", "المادة (2) الأراضي المملوكة أربعة أنواع.", "المادة (2)"),
  claim("OLC-4", ottomanLand.id, 1, "statute", "المادة (4) القسم الثاني هو الأراضي المفرزة من الأراضي الأميرية التي أوقفها السلاطين أو أوقفها آخرون بالإذن السلطاني، ووقفية مثل هذه الأراضي تخصيص منافع، وتكون رقبتها عائدة إلى بيت المال.", "المادة (4)", ["رقبة الأرض لبيت المال"]),
];

const shariaArt2 = source(
  "maqam:sharia-procedure-art2",
  "المادة 2 من قانون أصول المحاكمات الشرعية رقم 31 لسنة 1959 - اختصاصات المحاكم الشرعية في الوقف",
  "https://maqam.najah.edu/legislation/164/item/9569/",
  "المادة (2) اختصاصات المحاكم الشرعية: تنظر المحاكم الشرعية وتفصل في الوقف وإنشائه من قبل المسلمين وشروطه والتولية عليه واستبداله، وفي الدعاوى المتعلقة بالنزاع بين وقفين أو بصحة الوقف.",
);
const shariaClaims: EvidenceClaim[] = [
  claim("SH-2", shariaArt2.id, 2, "statute", "المادة (2) اختصاصات المحاكم الشرعية: تنظر المحاكم الشرعية وتفصل في الوقف وإنشائه من قبل المسلمين وشروطه والتولية عليه واستبداله، وفي الدعاوى المتعلقة بالنزاع بين وقفين أو بصحة الوقف.", "المادة (2)"),
];

const appeal91 = source(
  "maqam:appeal-91-2017",
  "استئناف القدس 91/2017 - نوع الأرض في بيت جالا",
  "https://maqam.najah.edu/judgments/1531/",
  [
    "يستند هذا الاستئناف في مجمله إلى أن المحكمة أخطأت بعدم الأخذ بحجة الوقف والتقرير، وأخطأت في مخالفة السوابق التي اعتبرت أن جميع أراضي بيت لحم وبيت جالا وقف خاصكي سلطان.",
    "المحكمة: ورد في إخراج القيد أن نوع الأرض ملك ولم يرد عليها أي إشارة إلى أنها وقف. والقول بأن هذه القطعة وقف خاصكي سلطان لأن جميع أراضي بيت لحم وبيت جالا كذلك هو قول قائم على الفرضيات والتقدير وغير قائم على أساس واقعي بل الواقع يشير إلى عكس ذلك.",
  ].join(" "),
);
const appeal91Claims: EvidenceClaim[] = [
  claim(
    "A91-R",
    appeal91.id,
    1,
    "court_reasoning",
    "ورد في إخراج القيد أن نوع الأرض ملك ولم يرد عليها أي إشارة إلى أنها وقف، والقول بأن هذه القطعة وقف خاصكي سلطان لأن جميع أراضي بيت لحم وبيت جالا كذلك هو قول قائم على الفرضيات والتقدير وغير قائم على أساس واقعي بل الواقع يشير إلى عكس ذلك.",
    undefined,
    ["rejects blanket geographic inference"],
  ),
  claim("A91-H", appeal91.id, 1, "court_holding", "قررت المحكمة رد الاستئناف موضوعاً وتأييد الحكم المستأنف."),
];

const cass1383 = source(
  "maqam:cassation-1383-2019",
  "نقض 1383/2019 - الحكر وحق المنفعة ورقبة العقار الوقفي",
  "https://maqam.najah.edu/judgments/7576/",
  [
    "تستند أسباب الطعن إلى أن الدعوى منع معارضة في حق المنفعة والتصرف والقرار في عقار وقفي وأساسها تنفيذ حجة الحكر.",
    "المحكمة: الحكر عقد يكسب المحتكر حقاً عينياً على أرض الوقف يخوله الانتفاع بها مع بقاء رقبة العقار لجهة الوقف.",
    "وقضت المحكمة بتسجيل ملكية رقبة العقار باسم الوقف وحق الحكر (المنفعة) باسم المدعي الطاعن.",
  ].join(" "),
);
const cass1383Claims: EvidenceClaim[] = [
  claim(
    "C1383-R",
    cass1383.id,
    1,
    "court_reasoning",
    "الحكر عقد يكسب المحتكر حقاً عينياً على أرض الوقف يخوله الانتفاع بها، مع بقاء رقبة العقار لجهة الوقف.",
    undefined,
    ["raqaba remains with waqf", "hukr is usufruct/right of benefit"],
  ),
  claim(
    "C1383-H",
    cass1383.id,
    1,
    "court_holding",
    "الحكم بتسجيل ملكية رقبة العقار باسم الوقف وحق الحكر (المنفعة) باسم المدعي الطاعن.",
    undefined,
    ["raqaba to waqf", "hukr benefit to claimant"],
  ),
];

export const BROADER_LEGAL_REGRESSION_CORPUS: LegalRegressionCase[] = [
  {
    id: "land-classification-clean",
    family: "statutory_structure",
    question: "ما الذي تقرره المادة الأولى من قانون الأراضي العثماني؟",
    draft: "المادة (1) تقسم الأراضي إلى خمسة أقسام: المملوكة والأميرية والموقوفة والمتروكة والموات. [مصدر خارجي 1]",
    expectedDefects: [],
    claims: ottomanClaims,
    sources: [ottomanLand],
  },
  {
    id: "land-classification-wrong-provision",
    family: "statutory_structure",
    question: "ما الذي تقرره المادة الأولى من قانون الأراضي العثماني؟",
    draft: "المادة (1) تقرر أن وقف التخصيصات هو تخصيص منافع من أرض أميرية مع بقاء الرقبة لبيت المال. [مصدر خارجي 1]",
    expectedDefects: ["PROVISION_CONTENT_MISATTRIBUTION"],
    claims: ottomanClaims,
    sources: [ottomanLand],
  },
  {
    id: "sharia-jurisdiction-clean",
    family: "statute_identity",
    question: "ما سند اختصاص المحاكم الشرعية في إنشاء الوقف وصحته؟",
    draft: "المادة (2) من قانون أصول المحاكمات الشرعية رقم 31 لسنة 1959 تسند للمحاكم الشرعية مسائل الوقف وإنشائه وصحته. [مصدر خارجي 2]",
    expectedDefects: [],
    claims: [...ottomanClaims, ...shariaClaims],
    sources: [ottomanLand, shariaArt2],
  },
  {
    id: "sharia-jurisdiction-wrong-statute",
    family: "statute_identity",
    question: "ما سند اختصاص المحاكم الشرعية في إنشاء الوقف وصحته؟",
    draft: "المادة (2) من قانون الأراضي العثماني تجعل إنشاء الوقف وصحته من اختصاص المحاكم الشرعية. [مصدر خارجي 2]",
    expectedDefects: ["STATUTE_IDENTITY_CONFLATION"],
    claims: [...ottomanClaims, ...shariaClaims],
    sources: [ottomanLand, shariaArt2],
  },
  {
    id: "appeal91-clean",
    family: "case_scope",
    question: "هل حكم استئناف 91/2017 بأن جميع أراضي بيت لحم وبيت جالا وقف خاصكي سلطان؟",
    draft: "رفضت المحكمة التعميم على القطعة محل الدعوى، واعتبرت القول بأن جميع أراضي بيت لحم وبيت جالا وقف خاصكي سلطان قائماً على الفرضيات وغير قائم على أساس واقعي. [مصدر خارجي 1]",
    expectedDefects: [],
    claims: appeal91Claims,
    sources: [appeal91],
  },
  {
    id: "appeal91-blanket-overclaim",
    family: "case_scope",
    question: "هل حكم استئناف 91/2017 بأن جميع أراضي بيت لحم وبيت جالا وقف خاصكي سلطان؟",
    draft: "حكمت المحكمة بأن جميع أراضي بيت لحم وبيت جالا هي وقف خاصكي سلطان. [مصدر خارجي 1]",
    expectedDefects: ["BLANKET_GEOGRAPHIC_INFERENCE"],
    claims: appeal91Claims,
    sources: [appeal91],
  },
  {
    id: "appeal91-party-as-court",
    family: "judicial_role",
    question: "ما الذي قررته المحكمة بشأن حجة الوقف في استئناف 91/2017؟",
    draft: "قررت المحكمة أن عدم الأخذ بحجة الوقف والتقرير كان خطأ وأن السوابق تثبت أن جميع أراضي بيت لحم وبيت جالا وقف خاصكي سلطان. [مصدر خارجي 1]",
    expectedDefects: ["PARTY_ARGUMENT_AS_COURT_REASONING", "BLANKET_GEOGRAPHIC_INFERENCE"],
    claims: appeal91Claims,
    sources: [appeal91],
  },
  {
    id: "hukr-clean",
    family: "rights_structure",
    question: "ما أثر الحكر على رقبة العقار وحق المنفعة؟",
    draft: "في نقض 1383/2019 بقيت رقبة العقار للوقف، بينما سُجل حق الحكر (المنفعة) باسم المدعي الطاعن. [مصدر خارجي 1]",
    expectedDefects: [],
    claims: cass1383Claims,
    sources: [cass1383],
  },
  {
    id: "hukr-rights-reversed",
    family: "rights_structure",
    question: "ما أثر الحكر على رقبة العقار وحق المنفعة؟",
    draft: "الحكر ينقل ملكية رقبة العقار إلى المحتكر، ويترك للوقف مجرد منفعة. [مصدر خارجي 1]",
    expectedDefects: ["RIGHT_TYPE_CONFLATION"],
    claims: cass1383Claims,
    sources: [cass1383],
  },
  {
    id: "hukr-wrong-citation",
    family: "citation_ownership",
    question: "ما أثر الحكر على رقبة العقار وحق المنفعة؟",
    draft: "الحكر يبقي رقبة العقار للوقف ويمنح المحتكر حق المنفعة. [مصدر خارجي 2]",
    expectedDefects: ["CITATION_SOURCE_MISMATCH"],
    claims: [...cass1383Claims.map(c => ({ ...c, sourceIndex: 1 })), ...shariaClaims],
    sources: [cass1383, shariaArt2],
  },
  {
    id: "unsupported-invented-statute",
    family: "unsupported_authority",
    question: "ما النص المنظم للحكر؟",
    draft: "المادة (7) من قانون الحكر لسنة 1900 تقرر انتقال ملكية الرقبة إلى المحتكر.",
    expectedDefects: ["UNSUPPORTED_AUTHORITY_OR_FACT"],
    claims: cass1383Claims,
    sources: [cass1383],
  },
];
