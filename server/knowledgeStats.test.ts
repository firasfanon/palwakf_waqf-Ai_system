import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock admin user context
const mockAdminContext: Context = {
  user: {
    id: 1,
    openId: "test-admin-openid",
    name: "Test Admin",
    email: "admin@test.com",
    role: "admin",
    createdAt: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock regular user context
const mockUserContext: Context = {
  user: {
    id: 2,
    openId: "test-user-openid",
    name: "Test User",
    email: "user@test.com",
    role: "user",
    createdAt: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

describe("Knowledge Sources Statistics", () => {
  const adminCaller = appRouter.createCaller(mockAdminContext);
  const userCaller = appRouter.createCaller(mockUserContext);

  // Setup: Create test sources
  beforeAll(async () => {
    // Create a few test sources for statistics
    await adminCaller.knowledgeSources.create({
      name: "Stats Test Wikipedia",
      type: "wikipedia",
      url: "https://ar.wikipedia.org/wiki/test",
      fetchFrequency: "daily",
    });

    await adminCaller.knowledgeSources.create({
      name: "Stats Test RSS",
      type: "rss",
      url: "https://example.com/rss",
      fetchFrequency: "weekly",
    });

    await adminCaller.knowledgeSources.create({
      name: "Stats Test API",
      type: "api",
      url: "https://api.example.com/data",
      fetchFrequency: "manual",
    });
  });

  describe("Stats Endpoint", () => {
    it("should return comprehensive statistics", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      expect(stats).toBeDefined();
      expect(stats.totalSources).toBeGreaterThan(0);
      expect(stats.activeSources).toBeGreaterThanOrEqual(0);
      expect(stats.inactiveSources).toBeGreaterThanOrEqual(0);
      expect(stats.totalSources).toBe(stats.activeSources + stats.inactiveSources);
    });

    it("should include source type breakdown", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      expect(stats.sourcesByType).toBeDefined();
      expect(typeof stats.sourcesByType).toBe("object");
      
      // Should have at least the types we created
      const types = Object.keys(stats.sourcesByType);
      expect(types.length).toBeGreaterThan(0);
    });

    it("should calculate success rate correctly", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      expect(stats.successRate).toBeDefined();
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
      expect(typeof stats.successRate).toBe("number");
    });

    it("should include total items count", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      expect(stats.totalItems).toBeDefined();
      expect(typeof stats.totalItems).toBe("number");
      expect(stats.totalItems).toBeGreaterThanOrEqual(0);
    });

    it("should include success and error counts", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      expect(stats.totalSuccess).toBeDefined();
      expect(stats.totalErrors).toBeDefined();
      expect(typeof stats.totalSuccess).toBe("number");
      expect(typeof stats.totalErrors).toBe("number");
      expect(stats.totalSuccess).toBeGreaterThanOrEqual(0);
      expect(stats.totalErrors).toBeGreaterThanOrEqual(0);
    });

    it("should include recent fetches count", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      expect(stats.recentFetches).toBeDefined();
      expect(typeof stats.recentFetches).toBe("number");
      expect(stats.recentFetches).toBeGreaterThanOrEqual(0);
    });

    it("should allow regular users to view stats", async () => {
      const stats = await userCaller.knowledgeSources.stats();

      expect(stats).toBeDefined();
      expect(stats.totalSources).toBeGreaterThan(0);
    });
  });

  describe("Top Active Sources", () => {
    it("should return top active sources", async () => {
      const topSources = await adminCaller.knowledgeSources.topActive({ limit: 5 });

      expect(Array.isArray(topSources)).toBe(true);
      expect(topSources.length).toBeLessThanOrEqual(5);
    });

    it("should respect the limit parameter", async () => {
      const top3 = await adminCaller.knowledgeSources.topActive({ limit: 3 });
      const top10 = await adminCaller.knowledgeSources.topActive({ limit: 10 });

      expect(top3.length).toBeLessThanOrEqual(3);
      expect(top10.length).toBeLessThanOrEqual(10);
    });

    it("should use default limit when not specified", async () => {
      const topSources = await adminCaller.knowledgeSources.topActive();

      expect(Array.isArray(topSources)).toBe(true);
      expect(topSources.length).toBeLessThanOrEqual(5); // Default is 5
    });

    it("should include source details", async () => {
      const topSources = await adminCaller.knowledgeSources.topActive({ limit: 1 });

      if (topSources.length > 0) {
        const source = topSources[0];
        expect(source.id).toBeDefined();
        expect(source.name).toBeDefined();
        expect(source.type).toBeDefined();
        expect(source.url).toBeDefined();
      }
    });

    it("should allow regular users to view top sources", async () => {
      const topSources = await userCaller.knowledgeSources.topActive({ limit: 5 });

      expect(Array.isArray(topSources)).toBe(true);
    });
  });

  describe("Fetch Activity", () => {
    it("should return fetch activity data", async () => {
      const activity = await adminCaller.knowledgeSources.fetchActivity();

      expect(Array.isArray(activity)).toBe(true);
    });

    it("should include activity details when data exists", async () => {
      const activity = await adminCaller.knowledgeSources.fetchActivity();

      if (activity.length > 0) {
        const dayActivity = activity[0];
        expect(dayActivity.date).toBeDefined();
        expect(dayActivity.success).toBeDefined();
        expect(dayActivity.failed).toBeDefined();
        expect(dayActivity.total).toBeDefined();
        expect(typeof dayActivity.success).toBe("number");
        expect(typeof dayActivity.failed).toBe("number");
        expect(typeof dayActivity.total).toBe("number");
      }
    });

    it("should sort activity by date", async () => {
      const activity = await adminCaller.knowledgeSources.fetchActivity();

      if (activity.length > 1) {
        for (let i = 0; i < activity.length - 1; i++) {
          expect(activity[i].date <= activity[i + 1].date).toBe(true);
        }
      }
    });

    it("should only include last 7 days", async () => {
      const activity = await adminCaller.knowledgeSources.fetchActivity();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      activity.forEach((day: any) => {
        const dayDate = new Date(day.date);
        expect(dayDate >= sevenDaysAgo).toBe(true);
      });
    });

    it("should allow regular users to view activity", async () => {
      const activity = await userCaller.knowledgeSources.fetchActivity();

      expect(Array.isArray(activity)).toBe(true);
    });
  });

  describe("Statistics Consistency", () => {
    it("should have consistent totals", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      // Total sources should equal active + inactive
      expect(stats.totalSources).toBe(stats.activeSources + stats.inactiveSources);

      // Source types should sum to total sources
      const typeSum = Object.values(stats.sourcesByType).reduce(
        (sum: number, count) => sum + (count as number),
        0
      );
      expect(typeSum).toBe(stats.totalSources);
    });

    it("should have valid success rate calculation", async () => {
      const stats = await adminCaller.knowledgeSources.stats();

      if (stats.totalSuccess + stats.totalErrors > 0) {
        const expectedRate = Math.round(
          (stats.totalSuccess / (stats.totalSuccess + stats.totalErrors)) * 100
        );
        expect(stats.successRate).toBe(expectedRate);
      } else {
        expect(stats.successRate).toBe(0);
      }
    });
  });

  describe("Performance", () => {
    it("should return stats quickly", async () => {
      const startTime = Date.now();
      await adminCaller.knowledgeSources.stats();
      const endTime = Date.now();

      // Should complete within 2 seconds
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it("should return top active sources quickly", async () => {
      const startTime = Date.now();
      await adminCaller.knowledgeSources.topActive({ limit: 10 });
      const endTime = Date.now();

      // Should complete within 2 seconds
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it("should return fetch activity quickly", async () => {
      const startTime = Date.now();
      await adminCaller.knowledgeSources.fetchActivity();
      const endTime = Date.now();

      // Should complete within 2 seconds
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
