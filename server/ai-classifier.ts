import { invokeLLM } from "./_core/llm";

/**
 * Classify content using LLM
 * Returns category, keywords, and summary
 */
export async function classifyWithLLM(content: string, title?: string): Promise<{
  category: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  keywords: string[];
  summary: string;
  relevanceScore: number;
}> {
  const prompt = `أنت خبير في تصنيف المحتوى المتعلق بالأوقاف الإسلامية في فلسطين.

${title ? `العنوان: ${title}\n\n` : ""}المحتوى:
${content.substring(0, 2000)}

قم بتحليل هذا المحتوى وتقديم:
1. **الفئة**: اختر واحدة فقط من: law (قانوني), jurisprudence (فقهي), majalla (مجلة الأحكام), historical (تاريخي), administrative (إداري), reference (مرجع)
2. **الكلمات المفتاحية**: 5-10 كلمات مفتاحية مهمة باللغة العربية
3. **الملخص**: ملخص موجز (2-3 جمل) للمحتوى
4. **درجة الصلة**: من 0-100، مدى صلة المحتوى بالأوقاف الإسلامية في فلسطين

أجب بصيغة JSON فقط:
{
  "category": "...",
  "keywords": ["...", "..."],
  "summary": "...",
  "relevanceScore": 85
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت خبير في تصنيف المحتوى القانوني والفقهي المتعلق بالأوقاف الإسلامية. أجب دائماً بصيغة JSON صحيحة." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["law", "jurisprudence", "majalla", "historical", "administrative", "reference"],
                description: "The category of the content"
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "5-10 important keywords in Arabic"
              },
              summary: {
                type: "string",
                description: "A brief summary (2-3 sentences) of the content"
              },
              relevanceScore: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description: "Relevance score to Islamic Waqf in Palestine (0-100)"
              }
            },
            required: ["category", "keywords", "summary", "relevanceScore"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === "string" ? content : "{}");
    
    return {
      category: result.category || "reference",
      keywords: result.keywords || [],
      summary: result.summary || "",
      relevanceScore: result.relevanceScore || 0,
    };
  } catch (error) {
    console.error("LLM classification error:", error);
    // Fallback to basic classification
    return {
      category: "reference",
      keywords: extractBasicKeywords(content),
      summary: content.substring(0, 200) + "...",
      relevanceScore: 50,
    };
  }
}

/**
 * Extract basic keywords (fallback method)
 */
function extractBasicKeywords(text: string): string[] {
  const commonWords = new Set([
    "في", "من", "إلى", "على", "عن", "أن", "هذا", "هذه", "ذلك", "التي", "الذي",
    "كان", "يكون", "قد", "لم", "لن", "ما", "لا", "نعم", "هل", "أو", "و", "ف", "ب",
    "ل", "ك", "س", "سوف", "قال", "يقول", "كل", "بعض", "أي", "كيف", "متى", "أين"
  ]);

  const words = text
    .split(/\s+/)
    .map(w => w.replace(/[^\u0600-\u06FF\s]/g, ""))
    .filter(w => w.length > 3 && !commonWords.has(w));

  // Count frequency
  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  // Get top 10
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Enhance fetched content with LLM classification
 */
export async function enhanceFetchedContent(items: Array<{
  title: string;
  content: string;
  category?: string | null;
  tags?: string | null;
}>): Promise<Array<{
  title: string;
  content: string;
  category: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  tags: string;
  relevanceScore: number;
  summary?: string;
}>> {
  const enhanced: any[] = [];

  for (const item of items) {
    try {
      const classification = await classifyWithLLM(item.content, item.title);
      
      enhanced.push({
        ...item,
        category: classification.category,
        tags: JSON.stringify(classification.keywords),
        relevanceScore: classification.relevanceScore,
        summary: classification.summary,
      });
    } catch (error) {
      console.error("Enhancement error:", error);
      // Keep original if classification fails
      enhanced.push({
        ...item,
        category: (item.category as any) || "reference",
        tags: item.tags || "[]",
        relevanceScore: 50,
      });
    }
  }

  return enhanced;
}
