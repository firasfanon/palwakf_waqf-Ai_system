import { describe, it, expect, beforeAll, afterAll } from "vitest";
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

describe("Knowledge Sources Management", () => {
  let testSourceId: number;
  const caller = appRouter.createCaller(mockAdminContext);

  describe("Admin Operations", () => {
    it("should create a new knowledge source", async () => {
      const result = await caller.knowledgeSources.create({
        name: "Test Wikipedia Source",
        type: "wikipedia",
        url: "https://ar.wikipedia.org/wiki/وقف",
        fetchFrequency: "manual",
        config: JSON.stringify({ maxItems: 10 }),
      });

      expect(result.success).toBe(true);
      expect(result.source).toBeDefined();
      expect(result.source.name).toBe("Test Wikipedia Source");
      expect(result.source.type).toBe("wikipedia");
      
      testSourceId = result.source.id;
    });

    it("should list all knowledge sources", async () => {
      const sources = await caller.knowledgeSources.list();
      
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      
      const testSource = sources.find((s: any) => s.id === testSourceId);
      expect(testSource).toBeDefined();
      expect(testSource?.name).toBe("Test Wikipedia Source");
    });

    it("should get a specific knowledge source by ID", async () => {
      const source = await caller.knowledgeSources.get({ id: testSourceId });
      
      expect(source).toBeDefined();
      expect(source.id).toBe(testSourceId);
      expect(source.name).toBe("Test Wikipedia Source");
      expect(source.type).toBe("wikipedia");
    });

    it("should update a knowledge source", async () => {
      const result = await caller.knowledgeSources.update({
        id: testSourceId,
        name: "Updated Wikipedia Source",
        fetchFrequency: "daily",
      });

      expect(result.success).toBe(true);

      // Verify the update
      const source = await caller.knowledgeSources.get({ id: testSourceId });
      expect(source.name).toBe("Updated Wikipedia Source");
      expect(source.fetchFrequency).toBe("daily");
    });

    it("should toggle source active status", async () => {
      // Deactivate
      const deactivateResult = await caller.knowledgeSources.toggleActive({
        id: testSourceId,
        isActive: false,
      });
      expect(deactivateResult.success).toBe(true);

      // Verify deactivation
      let source = await caller.knowledgeSources.get({ id: testSourceId });
      expect(source.isActive).toBe(0);

      // Reactivate
      const activateResult = await caller.knowledgeSources.toggleActive({
        id: testSourceId,
        isActive: true,
      });
      expect(activateResult.success).toBe(true);

      // Verify activation
      source = await caller.knowledgeSources.get({ id: testSourceId });
      expect(source.isActive).toBe(1);
    });

    it("should filter sources by active status", async () => {
      // Get only active sources
      const activeSources = await caller.knowledgeSources.list({ isActive: true });
      expect(Array.isArray(activeSources)).toBe(true);
      
      // All returned sources should be active
      activeSources.forEach((source: any) => {
        expect(source.isActive).toBe(1);
      });
    });

    it("should delete a knowledge source", async () => {
      const result = await caller.knowledgeSources.delete({ id: testSourceId });
      expect(result.success).toBe(true);

      // Verify deletion - should throw NOT_FOUND error
      await expect(
        caller.knowledgeSources.get({ id: testSourceId })
      ).rejects.toThrow();
    });
  });

  describe("Permission Tests", () => {
    it("should prevent non-admin from creating sources", async () => {
      const userCaller = appRouter.createCaller(mockUserContext);
      
      await expect(
        userCaller.knowledgeSources.create({
          name: "Unauthorized Source",
          type: "wikipedia",
          url: "https://example.com",
          fetchFrequency: "manual",
        })
      ).rejects.toThrow();
    });

    it("should prevent non-admin from updating sources", async () => {
      const userCaller = appRouter.createCaller(mockUserContext);
      
      await expect(
        userCaller.knowledgeSources.update({
          id: 1,
          name: "Unauthorized Update",
        })
      ).rejects.toThrow();
    });

    it("should prevent non-admin from deleting sources", async () => {
      const userCaller = appRouter.createCaller(mockUserContext);
      
      await expect(
        userCaller.knowledgeSources.delete({ id: 1 })
      ).rejects.toThrow();
    });

    it("should allow regular users to list sources", async () => {
      const userCaller = appRouter.createCaller(mockUserContext);
      const sources = await userCaller.knowledgeSources.list();
      
      expect(Array.isArray(sources)).toBe(true);
    });

    it("should allow regular users to get source details", async () => {
      // First create a source as admin
      const adminCaller = appRouter.createCaller(mockAdminContext);
      const createResult = await adminCaller.knowledgeSources.create({
        name: "Public Test Source",
        type: "rss",
        url: "https://example.com/rss",
        fetchFrequency: "manual",
      });

      const sourceId = createResult.source.id;

      // Now try to get it as regular user
      const userCaller = appRouter.createCaller(mockUserContext);
      const source = await userCaller.knowledgeSources.get({ id: sourceId });
      
      expect(source).toBeDefined();
      expect(source.id).toBe(sourceId);

      // Cleanup
      await adminCaller.knowledgeSources.delete({ id: sourceId });
    });
  });

  describe("Validation Tests", () => {
    it("should reject invalid source type", async () => {
      await expect(
        caller.knowledgeSources.create({
          name: "Invalid Source",
          type: "invalid_type" as any,
          url: "https://example.com",
          fetchFrequency: "manual",
        })
      ).rejects.toThrow();
    });

    it("should reject invalid URL", async () => {
      await expect(
        caller.knowledgeSources.create({
          name: "Invalid URL Source",
          type: "wikipedia",
          url: "not-a-valid-url",
          fetchFrequency: "manual",
        })
      ).rejects.toThrow();
    });

    it("should reject empty name", async () => {
      await expect(
        caller.knowledgeSources.create({
          name: "",
          type: "wikipedia",
          url: "https://example.com",
          fetchFrequency: "manual",
        })
      ).rejects.toThrow();
    });

    it("should reject invalid fetch frequency", async () => {
      await expect(
        caller.knowledgeSources.create({
          name: "Invalid Frequency Source",
          type: "wikipedia",
          url: "https://example.com",
          fetchFrequency: "invalid" as any,
        })
      ).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle getting non-existent source", async () => {
      await expect(
        caller.knowledgeSources.get({ id: 999999 })
      ).rejects.toThrow("المصدر غير موجود");
    });

    it("should handle deleting non-existent source", async () => {
      // This might not throw an error depending on implementation
      // but should handle gracefully
      const result = await caller.knowledgeSources.delete({ id: 999999 });
      expect(result.success).toBe(true);
    });

    it("should handle optional config field", async () => {
      const result = await caller.knowledgeSources.create({
        name: "Source Without Config",
        type: "rss",
        url: "https://example.com/feed",
        fetchFrequency: "weekly",
      });

      expect(result.success).toBe(true);
      expect(result.source.config).toBeNull();

      // Cleanup
      await caller.knowledgeSources.delete({ id: result.source.id });
    });

    it("should handle valid JSON config", async () => {
      const config = { maxItems: 20, category: "law" };
      const result = await caller.knowledgeSources.create({
        name: "Source With Config",
        type: "api",
        url: "https://api.example.com/data",
        fetchFrequency: "monthly",
        config: JSON.stringify(config),
      });

      expect(result.success).toBe(true);
      expect(result.source.config).toBe(JSON.stringify(config));

      // Cleanup
      await caller.knowledgeSources.delete({ id: result.source.id });
    });
  });
});
