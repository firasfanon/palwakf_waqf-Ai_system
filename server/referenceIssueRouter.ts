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
  if (has(q, /فقه|مذهب|حنفي|مالكي|شافعي|حنبلي|فتوى/u)) {
    classes.add("fiqh");
    domains.add("fiqh");
    reasons.push("fiqh_terms");
  }
  if (has(q, /قرآن|حديث|شرع|شريعة|نص شرعي/u)) {
    classes.add("sharia");
    domains.add("sharia");
    reasons.push("sharia_terms");
  }
  if (has(q, /عثماني|انتداب|تاريخ|حجة|دفتر|طابو|وقفية/u)) {
    classes.add("historical");
    domains.add("historical");
    reasons.push("historical_terms");
  }
  if (
    has(
      q,
      /قطعة|حوض|تسوية|تسجيل|مساحة|سند تسجيل|ملكية|رقبة|منفعة|حكر|إجارتين|عقار/u
    )
  ) {
    classes.add("property_title");
    domains.add("registration_settlement");
    domains.add("lease_hukr");
    reasons.push("property_title_terms");
  }

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

  return {
    issueClass,
    preferredDomains: [...domains],
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
