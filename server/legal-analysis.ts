/**
 * نظام المقارنة والتحليل القانوني للأوقاف الإسلامية
 * يتضمن: مقارنة الأحكام، تحليل السوابق، توقع النتائج
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { runtimeGetKnowledgeDocuments } from "./runtimeRepository";
import { judicialRulings, legalPrecedents } from "../drizzle/schema";
import { eq, and, like, or } from "drizzle-orm";


function countArabicLetters(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return (text.match(/[\u0600-\u06FF]/g) || []).length;
}

function hasArabicSignal(value: unknown, minimum = 12) {
  return countArabicLetters(value) >= minimum;
}

function ensureArabicComparisonResult(
  parsed: Partial<RulingComparison> | null,
  ruling1Text: string,
  ruling2Text: string
): RulingComparison {
  const isStructurallyValid =
    parsed &&
    Array.isArray(parsed.similarities) &&
    Array.isArray(parsed.differences) &&
    typeof parsed.conclusion === "string" &&
    typeof parsed.recommendation === "string";

  if (isStructurallyValid && hasArabicSignal(parsed, 24)) {
    return parsed as RulingComparison;
  }

  const firstExcerpt = ruling1Text.replace(/\s+/g, " ").trim().slice(0, 180) || "الحكم الأول";
  const secondExcerpt = ruling2Text.replace(/\s+/g, " ").trim().slice(0, 180) || "الحكم الثاني";

  return {
    similarities: [
      {
        aspect: "موضوع النزاع الوقفي",
        description: "يوجد تقاطع أولي بين النصين من حيث ارتباطهما بمسألة قانونية أو إدارية ذات أثر على الوقف أو إدارته أو أطرافه.",
        weight: 0.55,
      },
      {
        aspect: "الحاجة إلى مراجعة قانونية بشرية",
        description: "نتيجة المقارنة الآلية الأصلية لم تحقق معيار اللغة العربية/البنية المتوقعة، لذلك تم إنتاج خلاصة احتياطية قابلة للمراجعة ولا تصلح وحدها كاعتماد نهائي.",
        weight: 0.4,
      },
    ],
    differences: [
      {
        aspect: "تفاصيل الوقائع",
        description: `يجب مقارنة وقائع الحكمين يدويًا، خصوصًا مقتطف الحكم الأول: ${firstExcerpt}`,
        significance: "medium",
      },
      {
        aspect: "نطاق التسبيب والنتيجة",
        description: `يلزم تدقيق نطاق التسبيب والنتيجة في الحكم الثاني، خصوصًا المقتطف: ${secondExcerpt}`,
        significance: "medium",
      },
    ],
    conclusion: "تم تفعيل حاجز جودة عربي احتياطي لأن ناتج المقارنة الأصلي لم يكن عربيًا بما يكفي أو لم يطابق البنية المتوقعة. الخلاصة الحالية صالحة كمسودة مراجعة فقط.",
    recommendation: "إعادة تشغيل المقارنة بعد تحسين نصَي الإدخال أو مراجعة النتيجة بشريًا قبل تحويلها إلى معرفة معتمدة.",
  };
}

function buildKnowledgeSearchSeed(query: string) {
  return query
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

async function loadFallbackKnowledgeContext(query: string, limit = 8) {
  const docs = await runtimeGetKnowledgeDocuments({
    isActive: 1,
    search: buildKnowledgeSearchSeed(query),
  });

  return (Array.isArray(docs) ? docs : [])
    .filter((doc: any) => doc && typeof doc.title === "string")
    .slice(0, limit)
    .map((doc: any) => ({
      title: doc.title || "وثيقة معرفة",
      category: doc.category || "reference",
      summary: doc.summary || "",
      content: typeof doc.content === "string" ? doc.content.slice(0, 1200) : "",
      tags: Array.isArray(doc.tags) ? doc.tags.join(", ") : (doc.tags || ""),
      source: doc.source || null,
    }));
}

async function loadPrecedentContext(caseDescription: string) {
  try {
    const db = await getDb();
    if (db) {
      const precedents = await db
        .select()
        .from(legalPrecedents)
        .where(eq(legalPrecedents.isActive, 1))
        .limit(20);

      if (precedents.length > 0) {
        return {
          source: "database" as const,
          items: precedents.map((p) => ({
            title: p.title || "سابقة",
            principle: p.principle || "",
            description: p.description || "",
          })),
        };
      }
    }
  } catch (error) {
    console.warn("[legal-analysis] precedents database context unavailable, falling back to assistant knowledge", error);
  }

  const docs = await loadFallbackKnowledgeContext(caseDescription, 10);
  return {
    source: "assistant_knowledge" as const,
    items: docs.map((doc) => ({
      title: doc.title,
      principle: doc.summary || doc.tags || "مادة معرفية داعمة",
      description: doc.content || doc.summary || "",
    })),
  };
}

async function loadPredictionContext(caseDescription: string) {
  try {
    const db = await getDb();
    if (db) {
      const similarRulings = await db
        .select()
        .from(judicialRulings)
        .limit(15);

      if (similarRulings.length > 0) {
        return {
          source: "database" as const,
          items: similarRulings.map((r) => ({
            title: r.title || "حكم",
            subject: r.subject || "",
            summary: r.summary || "",
          })),
        };
      }
    }
  } catch (error) {
    console.warn("[legal-analysis] prediction database context unavailable, falling back to assistant knowledge", error);
  }

  const docs = await loadFallbackKnowledgeContext(caseDescription, 10);
  return {
    source: "assistant_knowledge" as const,
    items: docs.map((doc) => ({
      title: doc.title,
      subject: doc.category || "reference",
      summary: doc.summary || doc.content || "",
    })),
  };
}

// ============ مقارنة الأحكام ============

export interface RulingComparison {
  similarities: Array<{
    aspect: string;
    description: string;
    weight: number;
  }>;
  differences: Array<{
    aspect: string;
    description: string;
    significance: "high" | "medium" | "low";
  }>;
  conclusion: string;
  recommendation: string;
}

/**
 * مقارنة حكمين قضائيين
 */
export async function compareRulings(ruling1Text: string, ruling2Text: string): Promise<RulingComparison> {
  const systemPrompt = `أنت خبير قانوني متخصص في مقارنة الأحكام القضائية للأوقاف الإسلامية.
قارن بين الحكمين من حيث:

أوجه التشابه:
- الموضوع والقضية
- الأساس القانوني والشرعي
- الاستدلالات والحجج
- النتيجة والحكم
- المبادئ القانونية المطبقة

أوجه الاختلاف:
- الوقائع والظروف
- التكييف القانوني
- الأحكام والقرارات
- التعليل والتسبيب
- الآثار القانونية

قيّم أهمية كل اختلاف (عالية، متوسطة، منخفضة).
قدم خلاصة وتوصية.

شرط جودة إلزامي:
- يجب أن تكون كل القيم النصية في JSON باللغة العربية حصرًا.
- لا تستخدم الصينية أو الإنجليزية أو أي لغة أجنبية في الحقول النصية.
- إذا كان النص المدخل غير كافٍ، اذكر ذلك بالعربية بوضوح بدل اختراع وقائع.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `قارن بين الحكمين التاليين:\n\n**الحكم الأول:**\n${ruling1Text}\n\n**الحكم الثاني:**\n${ruling2Text}` 
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ruling_comparison",
        strict: true,
        schema: {
          type: "object",
          properties: {
            similarities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  aspect: { type: "string" },
                  description: { type: "string" },
                  weight: { type: "number" }
                },
                required: ["aspect", "description", "weight"],
                additionalProperties: false
              }
            },
            differences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  aspect: { type: "string" },
                  description: { type: "string" },
                  significance: { type: "string", enum: ["high", "medium", "low"] }
                },
                required: ["aspect", "description", "significance"],
                additionalProperties: false
              }
            },
            conclusion: { type: "string" },
            recommendation: { type: "string" }
          },
          required: ["similarities", "differences", "conclusion", "recommendation"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No comparison result");

  return ensureArabicComparisonResult(JSON.parse(content), ruling1Text, ruling2Text);
}

// ============ تحليل السوابق ============

export interface PrecedentAnalysis {
  relevantPrecedents: Array<{
    principle: string;
    applicability: number;
    reasoning: string;
  }>;
  trends: string[];
  recommendations: string[];
}

/**
 * تحليل السوابق القضائية ذات الصلة
 */
export async function analyzePrecedents(caseDescription: string): Promise<PrecedentAnalysis> {
  const precedentContext = await loadPrecedentContext(caseDescription);

  const precedentsText = precedentContext.items.length > 0
    ? precedentContext.items
        .map((p) => `**${p.title}**\nالمبدأ: ${p.principle}\nالوصف: ${p.description}`)
        .join("\n\n")
    : "لا توجد سوابق مخزنة متاحة؛ حلل القضية اعتمادًا على الوصف المقدم فقط مع بيان حدود الثقة.";

  const systemPrompt = `أنت خبير قانوني متخصص في تحليل السوابق القضائية للأوقاف الإسلامية.
حلل السوابق المتاحة وحدد:

1. السوابق ذات الصلة:
   - المبدأ القانوني
   - مدى الانطباق (0-1)
   - التعليل

2. الاتجاهات القضائية:
   - الاتجاه السائد
   - التطورات الحديثة
   - التغيرات في التطبيق

3. التوصيات:
   - كيفية الاستفادة من السوابق
   - الحجج القانونية المقترحة
   - المخاطر والفرص`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `حلل السوابق التالية بالنسبة للقضية:\n\n**وصف القضية:**\n${caseDescription}\n\n**السوابق المتاحة:**\n${precedentsText}` 
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "precedent_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            relevantPrecedents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  principle: { type: "string" },
                  applicability: { type: "number" },
                  reasoning: { type: "string" }
                },
                required: ["principle", "applicability", "reasoning"],
                additionalProperties: false
              }
            },
            trends: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          },
          required: ["relevantPrecedents", "trends", "recommendations"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No precedent analysis result");

  return JSON.parse(content);
}

// ============ توقع نتائج القضايا ============

export interface CasePrediction {
  predictedOutcome: "favorable" | "unfavorable" | "uncertain";
  confidence: number;
  reasoning: string[];
  supportingPrecedents: string[];
  risks: string[];
  opportunities: string[];
  recommendations: string[];
}

/**
 * توقع نتيجة قضية بناءً على السوابق
 */
export async function predictCaseOutcome(
  caseDescription: string,
  party: "plaintiff" | "defendant"
): Promise<CasePrediction> {
  const predictionContext = await loadPredictionContext(caseDescription);

  const rulingsText = predictionContext.items.length > 0
    ? predictionContext.items
        .map((r) => `**${r.title}**\nالموضوع: ${r.subject}\nالملخص: ${r.summary}`)
        .join("\n\n")
    : "لا توجد أحكام مشابهة متاحة؛ قدم توقعًا حذرًا اعتمادًا على وصف القضية فقط مع بيان المخاطر.";

  const systemPrompt = `أنت خبير قانوني متخصص في التنبؤ بنتائج القضايا الوقفية.
بناءً على السوابق والأحكام المشابهة، توقع نتيجة القضية.

قدم:
1. النتيجة المتوقعة (إيجابية، سلبية، غير مؤكدة) للطرف ${party === "plaintiff" ? "المدعي" : "المدعى عليه"}
2. مستوى الثقة (0-1)
3. التعليل والأسباب
4. السوابق الداعمة
5. المخاطر المحتملة
6. الفرص المتاحة
7. التوصيات الاستراتيجية

كن موضوعياً ومحايداً في التحليل.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `توقع نتيجة القضية التالية:\n\n**وصف القضية:**\n${caseDescription}\n\n**الأحكام المشابهة:**\n${rulingsText}` 
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "case_prediction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            predictedOutcome: { 
              type: "string", 
              enum: ["favorable", "unfavorable", "uncertain"] 
            },
            confidence: { type: "number" },
            reasoning: { type: "array", items: { type: "string" } },
            supportingPrecedents: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          },
          required: [
            "predictedOutcome", 
            "confidence", 
            "reasoning", 
            "supportingPrecedents", 
            "risks", 
            "opportunities", 
            "recommendations"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No prediction result");

  return JSON.parse(content);
}

// ============ استخلاص الاتجاهات القضائية ============

export interface JudicialTrends {
  overallTrend: string;
  trendsByCategory: Array<{
    category: string;
    trend: string;
    confidence: number;
  }>;
  significantChanges: string[];
  futureProjections: string[];
}

/**
 * استخلاص الاتجاهات القضائية من الأحكام
 */
export async function extractJudicialTrends(): Promise<JudicialTrends> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // جلب جميع الأحكام
  const allRulings = await db
    .select()
    .from(judicialRulings)
    .limit(50);

  const rulingsText = allRulings
    .map(r => `[${r.rulingDate}] ${r.title}: ${r.summary}`)
    .join("\n");

  const systemPrompt = `أنت محلل قانوني متخصص في استخلاص الاتجاهات القضائية.
حلل الأحكام وحدد:

1. الاتجاه العام للقضاء
2. الاتجاهات حسب الفئة (ملكية، إدارة، استحقاق، إلخ)
3. التغيرات الهامة في الاجتهاد القضائي
4. التوقعات المستقبلية

استند إلى:
- تكرار أنواع الأحكام
- التطور الزمني
- التغيرات في التعليل
- المبادئ الجديدة`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `حلل الاتجاهات في الأحكام التالية:\n\n${rulingsText}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "judicial_trends",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallTrend: { type: "string" },
            trendsByCategory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  trend: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["category", "trend", "confidence"],
                additionalProperties: false
              }
            },
            significantChanges: { type: "array", items: { type: "string" } },
            futureProjections: { type: "array", items: { type: "string" } }
          },
          required: ["overallTrend", "trendsByCategory", "significantChanges", "futureProjections"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No trends result");

  return JSON.parse(content);
}

// ============ تحليل العلاقات بين الأحكام والقوانين ============

export interface LegalRelationships {
  directReferences: Array<{
    ruling: string;
    law: string;
    article: string;
    relationship: string;
  }>;
  implicitConnections: Array<{
    ruling: string;
    principle: string;
    source: string;
  }>;
  conflicts: Array<{
    description: string;
    severity: "high" | "medium" | "low";
    resolution: string;
  }>;
}

/**
 * تحليل العلاقات بين الأحكام والقوانين
 */
export async function analyzeLegalRelationships(rulingText: string): Promise<LegalRelationships> {
  const systemPrompt = `أنت خبير قانوني متخصص في تحليل العلاقات بين الأحكام القضائية والقوانين.
حلل الحكم وحدد:

1. الإشارات المباشرة:
   - القوانين المذكورة
   - المواد المطبقة
   - نوع العلاقة (تطبيق، تفسير، استناد)

2. الروابط الضمنية:
   - المبادئ القانونية المطبقة
   - المصادر الشرعية
   - الاجتهادات الفقهية

3. التعارضات:
   - تعارضات ظاهرية أو حقيقية
   - مستوى الخطورة
   - طرق الحل المقترحة`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `حلل العلاقات القانونية في الحكم التالي:\n\n${rulingText}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "legal_relationships",
        strict: true,
        schema: {
          type: "object",
          properties: {
            directReferences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ruling: { type: "string" },
                  law: { type: "string" },
                  article: { type: "string" },
                  relationship: { type: "string" }
                },
                required: ["ruling", "law", "article", "relationship"],
                additionalProperties: false
              }
            },
            implicitConnections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ruling: { type: "string" },
                  principle: { type: "string" },
                  source: { type: "string" }
                },
                required: ["ruling", "principle", "source"],
                additionalProperties: false
              }
            },
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  severity: { type: "string", enum: ["high", "medium", "low"] },
                  resolution: { type: "string" }
                },
                required: ["description", "severity", "resolution"],
                additionalProperties: false
              }
            }
          },
          required: ["directReferences", "implicitConnections", "conflicts"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No relationships result");

  return JSON.parse(content);
}
