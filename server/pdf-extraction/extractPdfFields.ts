/**
 * Rule-based PDF field extraction
 * Extracts: doc_date, doc_number, issuer, doc_type, language, page_count
 */

export type IntakeRoute = "knowledge" | "review_only" | "reject";

export interface ExtractedPdfFields {
  docDate: string | null;
  docNumber: string | null;
  issuer: string | null;
  docType: string | null;
  language: "ar" | "en" | null;
  pageCount: number | null;
  intakeRoute: IntakeRoute;
  intakeReason: string;
  intakeConfidence: number;
  extractionVersion: string;
  extractedAt: string;
  extractionError: string | null;
}

/**
 * Extract PDF fields using rule-based patterns
 */
export function extractPdfFields(
  text: string,
  title?: string
): ExtractedPdfFields {
  const now = new Date().toISOString().slice(0, 19);
  let extractionError: string | null = null;
  const normalizedText = normalizeExtractionText(text);
  const normalizedTitle = title ? normalizeExtractionText(title) : undefined;

  try {
    // Extract date (YYYY-MM-DD or DD/MM/YYYY)
    const docDate = extractDate(normalizedText);

    // Extract document number
    const docNumber = extractDocNumber(normalizedText, normalizedTitle);

    // Extract issuer (وزارة، مديرية، ديوان، محكمة، مجلس)
    const issuer = extractIssuer(normalizedText);

    // Extract document type
    const docType = extractDocType(normalizedText, normalizedTitle);

    // Detect language
    const language = detectLanguage(text);

    // Extract page count (if available in metadata)
    const pageCount = extractPageCount(normalizedText);

    const intake = recommendIntakeRoute({
      text: normalizedText,
      title: normalizedTitle,
      docType,
      issuer,
      pageCount,
    });

    return {
      docDate,
      docNumber,
      issuer,
      docType,
      language,
      pageCount,
      intakeRoute: intake.route,
      intakeReason: intake.reason,
      intakeConfidence: intake.confidence,
      extractionVersion: "pdf-rules-v2",
      extractedAt: now,
      extractionError,
    };
  } catch (error) {
    extractionError = error instanceof Error ? error.message : "Unknown error";
    return {
      docDate: null,
      docNumber: null,
      issuer: null,
      docType: null,
      language: null,
      pageCount: null,
      intakeRoute: "review_only",
      intakeReason: "تعذر استخراج الحقول بدقة، وتحتاج الوثيقة إلى مراجعة بشرية قبل اتخاذ قرار الإدخال.",
      intakeConfidence: 0.3,
      extractionVersion: "pdf-rules-v2",
      extractedAt: now,
      extractionError,
    };
  }
}

/**
 * Extract date from text
 * Supports: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
 */
function extractDate(text: string): string | null {
  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const pattern1 = /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/;
  const match1 = text.match(pattern1);
  if (match1) {
    const [, year, month, day] = match1;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
  const pattern2 = /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/;
  const match2 = text.match(pattern2);
  if (match2) {
    const [_, day, month, year] = match2;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Pattern 3: DD.MM.YYYY
  const pattern3 = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/;
  const match3 = text.match(pattern3);
  if (match3) {
    const [_, day, month, year] = match3;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Pattern 4: Arabic month names with year
  const arabicMonths: Array<[RegExp, string]> = [
    [/(يناير|كانون الثاني)/i, "01"],
    [/(فبراير|شباط)/i, "02"],
    [/(مارس|آذار)/i, "03"],
    [/(أبريل|ابريل|نيسان)/i, "04"],
    [/(مايو|أيار)/i, "05"],
    [/(يونيو|حزيران)/i, "06"],
    [/(يوليو|تموز)/i, "07"],
    [/(أغسطس|اغسطس|آب)/i, "08"],
    [/(سبتمبر|أيلول)/i, "09"],
    [/(أكتوبر|اكتوبر|تشرين الأول)/i, "10"],
    [/(نوفمبر|تشرين الثاني)/i, "11"],
    [/(ديسمبر|كانون الأول)/i, "12"],
  ];

  for (const [monthPattern, monthValue] of arabicMonths) {
    const pattern = new RegExp(`\\b(\\d{1,2})\\s+${monthPattern.source}\\s+(\\d{4})\\b`, "i");
    const match = text.match(pattern);
    if (match) {
      const [, day, year] = match;
      return `${year}-${monthValue}-${day.padStart(2, "0")}`;
    }

    const reversePattern = new RegExp(`${monthPattern.source}\\s+(\\d{1,2})\\s*[،,]?\\s*(\\d{4})`, "i");
    const reverseMatch = text.match(reversePattern);
    if (reverseMatch) {
      const [, day, year] = reverseMatch;
      return `${year}-${monthValue}-${day.padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Extract document number
 * Patterns: "رقم"، "No."، "رقم القرار"، "رقم التعميم"
 */
function extractDocNumber(text: string, title?: string): string | null {
  const candidateSources = [text, title || ""];
  const labeledPatterns = [
    /(?:رقم|رقم\s+(?:القرار|التعميم|الكتاب|الفتوى|الحكم|الحجة|القضية|الوثيقة|المرجع|الملف|التعليمات))\s*[:：=\-–—]?\s*([A-Za-z\d\u0621-\u064A][A-Za-z\d\u0621-\u064A\-\/_.]{0,63})/i,
    /(?:No\.?|Number|Ref\.?|Reference)\s*[:=\-]?\s*([A-Za-z\d\u0621-\u064A][A-Za-z\d\u0621-\u064A\-\/_.]{0,63})/i,
    /(?:قرار|تعميم|حكم|حجة|قضية|تعليمات|كتاب|فتوى)\s+رقم\s*[:=\-]?\s*([A-Za-z\d\u0621-\u064A][A-Za-z\d\u0621-\u064A\-\/_.]{0,63})/i,
  ];

  for (const source of candidateSources) {
    for (const pattern of labeledPatterns) {
      const match = source.match(pattern);
      if (match) {
        const idx = match.index ?? 0;
        const contextStart = Math.max(0, idx - 18);
        const nearbyContext = source.slice(contextStart, idx + match[0].length);
        if (/(هوية|بطاقة|جواز|هاتف)/i.test(nearbyContext)) continue;
      }
      const cleaned = cleanDocNumber(match?.[1]);
      if (cleaned) return cleaned;
    }
  }

  const standalonePatterns = [
    /\b(\d{2,6}\/\d{2,6})\b/g,
    /\b(\d{2,6}\/\d{2,6}\/\d{2,6})\b/g,
    /\b([A-Za-z\u0621-\u064A]{1,6}-\d{2,6}\/\d{2,6})\b/gi,
    /\b(\d{2,6}-\d{2,6}\/\d{2,6})\b/g,
  ];

  for (const source of candidateSources) {
    for (const pattern of standalonePatterns) {
      const matches = source.matchAll(pattern);
      for (const match of matches) {
        const cleaned = cleanDocNumber(match?.[1]);
        if (cleaned && !looksLikeDate(cleaned)) {
          return cleaned;
        }
      }
    }
  }

  return null;
}

/**
 * Extract issuer (جهة إصدار الوثيقة)
 * Patterns: "وزارة"، "مديرية"، "ديوان"، "محكمة"، "مجلس"
 */
function extractIssuer(text: string): string | null {
  const patterns = [
    /(?:من|صادر\s+عن|من\s+قبل)\s+([^.\n]+(?:وزارة|مديرية|ديوان|محكمة|مجلس)[^.\n]*)/i,
    /(وزارة\s+[^\n.]+)/i,
    /(مديرية\s+[^\n.]+)/i,
    /(ديوان\s+[^\n.]+)/i,
    /(محكمة\s+[^\n.]+)/i,
    /(مجلس\s+[^\n.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const issuer = match[1]
        .replace(/\s+(?:بتاريخ|تاريخ|رقم|عدد\s+(?:الصفحة|الصفحات)|(?:الصفحة|الصفحات)|صفحة|صفحات|يناير|كانون\s+الثاني|فبراير|شباط|مارس|آذار|أبريل|ابريل|نيسان|مايو|أيار|يونيو|حزيران|يوليو|تموز|أغسطس|اغسطس|آب|سبتمبر|أيلول|أكتوبر|اكتوبر|تشرين\s+الأول|نوفمبر|تشرين\s+الثاني|ديسمبر|كانون\s+الأول).*$/i, "")
        .trim()
        .substring(0, 255);
      if (issuer) return issuer;
    }
  }

  return null;
}

/**
 * Extract document type
 * Types: قرار, تعميم, قانون, لائحة, فتوى, حكم, مجلة الأحكام, أخرى
 */
function extractDocType(text: string, title?: string): string | null {
  const docTypes = [
    "وثيقة موافقة",
    "إقرار",
    "وكالة",
    "طلب",
    "مجلة الأحكام",
    "تقرير",
    "دراسة",
    "قانون",
    "لائحة",
    "نظام",
    "تعليمات",
    "قرار",
    "فتوى",
    "حكم",
    "مجلة",
  ];

  const searchText = (text + " " + (title || "")).toLowerCase();

  for (const docType of docTypes) {
    if (searchText.includes(docType)) {
      return docType;
    }
  }

  return null;
}

/**
 * Detect language (Arabic or English)
 */
function detectLanguage(text: string): "ar" | "en" | null {
  // Count Arabic and English characters
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

  if (arabicChars > englishChars) {
    return "ar";
  } else if (englishChars > arabicChars) {
    return "en";
  }

  return null;
}

/**
 * Extract page count from text
 * Patterns: "صفحة"، "pages"، "page"
 */
function extractPageCount(text: string): number | null {
  const patterns = [
    /عدد\s+(?:الصفحة|الصفحات)\s*[:=]?\s*(\d{1,3})/i,
    /(?:الصفحة|الصفحات)\s*[:=]?\s*(\d{1,3})/i,
    /(?:صفحة|صفحات)\s*[:=]?\s*(\d{1,3})/i,
    /(\d{1,3})\s*(?:صفحة|صفحات)/i,
    /page\s+count\s*[:=]?\s*(\d{1,3})/i,
    /(\d{1,3})\s*pages?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (!isNaN(count) && count > 0 && count <= 500) {
        return count;
      }
    }
  }

  return null;
}

function normalizeExtractionText(text: string): string {
  return text
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[／⁄]/g, "/")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/[：]/g, ":")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDocNumber(raw: string | undefined): string | null {
  if (!raw) return null;

  const cleaned = raw
    .replace(/^[#:：=\-–—\s]+/, "")
    .replace(/[),.;،]+$/g, "")
    .replace(/[^A-Za-z\d\u0621-\u064A\-\/_]/g, "")
    .slice(0, 64);

  return cleaned || null;
}

function looksLikeDate(value: string): boolean {
  const normalized = value.replace(/\//g, "-");
  const fullYearFirst = /^\d{4}-\d{1,2}-\d{1,2}$/;
  if (fullYearFirst.test(normalized)) return true;

  if (/^\d{4}-\d{1,2}$/.test(normalized)) return true;
  if (/^\d{1,2}-\d{4}$/.test(normalized)) return true;

  const parts = normalized.split("-");
  if (parts.length !== 3) return false;

  const [a, b, c] = parts.map((part) => parseInt(part, 10));
  if ([a, b, c].some(Number.isNaN)) return false;

  return a >= 1 && a <= 31 && b >= 1 && b <= 12 && c >= 1900;
}


function recommendIntakeRoute(input: {
  text: string;
  title?: string;
  docType: string | null;
  issuer: string | null;
  pageCount: number | null;
}): { route: IntakeRoute; reason: string; confidence: number } {
  const haystack = `${input.title || ""} ${input.text}`.toLowerCase();
  const textLength = (input.text || "").replace(/\s+/g, " ").trim().length;

  const personalPatterns = [
    /وثيقة\s+موافقة/i,
    /إقرار/i,
    /تفويض/i,
    /وكالة/i,
    /طلب\s+/i,
    /حامل(?:ة)?\s+هوية/i,
    /الجنسية/i,
    /أطفالي/i,
    /زوجي/i,
    /الموقع(?:ة)?\s+أدناه/i,
    /كاتب\s+العدل/i,
    /شهادة\s+ميلاد/i,
    /شهادة\s+زواج/i,
    /شهادة\s+طلاق/i,
    /جواز\s+سفر/i,
  ];

  const mapPlanPatterns = [
    /كروكي/i,
    /مخطط/i,
    /مسقط/i,
    /خارطة/i,
    /حوض/i,
    /قطعة/i,
    /حدود/i,
    /مساحي|مساحية/i,
    /القطعة/i,
    /ارتداد/i,
  ];

  const knowledgePatterns = [
    /تقرير/i,
    /دراسة/i,
    /بحث/i,
    /قانون/i,
    /لائحة/i,
    /نظام/i,
    /تعليمات/i,
    /حكم/i,
    /فتوى/i,
    /مجلة\s+الأحكام/i,
    /الأوقاف/i,
    /مقدمة/i,
    /الخاتمة/i,
    /التوصيات/i,
    /المبحث\s+الأول/i,
    /المحتويات/i,
    /سلسلة\s+تقارير/i,
  ];

  const hasPersonalSignals = personalPatterns.some((p) => p.test(haystack));
  const mapSignalCount = mapPlanPatterns.filter((p) => p.test(haystack)).length;
  const knowledgeSignalCount = knowledgePatterns.filter((p) => p.test(haystack)).length;
  const docTypeValue = (input.docType || "").toLowerCase();

  if (hasPersonalSignals) {
    return {
      route: "review_only",
      reason: "الوثيقة ذات طابع شخصي/إداري مباشر وتحتاج مراجعة بشرية فقط، ولا ينبغي دفعها تلقائيًا إلى قاعدة المعرفة النصية.",
      confidence: 0.92,
    };
  }

  if (mapSignalCount >= 2 && textLength < 4000) {
    return {
      route: "reject",
      reason: "الوثيقة أقرب إلى مخطط/كروكي أو مرفق بصري غير مناسب حاليًا لمسار المعرفة النصية، لذا تُؤجل أو تُرفض من هذا المسار.",
      confidence: 0.93,
    };
  }

  if (/(تقرير|دراسة|قانون|لائحة|نظام|تعليمات|حكم|فتوى|مجلة|قرار)/i.test(docTypeValue) || (knowledgeSignalCount >= 2 && textLength >= 600)) {
    return {
      route: "knowledge",
      reason: "الوثيقة نصية ومعرفية وتبدو مناسبة للإدخال في مسار قاعدة المعرفة بعد المراجعة والتحقق النهائي.",
      confidence: knowledgeSignalCount >= 4 ? 0.94 : 0.84,
    };
  }

  if (textLength < 250) {
    return {
      route: "reject",
      reason: "النص المستخرج قصير أو غير كافٍ لبناء مدخل معرفي موثوق، لذا لا يُنصح بإدخاله إلى قاعدة المعرفة حاليًا.",
      confidence: 0.8,
    };
  }

  return {
    route: "review_only",
    reason: "الوثيقة قابلة للفهم جزئيًا، لكن نوعها أو بنيتها لا يكفيان لاتخاذ قرار إدخال معرفي تلقائي دون مراجعة بشرية.",
    confidence: 0.68,
  };
}
