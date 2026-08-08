/**
 * نظام المعالجة الذكية والتصنيف التلقائي للمحتوى المجلوب
 * Intelligent Content Processing and Auto-Classification
 */

import { invokeLLM } from "./_core/llm";

function coerceOpenAITextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => typeof part?.text === "string" ? part.text : typeof part === "string" ? part : "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

// ============ التصنيف التلقائي ============

export type ContentCategory = "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";

export interface ClassificationResult {
  category: ContentCategory;
  confidence: number;
  reasoning: string;
  suggestedTags: string[];
}

/**
 * تصنيف المحتوى تلقائياً باستخدام LLM
 */
export async function classifyContent(title: string, content: string): Promise<ClassificationResult> {
  const prompt = `أنت خبير في تصنيف المحتوى المتعلق بالأوقاف الإسلامية في فلسطين.

العنوان: ${title}

المحتوى (أول 1000 حرف):
${content.substring(0, 1000)}

قم بتصنيف هذا المحتوى إلى إحدى الفئات التالية:
- law: قوانين ولوائح قانونية
- jurisprudence: فقه وأحكام شرعية
- majalla: مجلة الأحكام العدلية
- historical: وثائق ومراجع تاريخية
- administrative: إجراءات إدارية وتنظيمية
- reference: مراجع عامة ومصادر

أجب بصيغة JSON فقط:
{
  "category": "الفئة المناسبة",
  "confidence": رقم من 0 إلى 1,
  "reasoning": "سبب التصنيف",
  "suggestedTags": ["كلمة مفتاحية 1", "كلمة مفتاحية 2", "كلمة مفتاحية 3"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت خبير في تصنيف المحتوى القانوني والشرعي. أجب بصيغة JSON فقط." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "classification_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["law", "jurisprudence", "majalla", "historical", "administrative", "reference"],
              },
              confidence: {
                type: "number",
                description: "Confidence score between 0 and 1",
              },
              reasoning: {
                type: "string",
                description: "Explanation for the classification",
              },
              suggestedTags: {
                type: "array",
                items: { type: "string" },
                description: "List of suggested keywords",
              },
            },
            required: ["category", "confidence", "reasoning", "suggestedTags"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(coerceOpenAITextContent(response.choices[0].message.content) || "{}");
    return result as ClassificationResult;
  } catch (error) {
    console.error("خطأ في تصنيف المحتوى:", error);
    // قيمة افتراضية في حالة الفشل
    return {
      category: "reference",
      confidence: 0.5,
      reasoning: "تصنيف افتراضي بسبب خطأ في المعالجة",
      suggestedTags: [],
    };
  }
}

// ============ حساب درجة الصلة ============

export interface RelevanceScore {
  score: number; // 0-100
  reasoning: string;
  isRelevant: boolean;
}

/**
 * حساب درجة صلة المحتوى بالأوقاف الإسلامية في فلسطين
 */
export async function calculateRelevance(title: string, content: string): Promise<RelevanceScore> {
  const prompt = `أنت خبير في تقييم مدى صلة المحتوى بموضوع الأوقاف الإسلامية في فلسطين.

العنوان: ${title}

المحتوى (أول 1000 حرف):
${content.substring(0, 1000)}

قيّم مدى صلة هذا المحتوى بالأوقاف الإسلامية في فلسطين من حيث:
- هل يتحدث عن الأوقاف أو الممتلكات الوقفية؟
- هل يتعلق بفلسطين أو المنطقة؟
- هل يحتوي على معلومات قانونية أو تاريخية أو فقهية مفيدة؟

أعط درجة من 0 إلى 100:
- 0-30: غير ذي صلة
- 31-60: صلة ضعيفة
- 61-80: صلة متوسطة
- 81-100: صلة قوية جداً

أجب بصيغة JSON فقط:
{
  "score": رقم من 0 إلى 100,
  "reasoning": "تفسير الدرجة",
  "isRelevant": true أو false
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت خبير في تقييم صلة المحتوى. أجب بصيغة JSON فقط." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "relevance_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description: "Relevance score from 0 to 100",
              },
              reasoning: {
                type: "string",
                description: "Explanation for the score",
              },
              isRelevant: {
                type: "boolean",
                description: "Whether the content is relevant (score >= 60)",
              },
            },
            required: ["score", "reasoning", "isRelevant"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(coerceOpenAITextContent(response.choices[0].message.content) || "{}");
    return result as RelevanceScore;
  } catch (error) {
    console.error("خطأ في حساب درجة الصلة:", error);
    return {
      score: 50,
      reasoning: "تقييم افتراضي بسبب خطأ في المعالجة",
      isRelevant: false,
    };
  }
}

// ============ التلخيص الذكي ============

export interface ContentSummary {
  summary: string;
  keyPoints: string[];
  entities: {
    people?: string[];
    places?: string[];
    dates?: string[];
    laws?: string[];
  };
}

/**
 * تلخيص المحتوى واستخراج النقاط الرئيسية
 */
export async function summarizeContent(title: string, content: string): Promise<ContentSummary> {
  const prompt = `أنت خبير في تلخيص المحتوى القانوني والشرعي.

العنوان: ${title}

المحتوى:
${content.substring(0, 3000)}

قم بما يلي:
1. اكتب ملخص موجز (2-3 جمل)
2. استخرج النقاط الرئيسية (3-5 نقاط)
3. استخرج الكيانات المهمة (أشخاص، أماكن، تواريخ، قوانين)

أجب بصيغة JSON فقط:
{
  "summary": "الملخص",
  "keyPoints": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "entities": {
    "people": ["شخص 1", "شخص 2"],
    "places": ["مكان 1", "مكان 2"],
    "dates": ["تاريخ 1", "تاريخ 2"],
    "laws": ["قانون 1", "قانون 2"]
  }
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت خبير في تلخيص المحتوى. أجب بصيغة JSON فقط." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "Brief summary of the content",
              },
              keyPoints: {
                type: "array",
                items: { type: "string" },
                description: "List of key points",
              },
              entities: {
                type: "object",
                properties: {
                  people: {
                    type: "array",
                    items: { type: "string" },
                  },
                  places: {
                    type: "array",
                    items: { type: "string" },
                  },
                  dates: {
                    type: "array",
                    items: { type: "string" },
                  },
                  laws: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [],
                additionalProperties: false,
              },
            },
            required: ["summary", "keyPoints", "entities"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(coerceOpenAITextContent(response.choices[0].message.content) || "{}");
    return result as ContentSummary;
  } catch (error) {
    console.error("خطأ في تلخيص المحتوى:", error);
    return {
      summary: "لم يتم التلخيص بسبب خطأ في المعالجة",
      keyPoints: [],
      entities: {},
    };
  }
}

// ============ المعالجة الشاملة ============

export interface ProcessedContent {
  classification: ClassificationResult;
  relevance: RelevanceScore;
  summary: ContentSummary;
  shouldApprove: boolean;
}

/**
 * معالجة شاملة للمحتوى المجلوب
 */
export async function processContent(title: string, content: string): Promise<ProcessedContent> {
  // تنفيذ جميع العمليات بالتوازي لتوفير الوقت
  const [classification, relevance, summary] = await Promise.all([
    classifyContent(title, content),
    calculateRelevance(title, content),
    summarizeContent(title, content),
  ]);

  // قرار الموافقة التلقائية
  const shouldApprove = relevance.isRelevant && relevance.score >= 70 && classification.confidence >= 0.7;

  return {
    classification,
    relevance,
    summary,
    shouldApprove,
  };
}
