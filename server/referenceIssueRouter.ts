import type { LegalTerritory } from "./legalReferenceModel";
import type {
  ReferenceCorpusDomain,
  ReferenceCorpusEra,
} from "./referenceCorpus";

export type ReferenceIssueClass =
  | "positive_law"
  | "judicial"
  | "administrative"
  | "fiqh"
  | "sharia"
  | "historical"
  | "property_title"
  | "mixed";

export type ReferenceIssueRoute = {
  issueClass: ReferenceIssueClass;
  preferredDomains: ReferenceCorpusDomain[];
  priorityDomains: ReferenceCorpusDomain[];
  territories: LegalTerritory[];
  preferredEras: ReferenceCorpusEra[];
  requiresLegalStatusVerification: boolean;
  requiresHumanExpertReview: boolean;
  reasons: string[];
};

const has = (value: string, pattern: RegExp) => pattern.test(value);

export function routeReferenceIssue(question: string): ReferenceIssueRoute {
  const q = String(question || "").normalize("NFKC");
  const domains = new Set<ReferenceCorpusDomain>();
  const priorityDomains = new Set<ReferenceCorpusDomain>();
  const reasons: string[] = [];
  const classes = new Set<ReferenceIssueClass>();
  const territories = new Set<LegalTerritory>();
  const preferredEras = new Set<ReferenceCorpusEra>();

  if (has(q, /عثماني|عثمانية|Ottoman/iu)) preferredEras.add("OTTOMAN");
  if (has(q, /انتداب|Mandate/iu)) preferredEras.add("BRITISH_MANDATE");
  if (has(q, /أردني|اردني|Jordanian/iu)) preferredEras.add("JORDANIAN");
  if (has(q, /مصري|Egyptian/iu) && has(q, /غزة|Gaza/iu))
    preferredEras.add("EGYPTIAN_GAZA");

  if (has(q, /غزة|قطاع غزة/u)) territories.add("GAZA");
  if (has(q, /القدس|Jerusalem/iu)) territories.add("JERUSALEM");
  if (
    has(
      q,
      /الضفة|رام الله|الخليل|نابلس|بيت لحم|جنين|طولكرم|قلقيلية|سلفيت|أريحا/u
    )
  )
    territories.add("WEST_BANK");

  if (has(q, /قانون|تشريع|نظام|قرار بقانون|ساري|نافذ|إلغاء|تعديل/u)) {
    classes.add("positive_law");
    if (has(q, /وقف|أوقاف|اوقاف/u)) domains.add("waqf_law");
    if (has(q, /أرض|ارض|أراضي|اراضي/u)) domains.add("land_law");
    if (!domains.has("waqf_law") && !domains.has("land_law")) {
      domains.add("waqf_law");
      domains.add("land_law");
    }
    reasons.push("positive_law_terms");
  }
  if (has(q, /حكم|محكمة|نقض|استئناف|قضاء|سابقة قضائية/u)) {
    classes.add("judicial");
    domains.add("case_law");
    reasons.push("judicial_terms");
  }
  if (has(q, /وزارة|سلطة الأراضي|تعليمات|إجراء|تعميم|لجنة/u)) {
    classes.add("administrative");
    domains.add("administrative");
    reasons.push("administrative_terms");
  }
  if (
    has(
      q,
      /(?:^|[^\p{L}\p{N}])(?:فقه|فقهي|فقهية|مذهب|المذهب|حنفي|الحنفي|مالكي|المالكي|شافعي|الشافعي|حنبلي|الحنبلي|فتوى)(?=$|[^\p{L}\p{N}])/u
    )
  ) {
    classes.add("fiqh");
    domains.add("fiqh");
    reasons.push("fiqh_terms");
  }
  if (has(q, /قرآن|حديث|شرع|شريعة|نص شرعي/u)) {
    classes.add("sharia");
    domains.add("sharia");
    reasons.push("sharia_terms");
  }
  if (
    has(
      q,
      /عثماني|انتداب|تاريخي|تاريخية|دفتر طابو|سجل طابو|وقفية عثمانية|حجة وقفية عثمانية/u
    )
  ) {
    classes.add("historical");
    domains.add("historical");
    reasons.push("historical_terms");
  }

  const hasRegistrationTerms = has(
    q,
    /قطعة|حوض|تسوية|تسجيل|مساحة|سند تسجيل|سجل الأراضي|طابو/u
  );
  const hasLeaseTerms = has(
    q,
    /إيجار|ايجار|إجارة|اجارة|مستأجر|مؤجر|حكر|إجارتين|بدل الإيجار/u
  );
  const hasImmovableTerms = has(
    q,
    /أرض|ارض|أراضي|اراضي|عقار|عقارات|غير المنقول|غير منقول|ملكية|رقبة|منفعة/u
  );
  const hasMovableTerms = has(q, /مال منقول|أموال منقولة|المنقول/u);

  if (hasRegistrationTerms || hasLeaseTerms || hasImmovableTerms) {
    classes.add("property_title");
    if (hasRegistrationTerms) {
      domains.add("registration_settlement");
      priorityDomains.add("registration_settlement");
    }
    if (hasLeaseTerms) {
      domains.add("lease_hukr");
      priorityDomains.add("lease_hukr");
    }
    if (hasImmovableTerms) {
      domains.add("land_law");
      if (!hasRegistrationTerms && !hasLeaseTerms && !hasMovableTerms)
        priorityDomains.add("land_law");
    }
    reasons.push("property_title_terms");
  }
  if (hasMovableTerms) {
    domains.add("finance_investment");
    priorityDomains.add("finance_investment");
    reasons.push("movable_property_terms");
  }

  if (classes.has("historical") && territories.size > 0) {
    territories.add("HISTORIC_PALESTINE");
    if (preferredEras.has("OTTOMAN")) territories.add("OTTOMAN_PALESTINE");
  }

  if (classes.has("judicial")) priorityDomains.add("case_law");
  if (classes.has("fiqh")) priorityDomains.add("fiqh");
  if (classes.has("sharia")) priorityDomains.add("sharia");
  if (
    classes.has("administrative") &&
    !hasRegistrationTerms &&
    !hasLeaseTerms &&
    !hasMovableTerms
  )
    priorityDomains.add("administrative");
  if (
    classes.has("positive_law") &&
    has(q, /وقف|أوقاف|اوقاف/u) &&
    !hasLeaseTerms
  )
    priorityDomains.add("waqf_law");

  if (!territories.size) territories.add("UNKNOWN");
  if (!domains.size) {
    domains.add("waqf_law");
    domains.add("land_law");
    reasons.push("default_waqf_legal_route");
  }

  const issueClass: ReferenceIssueClass =
    classes.size === 0
      ? "mixed"
      : classes.size === 1
        ? [...classes][0]
        : "mixed";

  const explicitWaqfInstrument = has(
    q,
    /قانون الأوقاف|قانون الاوقاف|تعديل قانون الأوقاف|تعديل قانون الاوقاف|قرار بقانون[^؟]{0,80}(?:الأوقاف|الاوقاف)/u
  );
  const orderedPriorityDomains = [
    ...(explicitWaqfInstrument
      ? (["waqf_law"] as ReferenceCorpusDomain[])
      : []),
    ...[...priorityDomains].filter(
      domain => !(explicitWaqfInstrument && domain === "waqf_law")
    ),
  ];

  return {
    issueClass,
    preferredDomains: [...domains],
    priorityDomains: orderedPriorityDomains,
    territories: [...territories],
    preferredEras: [...preferredEras],
    requiresLegalStatusVerification:
      classes.has("positive_law") ||
      classes.has("property_title") ||
      classes.has("judicial"),
    requiresHumanExpertReview:
      classes.has("fiqh") ||
      classes.has("sharia") ||
      classes.has("historical") ||
      classes.has("property_title"),
    reasons,
  };
}
