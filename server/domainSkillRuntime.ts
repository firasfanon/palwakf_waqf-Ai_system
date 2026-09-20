import type { ResearchSourceResult } from "./researchSources";

export const WAQF_LEGAL_EVIDENCE_SKILL_ID =
  "PALWAKF_WAQF_LEGAL_EVIDENCE_ASSURANCE_V1" as const;
export const WAQF_LEGAL_RESEARCH_DOMAIN =
  "WAQF_LEGAL_RESEARCH_HIGH_ASSURANCE" as const;

export type WaqfLegalSkillRuntimeStatus =
  | "active"
  | "inactive_outside_domain"
  | "fail_closed_missing_verified_legal_evidence";

export type WaqfLegalSkillRuntimeBinding = {
  skillId: typeof WAQF_LEGAL_EVIDENCE_SKILL_ID;
  domainProfile: typeof WAQF_LEGAL_RESEARCH_DOMAIN;
  canonicalClass: "DOMAIN";
  projectBindingAuthorized: true;
  globalAutomaticLoading: false;
  applicable: boolean;
  applied: boolean;
  status: WaqfLegalSkillRuntimeStatus;
  reason: string;
  evidenceKinds: string[];
  authorityGrants: {
    network: false;
    filesystem: false;
    git: false;
    database: false;
    secrets: false;
    production: false;
  };
};

const normalize = (value: string) =>
  value.replace(/ـ/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase();
function hasWaqfDomainCue(question: string) {
  const q = normalize(question);
  return /(وقف|اوقاف|وقفي|وقفيه|حكر|تحكير|تخصيصات|متولي|استبدال)/u.test(q);
}

function hasLegalCue(question: string) {
  const q = normalize(question);
  return /(قانون|الماده|محكم|حكم|استئناف|نقض|اختصاص|دعوي|قضيه|ملكيه|رقبه|حق المنفعه|سند|تسجيل|تسويه)/u.test(q);
}

export function resolveWaqfLegalEvidenceSkillBinding(
  question: string,
  sources: ResearchSourceResult[],
): WaqfLegalSkillRuntimeBinding {
  const evidenceKinds = [...new Set(sources.map(source => source.kind).filter(Boolean))].sort();
  const hasVerifiedLegalEvidence = sources.some(
    source => source.kind === "legal" && Boolean(source.content?.trim()),
  );
  const questionTargetsDomain = hasWaqfDomainCue(question) && hasLegalCue(question);
  const applicable = hasVerifiedLegalEvidence || questionTargetsDomain;

  let status: WaqfLegalSkillRuntimeStatus = "inactive_outside_domain";
  let reason = "QUESTION_AND_EVIDENCE_OUTSIDE_WAQF_LEGAL_HIGH_ASSURANCE_DOMAIN";
  let applied = false;

  if (hasVerifiedLegalEvidence) {
    status = "active";
    reason = questionTargetsDomain
      ? "WAQF_LEGAL_QUESTION_WITH_VERIFIED_LEGAL_EVIDENCE"
      : "VERIFIED_LEGAL_EVIDENCE_ENTERED_WAQF_LEGAL_HIGH_ASSURANCE_PATH";
    applied = true;
  } else if (questionTargetsDomain) {
    status = "fail_closed_missing_verified_legal_evidence";
    reason = "WAQF_LEGAL_QUESTION_REQUIRES_VERIFIED_LEGAL_EVIDENCE";
  }

  return {    skillId: WAQF_LEGAL_EVIDENCE_SKILL_ID,
    domainProfile: WAQF_LEGAL_RESEARCH_DOMAIN,
    canonicalClass: "DOMAIN",
    projectBindingAuthorized: true,
    globalAutomaticLoading: false,
    applicable,
    applied,
    status,
    reason,
    evidenceKinds,
    authorityGrants: {
      network: false,
      filesystem: false,
      git: false,
      database: false,
      secrets: false,
      production: false,
    },
  };
}
