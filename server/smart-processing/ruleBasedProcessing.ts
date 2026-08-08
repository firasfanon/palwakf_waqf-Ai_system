/**
 * Rule-based Processing Engine for Fetched Content
 * 
 * Processes content without LLM using:
 * - Keyword frequency analysis
 * - Pattern matching for categorization
 * - Simple summarization (first sentences)
 * - Relevance scoring based on waqf-related keywords
 */

export interface ProcessingResult {
  aiCategory: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  aiKeywords: string;
  aiSummary: string;
  aiConfidence: number; // 0..1
  aiReasoning: string;
  tags: string;
  relevanceScore: number; // 0..100
}

/**
 * Extract top keywords from content using frequency analysis
 */
function extractKeywords(content: string, limit: number = 10): string[] {
  // Remove common Arabic stop words
  const stopWords = new Set([
    "في", "من", "إلى", "على", "عن", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي",
    "أن", "إن", "كان", "كانت", "يكون", "تكون", "هو", "هي", "هم", "هن",
    "ما", "لا", "نعم", "قد", "لم", "لن", "أو", "و", "ف", "ب", "ل", "ك",
    "مع", "عند", "بعد", "قبل", "حتى", "منذ", "خلال", "أثناء", "بين",
    "كل", "بعض", "جميع", "كثير", "قليل", "أكثر", "أقل", "غير", "سوى",
    "إذا", "إذ", "لو", "لولا", "لما", "كلما", "حيث", "حيثما", "أين", "أينما",
    "متى", "كيف", "كيفما", "لماذا", "ماذا", "من", "أي", "أية", "أيها",
    "هنا", "هناك", "هنالك", "ثم", "ثمة", "الآن", "اليوم", "غدا", "أمس"
  ]);

  // Tokenize and count
  const words = content
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\s]/g, " ") // Keep only Arabic letters and spaces
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Sort by frequency and take top N
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Categorize content based on pattern matching
 */
function categorizeContent(content: string, title?: string): {
  category: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  confidence: number;
  reasoning: string;
} {
  const text = `${title || ""} ${content}`.toLowerCase();

  // Law patterns
  const lawPatterns = [
    "قانون", "مادة", "فقرة", "بند", "نص", "تشريع", "مرسوم", "قرار",
    "لائحة", "نظام", "دستور", "قضاء", "محكمة", "حكم", "قاضي"
  ];

  // Jurisprudence patterns
  const jurisprudencePatterns = [
    "فقه", "فتوى", "مفتي", "عالم", "شيخ", "إمام", "رأي", "مذهب",
    "حنفي", "شافعي", "مالكي", "حنبلي", "جعفري", "اجتهاد", "دليل"
  ];

  // Majalla patterns
  const majallaPatterns = [
    "مجلة", "الأحكام", "العدلية", "العثماني", "مجلة الأحكام",
    "المجلة العدلية", "الفقه الحنفي"
  ];

  // Historical patterns
  const historicalPatterns = [
    "تاريخ", "تاريخي", "عهد", "فترة", "حقبة", "عصر", "قديم", "قدماء",
    "عثماني", "مملوكي", "أيوبي", "فاطمي", "أموي", "عباسي", "سلطان"
  ];

  // Administrative patterns
  const administrativePatterns = [
    "إدارة", "إداري", "وزارة", "مدير", "ناظر", "متولي", "قيّم", "أمين",
    "سجل", "تسجيل", "وثيقة", "محضر", "تقرير", "إجراء", "معاملة"
  ];

  // Count matches for each category
  const scores = {
    law: lawPatterns.filter(p => text.includes(p)).length,
    jurisprudence: jurisprudencePatterns.filter(p => text.includes(p)).length,
    majalla: majallaPatterns.filter(p => text.includes(p)).length,
    historical: historicalPatterns.filter(p => text.includes(p)).length,
    administrative: administrativePatterns.filter(p => text.includes(p)).length,
  };

  // Find category with highest score
  const entries = Object.entries(scores) as Array<[keyof typeof scores, number]>;
  const [topCategory, topScore] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));

  // If no clear category, default to reference
  if (topScore === 0) {
    return {
      category: "reference",
      confidence: 0.3,
      reasoning: "لم يتم العثور على أنماط واضحة، تم التصنيف كمرجع عام"
    };
  }

  // Calculate confidence (0..1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(0.95, topScore / Math.max(1, totalScore) + 0.2);

  // Build reasoning
  const matchedPatterns = {
    law: lawPatterns,
    jurisprudence: jurisprudencePatterns,
    majalla: majallaPatterns,
    historical: historicalPatterns,
    administrative: administrativePatterns,
  }[topCategory].filter(p => text.includes(p));

  const reasoning = `تم التصنيف بناءً على ${topScore} كلمة مفتاحية: ${matchedPatterns.slice(0, 3).join("، ")}`;

  return {
    category: topCategory === "majalla" ? "majalla" : topCategory,
    confidence,
    reasoning
  };
}

/**
 * Generate summary from content (first 3 sentences, max 450 chars)
 */
function generateSummary(content: string): string {
  // Split by Arabic sentence endings
  const sentences = content
    .split(/[.؟!،]/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  // Take first 3 sentences
  let summary = sentences.slice(0, 3).join(". ");

  // Truncate to 450 chars
  if (summary.length > 450) {
    summary = summary.substring(0, 447) + "...";
  }

  return summary || "لا يوجد ملخص متاح";
}

/**
 * Calculate relevance score based on waqf-related keywords
 */
function calculateRelevanceScore(content: string, title?: string): number {
  const text = `${title || ""} ${content}`.toLowerCase();

  const waqfKeywords = [
    "وقف", "أوقاف", "موقوف", "واقف", "موقوفة",
    "مسجد", "جامع", "مصلى", "زاوية", "خانقاه", "رباط", "تكية",
    "مقبرة", "تربة", "ضريح", "مشهد",
    "القدس", "الأقصى", "الحرم", "الخليل", "إبراهيم",
    "ناظر", "متولي", "قيّم", "مستحق", "ريع", "غلة",
    "فلسطين", "فلسطيني", "عثماني", "عثمانية",
    "حجة", "سجل", "دفتر", "طابو", "كوشان",
    "مجلة الأحكام", "قانون الأوقاف", "وزارة الأوقاف",
    "فتوى", "حكم", "قضاء", "محكمة شرعية"
  ];

  let score = 0;
  for (const keyword of waqfKeywords) {
    if (text.includes(keyword)) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Generate tags from keywords
 */
function generateTags(keywords: string[], category: string): string {
  const tags = [...keywords];

  // Add category tag
  const categoryTags: Record<string, string> = {
    law: "قانوني",
    jurisprudence: "فقهي",
    majalla: "مجلة_الأحكام",
    historical: "تاريخي",
    administrative: "إداري",
    reference: "مرجع"
  };

  tags.unshift(categoryTags[category] || "عام");

  return tags.join(", ");
}

/**
 * Main processing function
 */
export function ruleBasedProcess(content: string, title?: string): ProcessingResult {
  // Extract keywords
  const keywords = extractKeywords(content, 10);

  // Categorize
  const { category, confidence, reasoning } = categorizeContent(content, title);

  // Generate summary
  const summary = generateSummary(content);

  // Calculate relevance
  const relevanceScore = calculateRelevanceScore(content, title);

  // Generate tags
  const tags = generateTags(keywords, category);

  return {
    aiCategory: category,
    aiKeywords: keywords.join(", "),
    aiSummary: summary,
    aiConfidence: confidence,
    aiReasoning: reasoning,
    tags,
    relevanceScore
  };
}
