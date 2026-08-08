import { getWaqfCases, getMinisterialInstructions } from "./db";
import { runtimeGetKnowledgeDocuments } from "./runtimeRepository";
import { knowledgeDocuments, waqfCases, ministerialInstructions } from "../drizzle/schema";

type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
type WaqfCase = typeof waqfCases.$inferSelect;
type MinisterialInstruction = typeof ministerialInstructions.$inferSelect;
import { generateEmbeddings, hybridSearch } from "./embeddings";
import { applyTrustMetadata, assessKnowledgeTrust } from "./assistantTrust";
import type { AuthenticatedUser } from "./_core/types/authUser";

type GroundedKnowledgeDocument = KnowledgeDocument & {
  uuid?: string;
  source?: string | null;
  sourceUrl?: string | null;
  referenceDocumentId?: string | null;
  referenceDocument?: any;
  documentFiles?: any[];
  citations?: any[];
  trust?: any;
  isTrustEligible?: boolean;
  citationVerificationStatus?: 'missing' | 'linked' | 'verified' | 'rejected';
  visibilityScope?: 'public' | 'internal' | 'restricted';
  contentStatus?: string;
};

export type ChatGroundingReference = {
  id: number | string;
  uuid?: string;
  title: string;
  category: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string | null;
  relevanceScore?: number;
  referenceDocumentId?: string | null;
  referenceDocumentTitle?: string | null;
  referenceFileId?: string | null;
  referenceFileName?: string | null;
  referenceFileUrl?: string | null;
  citationType?: string | null;
  citationLocator?: string | null;
  citationExcerpt?: string | null;
  citationsCount?: number;
  authorityLevel?: string | null;
  citationVerificationStatus?: 'missing' | 'linked' | 'verified' | 'rejected';
  visibilityScope?: 'public' | 'internal' | 'restricted';
  contentStatus?: string | null;
  trustEligible?: boolean;
};

type SearchableItem = 
  | (KnowledgeDocument & { sourceType: 'knowledge' })
  | (WaqfCase & { sourceType: 'case' })
  | (MinisterialInstruction & { sourceType: 'instruction' });

/**
 * Calculate relevance score for knowledge documents
 */
function calculateKnowledgeRelevanceScore(query: string, document: KnowledgeDocument): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  const documentText = `${document.title} ${document.content}`.toLowerCase();

  let score = 0;

  // Score based on title matches (higher weight)
  const titleText = document.title.toLowerCase();
  for (const term of queryTerms) {
    // Exact word match gets higher score
    const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
    if (wordBoundaryRegex.test(titleText)) {
      score += 10; // Exact match in title
    } else if (titleText.includes(term)) {
      score += 5; // Partial match
    }
  }

  // Score based on tags matches (very high weight)
  if (document.tags) {
    const tags = document.tags.toLowerCase();
    for (const term of queryTerms) {
      // Exact tag match
      const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (wordBoundaryRegex.test(tags)) {
        score += 15; // Exact tag match - highest priority
      } else if (tags.includes(term)) {
        score += 8; // Partial tag match
      }
    }
  }

  // Score based on content matches (with diminishing returns)
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = documentText.match(regex);
    if (matches) {
      // Diminishing returns: first 5 matches count more
      const matchCount = Math.min(matches.length, 10);
      score += matchCount > 5 ? 5 + (matchCount - 5) * 0.5 : matchCount;
    }
  }

  // Bonus for category relevance
  const categoryKeywords: Record<string, string[]> = {
    law: ["قانون", "تشريع", "نظام", "مادة"],
    jurisprudence: ["فقه", "شرع", "حكم", "فتوى"],
    majalla: ["مجلة", "عدلية", "عثماني"],
    historical: ["تاريخ", "عثماني", "وثيقة"],
    administrative: ["إدارة", "وزارة", "مجلس", "ناظر"],
  };

  const categoryTerms = categoryKeywords[document.category] || [];
  for (const term of queryTerms) {
    if (categoryTerms.some((catTerm) => term.includes(catTerm) || catTerm.includes(term))) {
      score += 3;
    }
  }

  // Boost score for documents with multiple query terms
  const termsFound = queryTerms.filter(term => documentText.includes(term)).length;
  if (termsFound > 1) {
    score *= (1 + termsFound * 0.1); // 10% boost per additional term
  }

  // Penalize very short or very long documents
  const contentLength = document.content.length;
  if (contentLength < 100) {
    score *= 0.7; // Too short
  } else if (contentLength > 10000) {
    score *= 0.9; // Too long
  }

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate relevance score for waqf cases
 */
function calculateCaseRelevanceScore(query: string, waqfCase: WaqfCase): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  const caseText = `${waqfCase.title} ${waqfCase.description} ${waqfCase.caseNumber}`.toLowerCase();

  let score = 0;

  // Score based on title matches (higher weight)
  const titleText = waqfCase.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleText.includes(term)) {
      score += 5;
    }
  }

  // Score based on case number exact match
  if (queryTerms.some(term => waqfCase.caseNumber.toLowerCase().includes(term))) {
    score += 10;
  }

  // Score based on content matches
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = caseText.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  // Bonus for case type relevance
  const caseTypeKeywords: Record<string, string[]> = {
    ownership_dispute: ["ملكية", "نزاع", "تملك"],
    boundary_dispute: ["حدود", "حد", "تخطيط"],
    usage_violation: ["مخالفة", "استخدام", "تجاوز"],
    inheritance: ["ميراث", "ورثة", "تركة"],
    management_dispute: ["إدارة", "ناظر", "متولي"],
    encroachment: ["تعدي", "اعتداء", "احتلال"],
  };

  const caseTerms = caseTypeKeywords[waqfCase.caseType] || [];
  for (const term of queryTerms) {
    if (caseTerms.some((catTerm) => term.includes(catTerm) || catTerm.includes(term))) {
      score += 3;
    }
  }

  return score;
}

/**
 * Calculate relevance score for ministerial instructions
 */
function calculateInstructionRelevanceScore(query: string, instruction: MinisterialInstruction): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  const instructionText = `${instruction.title} ${instruction.content} ${instruction.instructionNumber}`.toLowerCase();

  let score = 0;

  // Score based on title matches (higher weight)
  const titleText = instruction.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleText.includes(term)) {
      score += 5;
    }
  }

  // Score based on instruction number exact match
  if (queryTerms.some(term => instruction.instructionNumber.toLowerCase().includes(term))) {
    score += 10;
  }

  // Score based on content matches
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = instructionText.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  // Bonus for type relevance
  const typeKeywords: Record<string, string[]> = {
    circular: ["تعميم", "منشور"],
    instruction: ["تعليمات", "توجيه"],
    decision: ["قرار", "حكم"],
    regulation: ["لائحة", "نظام"],
    guideline: ["دليل", "إرشاد"],
  };

  const typeTerms = typeKeywords[instruction.type] || [];
  for (const term of queryTerms) {
    if (typeTerms.some((catTerm) => term.includes(catTerm) || catTerm.includes(term))) {
      score += 3;
    }
  }

  return score;
}

function calculateGroundingBoost(document: any): number {
  const trust = assessKnowledgeTrust(document);
  const citationsCount = Array.isArray(document?.citations) ? document.citations.length : 0;
  const filesCount = Array.isArray(document?.documentFiles) ? document.documentFiles.length : 0;
  const approvalBoost = typeof document?.approvalVersion === 'number' ? Math.min(document.approvalVersion, 3) * 1.5 : 0;
  const citationBoost = trust.citationStatus === 'verified' ? 14 : trust.citationStatus === 'linked' ? 5 : -8;
  const authorityBoost = trust.authorityLevel === 'official' ? 12 : trust.authorityLevel === 'semi_official' ? 7 : trust.authorityLevel === 'reference' ? 3 : -4;
  const fileBoost = filesCount > 0 ? 2 : 0;
  const trustPenalty = trust.contentStatus === 'test' || trust.contentStatus === 'duplicate' ? -100 : 0;
  return approvalBoost + citationBoost + authorityBoost + fileBoost + Math.min(citationsCount, 3) + trustPenalty;
}

/**
 * Retrieve relevant documents for a given query
 * Uses hybrid search (semantic + keyword-based)
 */
export async function retrieveRelevantDocuments(
  query: string,
  options?: {
    category?: string;
    limit?: number;
    minScore?: number;
    useSemanticSearch?: boolean;
    actor?: Partial<AuthenticatedUser> | null;
    scopeCodes?: string[];
  }
): Promise<Array<GroundedKnowledgeDocument & { relevanceScore: number }>> {
  const { category, limit = 5, minScore = 1, useSemanticSearch = true, actor = null, scopeCodes = [] } = options || {};

  // Get all documents (or filtered by category)
  const rawDocuments = await runtimeGetKnowledgeDocuments({
    category,
    isActive: 1,
  });
  const documents = rawDocuments
    .map((doc: any) => applyTrustMetadata(doc, actor, scopeCodes))
    .filter((doc: any) => doc.isTrustEligible);

  // If semantic search is disabled or no embeddings available, use keyword-only
  const hasEmbeddings = documents.some(doc => doc.embedding);
  if (!useSemanticSearch || !hasEmbeddings) {
    // Fallback to keyword-based search
    const scoredDocuments = documents
      .map((doc) => ({
        ...doc,
        relevanceScore: calculateKnowledgeRelevanceScore(query, doc) + calculateGroundingBoost(doc),
      }))
      .filter((doc) => doc.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredDocuments;
  }

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbeddings(query);

    // Calculate keyword scores for all documents
    const documentsWithKeywordScores = documents.map((doc) => ({
      ...doc,
      keywordScore: calculateKnowledgeRelevanceScore(query, doc) / 100, // Normalize to 0-1
    }));

    // Perform hybrid search (70% semantic, 30% keyword)
    const hybridResults = hybridSearch(
      queryEmbedding,
      documentsWithKeywordScores,
      0.7, // Semantic weight
      limit * 2 // Get more results for filtering
    );

    // Map to expected format and filter by min score
    const scoredDocuments = hybridResults
      .map((result) => {
        // Extract the document fields and calculate final relevance score
        const { keywordScore, similarityScore, combinedScore, ...docFields } = result;
        const doc = docFields as KnowledgeDocument;
        return {
          ...doc,
          relevanceScore: combinedScore * 100 + calculateGroundingBoost(doc), // Scale back to original range
        };
      })
      .filter((doc) => doc.relevanceScore >= minScore)
      .slice(0, limit);

    return scoredDocuments;
  } catch (error) {
    console.error("Error in semantic search, falling back to keyword search:", error);
    
    // Fallback to keyword-based search on error
    const scoredDocuments = documents
      .map((doc) => ({
        ...doc,
        relevanceScore: calculateKnowledgeRelevanceScore(query, doc) + calculateGroundingBoost(doc),
      }))
      .filter((doc) => doc.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredDocuments;
  }
}

/**
 * Retrieve relevant items from all sources (knowledge, cases, instructions)
 */
export async function retrieveRelevantItems(
  query: string,
  options?: {
    sources?: ('knowledge' | 'cases' | 'instructions')[];
    limit?: number;
    minScore?: number;
  }
): Promise<Array<SearchableItem & { relevanceScore: number }>> {
  const { sources = ['knowledge', 'cases', 'instructions'], limit = 10, minScore = 1 } = options || {};

  const results: Array<SearchableItem & { relevanceScore: number }> = [];

  // Search in knowledge documents
  if (sources.includes('knowledge')) {
    const documents = await runtimeGetKnowledgeDocuments({ isActive: 1 });
    const scoredDocs = documents
      .map((doc) => ({
        ...doc,
        sourceType: 'knowledge' as const,
        relevanceScore: calculateKnowledgeRelevanceScore(query, doc) + calculateGroundingBoost(doc),
      }))
      .filter((doc) => doc.relevanceScore >= minScore);
    results.push(...scoredDocs);
  }

  // Search in waqf cases
  if (sources.includes('cases')) {
    const cases = await getWaqfCases({});
    const scoredCases = cases
      .map((waqfCase) => ({
        ...waqfCase,
        sourceType: 'case' as const,
        relevanceScore: calculateCaseRelevanceScore(query, waqfCase),
      }))
      .filter((waqfCase) => waqfCase.relevanceScore >= minScore);
    results.push(...scoredCases);
  }

  // Search in ministerial instructions
  if (sources.includes('instructions')) {
    const instructions = await getMinisterialInstructions({});
    const scoredInstructions = instructions
      .map((instruction) => ({
        ...instruction,
        sourceType: 'instruction' as const,
        relevanceScore: calculateInstructionRelevanceScore(query, instruction),
      }))
      .filter((instruction) => instruction.relevanceScore >= minScore);
    results.push(...scoredInstructions);
  }

  // Sort all results by relevance score and limit
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}


export function buildGroundingReferences(
  documents: Array<GroundedKnowledgeDocument & { relevanceScore?: number }>
): ChatGroundingReference[] {
  return documents.map((doc) => {
    const files = Array.isArray(doc.documentFiles) ? doc.documentFiles : [];
    const citations = Array.isArray(doc.citations) ? [...doc.citations] : [];
    const primaryFile = files.find((file: any) => file?.isPrimary === 1) || files[0] || null;
    const primaryCitation = citations.find((citation: any) => citation?.excerpt || citation?.locator) || citations[0] || null;
    return {
      id: doc.id,
      uuid: doc.uuid,
      title: doc.title,
      category: doc.category || null,
      source: doc.source || null,
      sourceUrl: doc.sourceUrl || null,
      tags: (doc as any).tags || null,
      relevanceScore: (doc as any).relevanceScore,
      referenceDocumentId: doc.referenceDocumentId || null,
      referenceDocumentTitle: doc.referenceDocument?.title || null,
      referenceFileId: primaryFile?.uuid || primaryFile?.id || null,
      referenceFileName: primaryFile?.fileName || null,
      referenceFileUrl: primaryFile?.fileUrl || primaryFile?.storagePath || null,
      citationType: primaryCitation?.citationType || null,
      citationLocator: primaryCitation?.locator || null,
      citationExcerpt: primaryCitation?.excerpt || null,
      citationsCount: citations.length,
      authorityLevel: doc.trust?.authorityLevel ?? assessKnowledgeTrust(doc).authorityLevel ?? null,
      citationVerificationStatus: doc.trust?.citationStatus || 'linked',
      visibilityScope: doc.trust?.visibilityScope || 'public',
      contentStatus: doc.trust?.contentStatus || null,
      trustEligible: Boolean(doc.trust?.allowForChat ?? true),
    };
  });
}

/**
 * Extract relevant context from documents
 */
export function extractRelevantContext(
  query: string,
  documents: GroundedKnowledgeDocument[],
  maxLength: number = 3000
): string {
  if (documents.length === 0) {
    return "";
  }

  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  let context = "";
  let currentLength = 0;

  for (let index = 0; index < documents.length; index++) {
    const doc = documents[index];
    if (currentLength >= maxLength) break;

    const primaryFile = Array.isArray(doc.documentFiles)
      ? doc.documentFiles.find((file: any) => file?.isPrimary === 1) || doc.documentFiles[0]
      : null;
    const citations = Array.isArray(doc.citations) ? doc.citations : [];
    const primaryCitation = citations.find((citation: any) => citation?.excerpt || citation?.locator) || citations[0] || null;

    const metaLines = [
      `مرجع ${index + 1}`,
      `العنوان: ${doc.title}`,
      doc.source ? `المصدر: ${doc.source}` : null,
      doc.referenceDocument?.title ? `الوثيقة المرجعية: ${doc.referenceDocument.title}` : null,
      primaryFile?.fileName ? `الملف: ${primaryFile.fileName}` : null,
      primaryCitation?.locator ? `الموضع: ${primaryCitation.locator}` : null,
    ].filter(Boolean);

    const header = `\n\n## [مرجع ${index + 1}] ${doc.title}\n${metaLines.join("\n")}\n`;
    if (currentLength + header.length > maxLength) break;
    context += header;
    currentLength += header.length;

    const preferredSegments: string[] = citations
      .map((citation: any) => typeof citation?.excerpt === 'string' ? citation.excerpt.trim() : '')
      .filter(Boolean)
      .slice(0, 2);

    const paragraphs = doc.content.split(/\n\n+/);
    for (const paragraph of paragraphs) {
      const cleaned = paragraph.trim();
      if (!cleaned) continue;
      const paragraphLower = cleaned.toLowerCase();
      const hasRelevantTerm = queryTerms.some((term) => paragraphLower.includes(term));
      if (hasRelevantTerm || cleaned.length < 220) {
        preferredSegments.push(cleaned);
      }
      if (preferredSegments.length >= 5) break;
    }

    const uniqueSegments = Array.from(new Set(preferredSegments)).slice(0, 5);
    for (const segment of uniqueSegments) {
      const addition = `${segment}\n\n`;
      if (currentLength + addition.length > maxLength) break;
      context += addition;
      currentLength += addition.length;
    }
  }

  return context.trim();
}

function buildGroundingFooter(references: ChatGroundingReference[]) {
  if (!references || references.length === 0) return '';
  const lines = references.slice(0, 5).map((ref, index) => {
    const parts = [
      `[مرجع ${index + 1}] ${ref.referenceDocumentTitle || ref.title}`,
      ref.referenceFileName ? `الملف: ${ref.referenceFileName}` : null,
      ref.citationLocator ? `الموضع: ${ref.citationLocator}` : null,
    ].filter(Boolean);
    return `- ${parts.join(' — ')}`;
  });
  return `\n\n**المراجع المعتمدة**\n${lines.join("\n")}`;
}

export function ensureGroundedAnswer(answer: string, references: ChatGroundingReference[]) {
  const safeAnswer = (answer || '').trim() || 'تعذر توليد رد مناسب استنادًا إلى المعرفة الحالية.';
  if (!references || references.length === 0) return safeAnswer;

  let next = safeAnswer;
  if (!/\[مرجع\s+\d+\]/.test(next)) {
    const inlineRefs = references.slice(0, Math.min(2, references.length)).map((_, index) => `[مرجع ${index + 1}]`).join(' و');
    next += `\n\nاستند هذا الجواب إلى ${inlineRefs}.`;
  }
  if (!next.includes('**المراجع المعتمدة**')) {
    next += buildGroundingFooter(references);
  }
  return next;
}

export function generateSystemPrompt(context: string, options?: { platformContext?: string | null }): string {
  const platformSection = options?.platformContext
    ? `

**سياق المنصة والكيانات المرجعية:**
${options.platformContext}`
    : "";

  return `أنت مساعد ذكي متخصص في الأوقاف الإسلامية في فلسطين. مهمتك هي الإجابة على الأسئلة المتعلقة بالأوقاف بناءً على المعلومات المتوفرة في قاعدة المعرفة فقط.

**تعليمات إلزامية:**
1. اعتمد فقط على السياق المعرفي المتاح أدناه.
2. لا تخترع وقائع أو مصادر أو أرقام أو مواد قانونية غير موجودة في السياق.
3. إذا كانت المعلومات غير كافية، قل ذلك بوضوح.
4. استخدم العربية الفصحى الواضحة.
5. عند الاستناد إلى معلومة، أشِر داخل الجواب إلى المرجع باستخدام الصيغة: [مرجع 1] أو [مرجع 2].
6. في آخر الجواب، أضف قسمًا قصيرًا بعنوان **المراجع المعتمدة** يذكر أرقام المراجع التي استخدمتها والعناوين المرتبطة بها متى أمكن.
7. عند الحديث عن القوانين أو الأحكام أو التعليمات، التزم بالنصوص الموجودة في السياق فقط.
8. عند توفر سياق منصّي أو كيانات مرجعية، استخدمه فقط كعامل توضيحي وربط سياقي، ولا تخترع بيانات غير موجودة.

**السياق المعرفي المتاح:**
${context || 'لا يوجد سياق معرفي كافٍ.'}${platformSection}

**ملاحظة:** إذا سألك المستخدم عن معلومات غير موجودة في السياق أعلاه، أخبره أنك لا تملك معلومات كافية حول هذا الموضوع في قاعدة المعرفة الحالية.`;
}

/**
 * Categorize user query
 */
export function categorizeQuery(query: string): string {
  const queryLower = query.toLowerCase();

  const categories = {
    law: ["قانون", "تشريع", "نظام", "مادة", "قرار"],
    jurisprudence: ["فقه", "شرع", "حكم", "فتوى", "مذهب", "دليل"],
    majalla: ["مجلة", "عدلية", "عثماني"],
    historical: ["تاريخ", "عثماني", "وثيقة", "أرشيف"],
    administrative: ["إدارة", "وزارة", "مجلس", "ناظر", "إجراء"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => queryLower.includes(keyword))) {
      return category;
    }
  }

  return "general";
}