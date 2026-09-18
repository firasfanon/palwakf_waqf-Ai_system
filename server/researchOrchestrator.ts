import { invokeLLM } from "./_core/llm";
import type { AuthenticatedUser } from "./_core/types/authUser";
import { fetchFromWikipedia } from "./knowledge-fetchers";
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
  provider: "wikipedia";
  external: true;
};

function contentOf(response: any): string {
  const value = response?.choices?.[0]?.message?.content;
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((part: any) => typeof part === "string" ? part : part?.text || "").join("\n").trim();
  return "";
}
function externalContext(rows: Awaited<ReturnType<typeof fetchFromWikipedia>>): string {
  return rows.slice(0, 4).map((row, index) => [
    `## [مصدر خارجي ${index + 1}] ${row.title}`,
    `الرابط: ${row.url}`,
    row.content.slice(0, 1800),
  ].join("\n")).join("\n\n");
}

function externalReferences(rows: Awaited<ReturnType<typeof fetchFromWikipedia>>): ExternalResearchReference[] {
  return rows.slice(0, 4).map((row, index) => ({
    id: `external:wikipedia:${index + 1}`, title: row.title, category: "external_reference",
    source: "Wikipedia (external discovery source)", sourceUrl: row.url, citationVerificationStatus: "linked",
    visibilityScope: "public", contentStatus: "external_unreviewed", trustEligible: false,
    provider: "wikipedia", external: true,
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
  let externalRows: Awaited<ReturnType<typeof fetchFromWikipedia>> = [];
  if (input.mode === "deep_research" || docs.length < 2) {
    externalRows = await fetchFromWikipedia(input.question, 4).catch(() => []);
  }
  const extContext = externalContext(externalRows);
  const extReferences = externalReferences(externalRows);
  const references = [...internalReferences, ...extReferences];
  const evidenceInstructions = `
أنت محرك بحث وقفي متخصص. لا تختلق مصدرًا أو نصًا أو حكمًا.
ميّز صراحة بين: [ثابت بالمصدر]، [استنتاج تحليلي]، [مختلف فيه]، [غير محسوم].
اربط الادعاءات الجوهرية بالمراجع المتاحة باستخدام [مرجع N] أو [مصدر خارجي N].
المصادر الخارجية غير المراجعة هي للاستكشاف والدعم فقط ولا تتغلب على مصدر رسمي أو وثيقة أصلية.
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
    learningCandidate: { eligible: references.length > 0, status: "pending_verification" as const },
  };
}
