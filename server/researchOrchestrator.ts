import { invokeLLM } from "./_core/llm";
import type { AuthenticatedUser } from "./_core/types/authUser";
import { searchExternalResearch, searchExternalResearchMany, type ResearchSourceResult } from "./researchSources";
import { detectHardwareAdaptiveProfile } from "./hardwareAdaptiveRuntime";
import { auditCompactEvidencePack, compactEvidencePack, distillEvidenceClaims, verifyEvidenceClaims, type EvidenceClaim } from "./evidenceDistillation";
import { synthesizeStructuredLegalEvidence } from "./legalEvidenceSynthesis";
import {
  buildGroundingReferences,
  extractRelevantContext,
  generateSystemPrompt,
  retrieveRelevantDocuments,
  type ChatGroundingReference,
} from "./rag";

export type ResearchMode = "answer" | "deep_research";
export type ResearchEvidenceState = "established" | "inference" | "contested" | "unresolved";

export type ExternalResearchReference = ChatGroundingReference & {
  provider: string;
  external: true;
  sourceKind: string;
  authority: string;
  reviewed: boolean;
};

function contentOf(response: any): string {
  const value = response?.choices?.[0]?.message?.content;
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((part: any) => typeof part === "string" ? part : part?.text || "").join("\n").trim();
  return "";
}
function parseQueryPlan(raw: string, fallback: string): string[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [fallback];
  try {
    const parsed = JSON.parse(match[0]);
    return [fallback, ...(Array.isArray(parsed) ? parsed : [])].filter(x => typeof x === "string").slice(0, 4);
  } catch { return [fallback]; }
}
async function planResearchQueries(question: string): Promise<string[]> {
  const response = await invokeLLM({ messages: [
    { role: "system", content: "حوّل السؤال الوقفي إلى 3 استعلامات بحث قصيرة ودقيقة. استخدم العربية والإنجليزية أو التركية العثمانية المنقحرة عند فائدة ذلك. أعد JSON array فقط دون شرح." },
    { role: "user", content: question },
  ] });
  return parseQueryPlan(contentOf(response), question);
}
function externalContext(rows: ResearchSourceResult[], charsPerSource: number): string {
  return rows.slice(0, 4).map((row, index) => [
    `## [مصدر خارجي ${index + 1}] ${row.title}`,
    `المزود: ${row.provider} | النوع: ${row.kind}`,
    `الرابط: ${row.url}`,
    row.content.slice(0, charsPerSource),
  ].join("\n")).join("\n\n");
}

function externalReferences(rows: ResearchSourceResult[]): ExternalResearchReference[] {
  return rows.map((row, index) => ({
    id: row.id || `external:${index + 1}`, title: row.title, category: `external_${row.kind}`,
    source: `${row.provider} (${row.authority})`, sourceUrl: row.url, citationVerificationStatus: "linked",
    visibilityScope: "public", contentStatus: row.reviewed ? "reviewed" : "external_unreviewed", trustEligible: row.reviewed,
    provider: row.provider, external: true, sourceKind: row.kind, authority: row.authority, reviewed: row.reviewed,
  }));
}

export async function runResearchAnswer(input: {
  question: string; mode: ResearchMode; actor: Partial<AuthenticatedUser> | null; scopeCodes: string[];
}) {
  const startedAt = Date.now();
  console.log("[research] start", { mode: input.mode, questionChars: input.question.length });
  const docs = await retrieveRelevantDocuments(input.question, {
    limit: input.mode === "deep_research" ? 8 : 5, minScore: 1, actor: input.actor, scopeCodes: input.scopeCodes,
  });
  console.log("[research] internal-ready", { elapsedMs: Date.now() - startedAt, docs: docs.length });
  const internalReferences = buildGroundingReferences(docs as any);
  const internalContext = extractRelevantContext(input.question, docs as any, input.mode === "deep_research" ? 6500 : 3000);
  const deep = input.mode === "deep_research";
  let externalRows: ResearchSourceResult[] = [];
  let researchQueries = [input.question];
  if (deep) researchQueries = await planResearchQueries(input.question).catch(() => [input.question]);
  if (deep || docs.length < 2) {
    externalRows = deep
      ? await searchExternalResearchMany(researchQueries, true).catch(() => [])
      : await searchExternalResearch(input.question, false).catch(() => []);
    if (!deep && externalRows.length === 0) {
      externalRows = await searchExternalResearch(input.question, true).catch(() => []);
    }
  }
  console.log("[research] external-ready", { elapsedMs: Date.now() - startedAt, external: externalRows.length });
  const hardwareProfile = await detectHardwareAdaptiveProfile();
  const evidenceRows = externalRows.filter(row => Boolean(row.content?.trim()));
  const evidenceClaims = distillEvidenceClaims(input.question, evidenceRows, 3200);
  const strictEvidenceDistillation =
    evidenceClaims.length > 0 &&
    evidenceRows.some(row => row.kind === "legal" || row.kind === "academic" || row.kind === "archival");
  const evidenceVerified = !strictEvidenceDistillation || verifyEvidenceClaims(evidenceClaims, evidenceRows);
  const retentionAudit = strictEvidenceDistillation
    ? auditCompactEvidencePack(input.question, evidenceClaims, Math.min(4, evidenceRows.length))
    : { valid: true, missing: [] as string[], partyArgumentLeak: false, sourceCoverage: [] as number[] };
  if (strictEvidenceDistillation && (!evidenceVerified || !retentionAudit.valid)) {
    throw new Error("UNRESOLVED_EVIDENCE_DISTILLATION");
  }
  const extContext = strictEvidenceDistillation
    ? compactEvidencePack(evidenceClaims)
    : externalContext(evidenceRows, hardwareProfile.budgets.evidenceCharsPerSource);
  const evidenceBudgetChars =
    hardwareProfile.budgets.evidenceCharsPerSource * Math.max(1, Math.min(4, evidenceRows.length));
  if (strictEvidenceDistillation && extContext.length > evidenceBudgetChars) {
    throw new Error("UNRESOLVED_INSUFFICIENT_CAPACITY");
  }
  const extReferences = externalReferences(evidenceRows);
  const references = [...internalReferences, ...extReferences];
  const evidenceInstructions = `
أنت محرك بحث وقفي متخصص. لا تختلق مصدرًا أو نصًا أو حكمًا.
ميّز صراحة بين: [ثابت بالمصدر]، [استنتاج تحليلي]، [مختلف فيه]، [غير محسوم].
اربط الادعاءات الجوهرية بالمراجع المتاحة باستخدام [مرجع N] أو [مصدر خارجي N].
رتّب قوة الدليل: الوثيقة الأصلية والتشريع والحكم الأصلي ثم المصدر الرسمي ثم البحث الأكاديمي ثم المرجع الثانوي ثم المصدر الاكتشافي.
OpenAlex وCrossref فهارس اكتشاف أكاديمية، وWikipedia مصدر اكتشافي؛ لا تستخدم أيًا منها منفردًا لحسم مسألة قانونية أو فقهية أو تاريخية متنازعًا عليها.
إذا كانت الأدلة غير كافية فقل ذلك وحدد ما يلزم للتحقق بدل إنتاج يقين زائف.
لا تنقل حكم مادة قانونية إلى مادة أخرى، ولا تنقل قول خصم إلى المحكمة، ولا تستنتج تصنيفًا قانونيًا لعقار أو وقف من مجرد الاسم المسجل.
إذا كان الربط بين كيان بعينه وتصنيف قانوني مشروطًا أو غير محسوم فصغه بوضوح كشرط أو كمسألة غير محسومة.
في الإجابة العادية اختصر النتيجة في نقاط قليلة مع إحالة كل نتيجة جوهرية إلى مصدرها.
في البحث المعمق: حلل السؤال إلى مسائل، قارن الأدلة، اذكر التعارضات، ثم قدم خلاصة وحدودها.`;
  const systemPrompt = generateSystemPrompt(internalContext, {
    platformContext: [evidenceInstructions, extContext].filter(Boolean).join("\n\n"),
  });
  console.log("[research] evidence-pack-ready", { elapsedMs: Date.now() - startedAt, internalChars: internalContext.length, externalChars: extContext.length, references: references.length });

  let synthesisMode: "structured_legal_sections" | "monolithic" = "monolithic";
  let sectionModels: string[] = [];
  let answer = "";
  if (strictEvidenceDistillation) {
    const structured = await synthesizeStructuredLegalEvidence(input.question, evidenceClaims);
    if (structured) {
      synthesisMode = "structured_legal_sections";
      sectionModels = structured.sections.map(section => section.model);
      answer = structured.answer;
    }
  }
  if (!answer) {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.question },
      ],
      maxTokens: deep ? 256 : 160,
    });
    answer = contentOf(response) || "تعذر توليد إجابة موثقة من الأدلة المتاحة.";
  }
  const requiredExternalCitations = strictEvidenceDistillation
    ? [...new Set(evidenceClaims.map(claim => claim.sourceIndex))]
    : [];
  const citationAudit = auditResearchAnswer(
    answer,
    internalReferences.length,
    extReferences.length,
    requiredExternalCitations,
  );
  const semanticAudit = strictEvidenceDistillation
    ? auditResearchSemantics(input.question, answer, evidenceClaims)
    : { valid: true, missing: [] as string[], conflations: [] as string[] };
  if (!citationAudit.valid) {
    const reason = citationAudit.invalidTokens.length
      ? `INVALID_CITATIONS: ${citationAudit.invalidTokens.join("، ")}`
      : citationAudit.missingRequiredExternal.length
        ? `MISSING_REQUIRED_EXTERNAL: ${citationAudit.missingRequiredExternal.join(",")}`
        : "NO_VALID_CITATION";
    answer = `[غير محسوم] UNRESOLVED_CITATION_VALIDATION_FAILURE: ${reason}. لم تُعتمد الإجابة لأن بوابة الإحالات لم تنجح.`;
  } else if (!semanticAudit.valid) {
    answer = `[غير محسوم] UNRESOLVED_SEMANTIC_ANSWER_FAILURE: missing=${semanticAudit.missing.join(",") || "none"}; conflations=${semanticAudit.conflations.join(",") || "none"}. لم تُعتمد الإجابة لأن بوابة المطابقة الدلالية لم تنجح.`;
  }
  return {
    answer, references, citationAudit, semanticAudit, synthesisMode, sectionModels, mode: input.mode, internalEvidenceCount: internalReferences.length,
    externalEvidenceCount: extReferences.length, externalResearchUsed: extReferences.length > 0,
    externalProviders: [...new Set(externalRows.map(row => row.provider))], researchQueries,
    learningCandidate: { eligible: references.length > 0, status: "pending_verification" as const, promotionPolicy: "human_verified_only" as const, sourceCount: references.length },
  };
}

export type SemanticAnswerAudit = {
  valid: boolean;
  missing: string[];
  conflations: string[];
};

function normalizeAuditText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function auditResearchSemantics(
  question: string,
  answer: string,
  claims: EvidenceClaim[],
): SemanticAnswerAudit {
  const q = normalizeAuditText(question);
  const a = normalizeAuditText(answer);
  const missing: string[] = [];
  const conflations: string[] = [];
  const sentences = a.split(/[.!؟\n]+/u).map(normalizeAuditText).filter(Boolean);

  if (/المادة\s*(?:الثانية|2|\(2\))/u.test(q)) {
    if (!/المادة\s*(?:الثانية|2|\(2\))/u.test(a)) missing.push("ARTICLE_2");
    if (!/الأراضي\s+المملوكة/u.test(a)) missing.push("ARTICLE_2_SCOPE");
    const article2Sentence = sentences.find(s => /المادة\s*(?:الثانية|2|\(2\))/u.test(s));
    if (article2Sentence && /(وقف\s+التخصيصات|تخصيص\s+منافع|بيت\s+المال|أوقفها\s+حضرات?\s+السلاطين)/u.test(article2Sentence)) {
      conflations.push("ARTICLE_2_WITH_ARTICLE_4_RULE");
    }
  }

  if (/تخصيصات|وقف\s+غير\s+صحيح/u.test(q)) {
    if (!/المادة\s*(?:الرابعة|4|\(4\))/u.test(a)) missing.push("ARTICLE_4");
    if (!/(وقف\s+التخصيصات|وقف\s+غير\s+صحيح|تخصيص\s+منافع)/u.test(a)) missing.push("TAKHSISAT_RULE");
    if (!/بيت\s+المال/u.test(a)) missing.push("TREASURY_QUALIFIER");
  }

  if (/خاصكي|خاسكي|Haseki/iu.test(q)) {
    if (!/(خاصكي|خاسكي)\s+سلطان|Haseki\s+Sultan/iu.test(a)) missing.push("HASEKI");
    const hasekiClassification = sentences.find(s =>
      /((خاصكي|خاسكي)\s+سلطان|Haseki\s+Sultan)/iu.test(s) &&
      /(وقف\s+التخصيصات|وقف\s+غير\s+صحيح)/u.test(s)
    );
    if (
      hasekiClassification &&
      !/(إذا|إن\s+ثبت|بافتراض|على\s+فرض|في\s+حال|إذا\s+اعتبر|غير\s+محسوم|لا\s+يثبت|لا\s+تكفي|لا\s+يمكن\s+الجزم)/u.test(hasekiClassification)
    ) {
      conflations.push("HASEKI_CLASSIFICATION_OVERCLAIM");
    }
  }

  if (/طبيعة\s+إنشائه|طبيعة\s+انشائه|إنشائه|انشائه/u.test(q)) {
    if (!/(1552|958\s*(?:هـ|AH))/iu.test(a)) missing.push("HISTORICAL_DATE");
    if (!/(وقفية|waqfiyya|endowment deed)/iu.test(a)) missing.push("WAQFIYYA");
  }

  const citedSourceIndexes = new Set(claims.map(c => c.sourceIndex));
  if (citedSourceIndexes.size === 0) missing.push("NO_EVIDENCE_CLAIMS");

  return { valid: missing.length === 0 && conflations.length === 0, missing, conflations };
}

export type CitationAudit = {
  valid: boolean;
  citedInternal: number[];
  citedExternal: number[];
  invalidTokens: string[];
  missingRequiredExternal: number[];
  uncitedSourceCount: number;
  evidenceStateCounts: Record<ResearchEvidenceState, number>;
};
export function auditResearchAnswer(
  answer: string,
  internalCount: number,
  externalCount: number,
  requiredExternal: number[] = [],
): CitationAudit {
  const internal = [...answer.matchAll(/\[مرجع\s+(\d+)\]/g)].map(m => Number(m[1]));
  const external = [...answer.matchAll(/\[مصدر خارجي\s+(\d+)\]/g)].map(m => Number(m[1]));
  const invalidTokens = [
    ...internal.filter(n => n < 1 || n > internalCount).map(n => `[مرجع ${n}]`),
    ...external.filter(n => n < 1 || n > externalCount).map(n => `[مصدر خارجي ${n}]`),
  ];
  const citedExternal = [...new Set(external)];
  const missingRequiredExternal = [...new Set(requiredExternal)]
    .filter(n => n >= 1 && n <= externalCount && !citedExternal.includes(n));
  const evidenceStateCounts: Record<ResearchEvidenceState, number> = {
    established: (answer.match(/\[ثابت بالمصدر\]/g) || []).length,
    inference: (answer.match(/\[استنتاج تحليلي\]/g) || []).length,
    contested: (answer.match(/\[مختلف فيه\]/g) || []).length,
    unresolved: (answer.match(/\[غير محسوم\]/g) || []).length,
  };
  const cited = new Set([...internal.map(n => `i:${n}`), ...external.map(n => `e:${n}`)]).size;
  const hasCitation = internal.length + external.length > 0;
  return {
    valid: invalidTokens.length === 0 && hasCitation && missingRequiredExternal.length === 0,
    citedInternal: [...new Set(internal)],
    citedExternal,
    invalidTokens,
    missingRequiredExternal,
    uncitedSourceCount: Math.max(0, internalCount + externalCount - cited),
    evidenceStateCounts,
  };
}
