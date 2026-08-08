import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { cachedResponses } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

describe("Cache Analytics Router", () => {
  const caller = appRouter.createCaller({
    user: { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
    req: {} as any,
    res: {} as any,
  });

  beforeAll(async () => {
    // Insert test cache data
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Clean up existing test data - use raw SQL
    try {
      await db.execute(sql`DELETE FROM cached_responses WHERE 1=1`);
    } catch (e) {
      // Ignore if table is empty
    }

    // Insert sample cache entries
    await db.insert(cachedResponses).values([
      {
        questionOriginal: "ما هي شروط الوقف الصحيح؟",
        questionNormalized: "ما هي شروط الوقف الصحيح",
        answer: "شروط الوقف الصحيح هي...",
        category: "jurisprudence",
        hitCount: 15,
        rating: 4.5,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        questionOriginal: "ما هي أنواع الأوقاف في فلسطين؟",
        questionNormalized: "ما هي أنواع الأوقاف في فلسطين",
        answer: "أنواع الأوقاف في فلسطين هي...",
        category: "legal",
        hitCount: 12,
        rating: 4.2,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        questionOriginal: "كيف يتم إدارة الأوقاف؟",
        questionNormalized: "كيف يتم إدارة الأوقاف",
        answer: "إدارة الأوقاف تتم من خلال...",
        category: "administrative",
        hitCount: 8,
        rating: 4.0,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        questionOriginal: "ما هو تاريخ الأوقاف في فلسطين؟",
        questionNormalized: "ما هو تاريخ الأوقاف في فلسطين",
        answer: "تاريخ الأوقاف في فلسطين يعود إلى...",
        category: "historical",
        hitCount: 5,
        rating: 3.8,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        questionOriginal: "ما هي الأوقاف؟",
        questionNormalized: "ما هي الأوقاف",
        answer: "الأوقاف هي...",
        category: "general",
        hitCount: 20,
        rating: 4.7,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      // Add an expired entry
      {
        questionOriginal: "سؤال منتهي الصلاحية",
        questionNormalized: "سؤال منتهي الصلاحية",
        answer: "إجابة قديمة",
        category: "general",
        hitCount: 1,
        rating: 2.0,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
      },
    ]);
  });

  describe("cache.getStats", () => {
    it("should return cache statistics", async () => {
      const stats = await caller.cache.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalCached).toBeGreaterThanOrEqual(5);
      expect(stats.totalHits).toBeGreaterThanOrEqual(60);
      expect(stats.avgRating).toBeGreaterThan(0);
      expect(stats.topQuestions).toBeDefined();
      expect(Array.isArray(stats.topQuestions)).toBe(true);
    });

    it("should return top questions sorted by hit count", async () => {
      const stats = await caller.cache.getStats();

      expect(stats.topQuestions.length).toBeGreaterThan(0);
      
      // Check if sorted by hitCount descending
      for (let i = 0; i < stats.topQuestions.length - 1; i++) {
        expect(stats.topQuestions[i].hitCount).toBeGreaterThanOrEqual(
          stats.topQuestions[i + 1].hitCount
        );
      }
    });

    it("should calculate average rating correctly", async () => {
      const stats = await caller.cache.getStats();

      expect(stats.avgRating).toBeGreaterThan(0);
      expect(stats.avgRating).toBeLessThanOrEqual(5);
    });
  });

  describe("cache.getMostFrequent", () => {
    it("should return most frequent questions with default limit", async () => {
      const questions = await caller.cache.getMostFrequent({});

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(20);
    });

    it("should return most frequent questions with custom limit", async () => {
      const questions = await caller.cache.getMostFrequent({ limit: 3 });

      expect(questions.length).toBeLessThanOrEqual(3);
    });

    it("should return questions sorted by hit count descending", async () => {
      const questions = await caller.cache.getMostFrequent({ limit: 10 });

      for (let i = 0; i < questions.length - 1; i++) {
        expect(questions[i].hitCount).toBeGreaterThanOrEqual(questions[i + 1].hitCount);
      }
    });

    it("should include all required fields", async () => {
      const questions = await caller.cache.getMostFrequent({ limit: 5 });

      questions.forEach((q) => {
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("questionOriginal");
        expect(q).toHaveProperty("category");
        expect(q).toHaveProperty("hitCount");
        expect(q).toHaveProperty("rating");
      });
    });

    it("should filter out expired entries", async () => {
      const questions = await caller.cache.getMostFrequent({ limit: 20 });

      // Should not include the expired question
      const expiredQuestion = questions.find(
        (q) => q.questionOriginal === "سؤال منتهي الصلاحية"
      );
      expect(expiredQuestion).toBeUndefined();
    });
  });

  describe("cache.cleanExpired", () => {
    it("should clean expired cache entries", async () => {
      const result = await caller.cache.cleanExpired();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });

    it("should only delete expired entries", async () => {
      const beforeStats = await caller.cache.getStats();
      
      await caller.cache.cleanExpired();
      
      const afterStats = await caller.cache.getStats();

      // Total cached should decrease by at most the number of expired entries
      expect(afterStats.totalCached).toBeLessThanOrEqual(beforeStats.totalCached);
    });
  });

  describe("cache.updateSuggestedQuestions", () => {
    it("should return suggested questions based on most frequent", async () => {
      const result = await caller.cache.updateSuggestedQuestions({});

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.suggestedQuestions)).toBe(true);
    });

    it("should return correct number of suggestions", async () => {
      const result = await caller.cache.updateSuggestedQuestions({ topN: 5 });

      expect(result.suggestedQuestions.length).toBeLessThanOrEqual(5);
    });

    it("should include required fields in suggestions", async () => {
      const result = await caller.cache.updateSuggestedQuestions({ topN: 3 });

      result.suggestedQuestions.forEach((q) => {
        expect(q).toHaveProperty("question");
        expect(q).toHaveProperty("category");
        expect(q).toHaveProperty("hitCount");
        expect(q).toHaveProperty("rating");
      });
    });

    it("should return questions sorted by hit count", async () => {
      const result = await caller.cache.updateSuggestedQuestions({ topN: 10 });

      for (let i = 0; i < result.suggestedQuestions.length - 1; i++) {
        expect(result.suggestedQuestions[i].hitCount).toBeGreaterThanOrEqual(
          result.suggestedQuestions[i + 1].hitCount
        );
      }
    });
  });

  describe("Authorization", () => {
    it("should require admin role for cache.getStats", async () => {
      const nonAdminCaller = appRouter.createCaller({
        user: { id: 2, name: "User", email: "user@test.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(nonAdminCaller.cache.getStats()).rejects.toThrow();
    });

    it("should require admin role for cache.getMostFrequent", async () => {
      const nonAdminCaller = appRouter.createCaller({
        user: { id: 2, name: "User", email: "user@test.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(nonAdminCaller.cache.getMostFrequent({})).rejects.toThrow();
    });

    it("should require admin role for cache.cleanExpired", async () => {
      const nonAdminCaller = appRouter.createCaller({
        user: { id: 2, name: "User", email: "user@test.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(nonAdminCaller.cache.cleanExpired()).rejects.toThrow();
    });

    it("should require admin role for cache.updateSuggestedQuestions", async () => {
      const nonAdminCaller = appRouter.createCaller({
        user: { id: 2, name: "User", email: "user@test.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        nonAdminCaller.cache.updateSuggestedQuestions({})
      ).rejects.toThrow();
    });
  });
});
