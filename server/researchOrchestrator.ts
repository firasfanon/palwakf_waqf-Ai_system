import { invokeLLM } from "./_core/llm";
import type { AuthenticatedUser } from "./_core/types/authUser";
import { searchExternalResearch, searchExternalResearchMany, type ResearchSourceResult } from "./researchSources";
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
function externalContext(rows: ResearchSourceResult[]): string {
  return rows.slice(0, 4).map((row, index) => [
    `## [مصدر خارجي ${index + 1}] ${row.title}`,
    `المزود: ${row.provider} | النوع: ${row.kind}`,
    `الرابط: ${row.url}`,
    row.content.slice(0, 1800),
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
  const docs = await retrieveRelevantDocuments(input.question, {
    limit: input.mode === "deep_research" ? 8 : 5, minScore: 1, actor: input.actor, scopeCodes: input.scopeCodes,
  });
  const internalReferences = buildGroundingReferences(docs as any);
  const internalContext = extractRelevantContext(input.question, docs as any, input.mode === "deep_research" ? 6500 : 3000);
  const deep = input.mode === "deep_research";
  let externalRows: ResearchSourceResult[] = [];
  let researchQueries = [input.question];
  if (deep) researchQueries = await planResearchQueries(input.question).catch(() => [input.question]);
  if (deep || docs.length < 2) {
    externalRows = deep ? await searchExternalResearchMany(researchQueries, true).catch(() => []) : await searchExternalResearch(input.question, false).catch(() => []);
  }
  const extContext = externalContext(externalRows);
  const extReferences = externalReferences(externalRows);
  const references = [...internalReferences, ...extReferences];
  const evidenceInstructions = `
أنت محرك بحث وقفي متخصص. لا تختلق مصدرًا أو نصًا أو حكمًا.
ميّز صراحة بين: [ثابت بالمصدر]، [استنتاج تحليلي]، [مختلف فيه]، [غير محسوم].
اربط الادعاءات الجوهرية بالمراجع المتاحة باستخدام [مرجع N] أو [مصدر خارجي N].
رتّب قوة الدليل: الوثيقة الأصلية والتشريع والحكم الأصلي ثم المصدر الرسمي ثم البحث الأكاديمي ثم المرجع الثانوي ثم المصدر الاكتشافي.
OpenAlex وCrossref فهارس اكتشاف أكاديمية، وWikipedia مصدر اكتشافي؛ لا تستخدم أيًا منها منفردًا لحسم مسألة قانونية أو فقهية أو تاريخية متنازعًا عليها.
إذا كانت الأدلة غير كافية فقل ذلك وحدد ما يلزم للتحقق بدل إنتاج يقين زائف.
في البحث المعمق: حلل السؤال إلى مسائل، قارن الأدلة، اذكر التعارضات، ثم قدم خلاصة وحدودها.`;
  const systemPrompt = generateSystemPrompt(internalContext, {
    platformContext: [evidenceInstructions, extContext].filter(Boolean).join("\n\n"),
  });
  const response = await invokeLLM({ messages: [
    { role: "system", content: systemPrompt }, { role: "user", content: input.question },
  ] });
  const answer = contentOf(response) || "تعذر توليد إجابة موثقة من الأدلة المتاحة.";
  return {
    answer, references, mode: input.mode, internalEvidenceCount: internalReferences.length,
    externalEvidenceCount: extReferences.length, externalResearchUsed: extReferences.length > 0,
    externalProviders: [...new Set(externalRows.map(row => row.provider))], researchQueries,
    learningCandidate: { eligible: references.length > 0, status: "pending_verification" as const, promotionPolicy: "human_verified_only" as const, sourceCount: references.length },
  };
}
