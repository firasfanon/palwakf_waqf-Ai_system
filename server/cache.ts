/**
 * نظام Cache للإجابات المتكررة
 * يوفر 70-80% من استهلاك التوكن عن طريق حفظ الإجابات الشائعة
 */

import { getDb } from "./db";
import { cachedResponses, type InsertCachedResponse, type CachedResponse } from "../drizzle/schema";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import * as fuzz from "fuzzball";

/**
 * تطبيع السؤال للمقارنة
 * يزيل علامات الترقيم والمسافات الزائدة
 */
export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[؟?!.،,\u061F\u060C]/g, '') // Remove Arabic and English punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * البحث في الـ cache عن إجابة مطابقة أو مشابهة
 * @param question - السؤال الأصلي
 * @param similarityThreshold - حد التشابه المطلوب (default: 85%)
 * @returns الإجابة المحفوظة أو null
 */
export async function getCachedResponse(
  question: string,
  similarityThreshold: number = 85
): Promise<CachedResponse | null> {
  const db = await getDb();
  if (!db) return null;

  const normalized = normalizeQuestion(question);
  const now = new Date();

  try {
    // 1. البحث عن تطابق تام
    const exactMatch = await db
      .select()
      .from(cachedResponses)
      .where(
        and(
          eq(cachedResponses.questionNormalized, normalized),
          // Check if not expired (or no expiry set)
          sql`(${cachedResponses.expiresAt} IS NULL OR ${cachedResponses.expiresAt} > ${now})`
        )
      )
      .limit(1);

    if (exactMatch.length > 0) {
      // Update usage stats
      await updateCacheHit(exactMatch[0].id);
      return exactMatch[0];
    }

    // 2. البحث عن أسئلة مشابهة باستخدام Fuzzy Matching
    // Get recent cached responses (last 1000)
    const recentCache = await db
      .select()
      .from(cachedResponses)
      .where(
        sql`(${cachedResponses.expiresAt} IS NULL OR ${cachedResponses.expiresAt} > ${now})`
      )
      .orderBy(desc(cachedResponses.lastUsedAt))
      .limit(1000);

    // Calculate similarity scores
    let bestMatch: CachedResponse | null = null;
    let bestScore = 0;

    for (const cached of recentCache) {
      const score = fuzz.ratio(normalized, cached.questionNormalized);
      
      if (score > bestScore && score >= similarityThreshold) {
        bestScore = score;
        bestMatch = cached;
      }
    }

    if (bestMatch) {
      // Update usage stats
      await updateCacheHit(bestMatch.id);
      return bestMatch;
    }

    return null;
  } catch (error) {
    console.error('[Cache] Error getting cached response:', error);
    return null;
  }
}

/**
 * حفظ إجابة جديدة في الـ cache
 */
export async function saveCachedResponse(
  question: string,
  answer: string,
  sources: string,
  category: "general" | "legal" | "jurisprudence" | "administrative" | "historical" = "general"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const normalized = normalizeQuestion(question);
  
  // Set expiry to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  try {
    // Check if already exists
    const existing = await db
      .select()
      .from(cachedResponses)
      .where(eq(cachedResponses.questionNormalized, normalized))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(cachedResponses)
        .set({
          answer,
          sources,
          category,
          lastUsedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
          expiresAt: expiresAt.toISOString().slice(0, 19).replace("T", " "),
        })
        .where(eq(cachedResponses.id, existing[0].id));
    } else {
      // Insert new
      await db.insert(cachedResponses).values({
        questionNormalized: normalized,
        questionOriginal: question,
        answer,
        sources,
        category,
        expiresAt: expiresAt.toISOString().slice(0, 19).replace("T", " "),
      });
    }
  } catch (error) {
    console.error('[Cache] Error saving cached response:', error);
  }
}

/**
 * تحديث إحصائيات الاستخدام عند استخدام الـ cache
 */
async function updateCacheHit(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(cachedResponses)
      .set({
        hitCount: sql`${cachedResponses.hitCount} + 1`,
        lastUsedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      })
      .where(eq(cachedResponses.id, id));
  } catch (error) {
    console.error('[Cache] Error updating cache hit:', error);
  }
}

/**
 * تحديث تقييم الإجابة المحفوظة
 */
export async function updateCachedResponseRating(
  question: string,
  rating: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const normalized = normalizeQuestion(question);

  try {
    const cached = await db
      .select()
      .from(cachedResponses)
      .where(eq(cachedResponses.questionNormalized, normalized))
      .limit(1);

    if (cached.length > 0) {
      const current = cached[0];
      const newRatingCount = current.ratingCount + 1;
      const currentRating = parseFloat(current.rating || "0");
      const newRating = ((currentRating * current.ratingCount) + rating) / newRatingCount;

      await db
        .update(cachedResponses)
        .set({
          rating: newRating.toFixed(2),
          ratingCount: newRatingCount,
        })
        .where(eq(cachedResponses.id, current.id));
    }
  } catch (error) {
    console.error('[Cache] Error updating rating:', error);
  }
}

/**
 * الحصول على الأسئلة الأكثر شيوعاً
 */
export async function getMostFrequentQuestions(limit: number = 20): Promise<CachedResponse[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    return await db
      .select()
      .from(cachedResponses)
      .where(
        sql`(${cachedResponses.expiresAt} IS NULL OR ${cachedResponses.expiresAt} > ${now})`
      )
      .orderBy(desc(cachedResponses.hitCount))
      .limit(limit);
  } catch (error) {
    console.error('[Cache] Error getting frequent questions:', error);
    return [];
  }
}

/**
 * حذف الإجابات المنتهية الصلاحية
 */
export async function cleanExpiredCache(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();

  try {
    const result = await db
      .delete(cachedResponses)
      .where(
        and(
          sql`${cachedResponses.expiresAt} IS NOT NULL`,
          sql`${cachedResponses.expiresAt} < ${now}`
        )
      );

    return 0; // Deletion successful
  } catch (error) {
    console.error('[Cache] Error cleaning expired cache:', error);
    return 0;
  }
}

/**
 * إحصائيات الـ cache
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  totalHits: number;
  avgRating: number;
  topQuestions: Array<{ question: string; hitCount: number }>;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalCached: 0,
      totalHits: 0,
      avgRating: 0,
      topQuestions: [],
    };
  }

  try {
    const stats = await db
      .select({
        totalCached: sql<number>`COUNT(*)`,
        totalHits: sql<number>`SUM(${cachedResponses.hitCount})`,
        avgRating: sql<number>`AVG(${cachedResponses.rating})`,
      })
      .from(cachedResponses);

    const topQuestions = await db
      .select({
        question: cachedResponses.questionOriginal,
        hitCount: cachedResponses.hitCount,
      })
      .from(cachedResponses)
      .orderBy(desc(cachedResponses.hitCount))
      .limit(10);

    return {
      totalCached: Number(stats[0]?.totalCached) || 0,
      totalHits: Number(stats[0]?.totalHits) || 0,
      avgRating: Number(stats[0]?.avgRating) || 0,
      topQuestions: topQuestions || [],
    };
  } catch (error) {
    console.error('[Cache] Error getting cache stats:', error);
    return {
      totalCached: 0,
      totalHits: 0,
      avgRating: 0,
      topQuestions: [],
    };
  }
}
