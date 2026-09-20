import type { ChatGroundingReference } from "./rag";

export const WAQF_RESEARCH_LEARNING_CANDIDATE_ORIGIN = "waqf_research_answer";

function normalizeQuestion(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function buildLearningCandidateKey(question: string) {
  return normalizeQuestion(question).toLowerCase();
}

export function buildLearningCandidateKnowledgeDraft(input: {
  question: string;
  answer: string;
  references: ChatGroundingReference[];
  synthesisMode?: string | null;
  skillRuntime?: any;
  citationAudit?: any;
  semanticAudit?: any;
  legalSkillAudit?: any;
  createdBy?: number | null;
}) {
  const question = normalizeQuestion(input.question);
  const references = (input.references || []).filter(
    reference => Boolean(reference?.sourceUrl || reference?.referenceFileUrl || reference?.title),
  );
  const titleStem = question.length > 100 ? `${question.slice(0, 97)}...` : question;
  const candidateKey = buildLearningCandidateKey(question);

  const citations = references.map((reference, index) => ({
    id: `learning-citation-${index + 1}`,
    title: reference.title,
    sourceUrl: reference.sourceUrl ?? reference.referenceFileUrl ?? null,
    citationType: reference.citationType ?? "research_reference",
    locator: reference.citationLocator ?? null,
    excerpt: reference.citationExcerpt ?? null,
    verificationStatus: "linked",
    metadataJson: {
      citation_verification_status: "linked",
      source_reference_id: reference.id,
    },
  }));

  return {
    title: `مرشح تعلم وقفي — ${titleStem || "بحث موثق"}`,
    content: input.answer,
    category: "law",
    source: "Waqf Research Learning Candidate",
    sourceUrl: references.find(reference => reference.sourceUrl)?.sourceUrl ?? null,
    tags: "learning_candidate,waqf_legal_research",
    createdBy: input.createdBy ?? null,
    status: "review_only",
    reviewDecision: "review_only",
    reviewNotes:
      "مرشح تعلم مولد من جواب بحثي موثق. لا يجوز استخدامه في المحادثة قبل مراجعة بشرية والتحقق الصريح من المصدر والإحالات.",
    reviewedAt: null,
    reviewedBy: null,
    approvalVersion: 0,
    isChatEligible: 0,
    isActive: 0,
    authorityLevel: "reference",
    toolOrigin: WAQF_RESEARCH_LEARNING_CANDIDATE_ORIGIN,
    sourceText: question,
    citations,
    metadataJson: {
      learning_candidate: true,
      candidate_key: candidateKey,
      promotion_policy: "human_verified_only",
      source_verification_status: "pending",
      citation_verification_status: "linked",
      content_status: "production",
      visibility_scope: "internal",
      source_count: references.length,
      synthesis_mode: input.synthesisMode ?? null,
      skill_id: input.skillRuntime?.skillId ?? null,
      skill_status: input.skillRuntime?.status ?? null,
      citation_audit_valid: input.citationAudit?.valid === true,
      semantic_audit_valid: input.semanticAudit?.valid === true,
      legal_skill_audit_valid: input.legalSkillAudit?.valid === true,
    },
  };
}
