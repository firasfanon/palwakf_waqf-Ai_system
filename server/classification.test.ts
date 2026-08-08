/**
 * اختبارات نظام التصنيف الذكي والتقييم
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createClassificationRating,
  getClassificationRatingByContentId,
  getClassificationRatingsStats,
  createFetchedContent,
  getFetchedContentById,
} from "./db";
import { getDb } from "./db";
import { knowledgeSources } from "../drizzle/schema";

describe("نظام التصنيف والتقييم", () => {
  let testContentId: number;
  let testSourceId: number;

  beforeAll(async () => {
    // إنشاء knowledge source تجريبي أولاً
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [sourceResult] = await db.insert(knowledgeSources).values({
      name: "مصدر اختباري",
      type: "api",
      url: "https://test.com",
      isActive: true,
    });
    testSourceId = sourceResult.insertId;

    // إنشاء محتوى تجريبي للاختبار
    const content = await createFetchedContent({
      sourceId: testSourceId,
      title: "اختبار التصنيف",
      content: "محتوى تجريبي للاختبار",
      url: "https://test.com",
      category: "law",
      status: "processing",
    });
    testContentId = content.id;
  });

  describe("إنشاء التقييمات", () => {
    it("يجب أن ينشئ تقييم إيجابي بنجاح", async () => {
      const rating = await createClassificationRating({
        fetchedContentId: testContentId,
        rating: "positive",
        feedback: "تصنيف دقيق جداً",
        ratedBy: 1,
      });

      expect(rating).toBeDefined();
      expect(rating.rating).toBe("positive");
      expect(rating.fetchedContentId).toBe(testContentId);
      expect(rating.feedback).toBe("تصنيف دقيق جداً");
    });

    it("يجب أن ينشئ تقييم سلبي بنجاح", async () => {
      // إنشاء محتوى جديد للتقييم السلبي
      const content2 = await createFetchedContent({
        sourceId: testSourceId,
        title: "اختبار التصنيف 2",
        content: "محتوى تجريبي آخر",
        url: "https://test2.com",
        category: "jurisprudence",
        status: "processing",
      });

      const rating = await createClassificationRating({
        fetchedContentId: content2.id,
        rating: "negative",
        feedback: "التصنيف غير دقيق",
        ratedBy: 1,
      });

      expect(rating).toBeDefined();
      expect(rating.rating).toBe("negative");
      expect(rating.fetchedContentId).toBe(content2.id);
    });

    it("يجب أن ينشئ تقييم بدون ملاحظات", async () => {
      const content3 = await createFetchedContent({
        sourceId: testSourceId,
        title: "اختبار التصنيف 3",
        content: "محتوى تجريبي ثالث",
        url: "https://test3.com",
        category: "administrative",
        status: "processing",
      });

      const rating = await createClassificationRating({
        fetchedContentId: content3.id,
        rating: "positive",
        ratedBy: 1,
      });

      expect(rating).toBeDefined();
      expect(rating.feedback).toBeNull();
    });
  });

  describe("استرجاع التقييمات", () => {
    it("يجب أن يسترجع التقييم حسب معرف المحتوى", async () => {
      const rating = await getClassificationRatingByContentId(testContentId);

      expect(rating).toBeDefined();
      expect(rating?.fetchedContentId).toBe(testContentId);
      expect(rating?.rating).toBe("positive");
    });

    it("يجب أن يرجع undefined لمحتوى غير مقيّم", async () => {
      const rating = await getClassificationRatingByContentId(999999);

      expect(rating).toBeUndefined();
    });
  });

  describe("إحصائيات التقييمات", () => {
    it("يجب أن يحسب الإحصائيات بشكل صحيح", async () => {
      const stats = await getClassificationRatingsStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.positive).toBeGreaterThanOrEqual(2);
      expect(stats.negative).toBeGreaterThanOrEqual(1);
      expect(stats.accuracyRate).toBeGreaterThan(0);
      expect(stats.accuracyRate).toBeLessThanOrEqual(100);
    });

    it("يجب أن يحسب معدل الدقة بشكل صحيح", async () => {
      const stats = await getClassificationRatingsStats();

      const expectedAccuracy = (stats.positive / stats.total) * 100;
      expect(Math.abs(stats.accuracyRate - expectedAccuracy)).toBeLessThan(0.01);
    });

    it("يجب أن يكون مجموع الإيجابي والسلبي يساوي الإجمالي", async () => {
      const stats = await getClassificationRatingsStats();

      expect(stats.positive + stats.negative).toBe(stats.total);
    });
  });

  describe("التحقق من صحة البيانات", () => {
    it("يجب أن يحفظ timestamp بشكل صحيح", async () => {
      const content4 = await createFetchedContent({
        sourceId: testSourceId,
        title: "اختبار timestamp",
        content: "محتوى لاختبار التاريخ",
        url: "https://test4.com",
        category: "historical",
        status: "processing",
      });

      const rating = await createClassificationRating({
        fetchedContentId: content4.id,
        rating: "positive",
        ratedBy: 1,
      });

      // فقط نتحقق من وجود timestamp
      expect(rating.createdAt).toBeDefined();
      expect(rating.createdAt).toBeInstanceOf(Date);
    });

    it("يجب أن يحفظ معرف المستخدم بشكل صحيح", async () => {
      const content5 = await createFetchedContent({
        sourceId: testSourceId,
        title: "اختبار المستخدم",
        content: "محتوى لاختبار المستخدم",
        url: "https://test5.com",
        category: "reference",
        status: "processing",
      });

      const rating = await createClassificationRating({
        fetchedContentId: content5.id,
        rating: "negative",
        ratedBy: 1, // استخدام مستخدم موجود
      });

      expect(rating.ratedBy).toBe(1);
    });
  });
});
