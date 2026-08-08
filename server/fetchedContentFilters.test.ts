import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Fetched Content Advanced Filters", () => {
  const mockContext: Context = {
    user: { id: 1, name: "Test User", email: "test@example.com", role: "admin", openId: "test-open-id" },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  describe("Date Range Filter", () => {
    it("should filter by dateFrom", async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await caller.fetchedContent.list({
        status: "all",
        dateFrom: today,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      // All items should be from today or later
      result.items.forEach(item => {
        const itemDate = new Date(item.fetchedAt).toISOString().split('T')[0];
        expect(itemDate >= today).toBe(true);
      });
    });

    it("should filter by dateTo", async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await caller.fetchedContent.list({
        status: "all",
        dateTo: today,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      // All items should be before or on today
      result.items.forEach(item => {
        const itemDate = new Date(item.fetchedAt).toISOString().split('T')[0];
        expect(itemDate <= today).toBe(true);
      });
    });

    it("should filter by date range", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dateFrom = yesterday.toISOString().split('T')[0];
      const dateTo = tomorrow.toISOString().split('T')[0];

      const result = await caller.fetchedContent.list({
        status: "all",
        dateFrom,
        dateTo,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      // All items should be within the range
      result.items.forEach(item => {
        const itemDate = new Date(item.fetchedAt).toISOString().split('T')[0];
        expect(itemDate >= dateFrom && itemDate <= dateTo).toBe(true);
      });
    });

    it("should handle empty date range", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateFrom = futureDate.toISOString().split('T')[0];

      const result = await caller.fetchedContent.list({
        status: "all",
        dateFrom,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBe(0);
    });
  });

  describe("Source Filter", () => {
    it("should filter by sourceId", async () => {
      // First, get a valid source ID
      const sources = await caller.knowledgeSources.list({});
      if (!sources || !sources.items || sources.items.length === 0) {
        // Skip test if no sources exist
        return;
      }

      const sourceId = sources.items[0].id;
      const result = await caller.fetchedContent.list({
        status: "all",
        sourceId,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      // All items should be from the specified source
      result.items.forEach(item => {
        expect(item.sourceId).toBe(sourceId);
      });
    });

    it("should handle non-existent sourceId", async () => {
      const result = await caller.fetchedContent.list({
        status: "all",
        sourceId: 999999,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBe(0);
    });
  });

  describe("Combined Filters", () => {
    it("should apply multiple filters together", async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await caller.fetchedContent.list({
        status: "pending",
        category: "law",
        dateFrom: today,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      // All items should match all filters
      result.items.forEach(item => {
        expect(item.status).toBe("pending");
        expect(item.category).toBe("law");
        const itemDate = new Date(item.fetchedAt).toISOString().split('T')[0];
        expect(itemDate >= today).toBe(true);
      });
    });

    it("should apply source and date filters together", async () => {
      const sources = await caller.knowledgeSources.list({});
      if (!sources || !sources.items || sources.items.length === 0) {
        return;
      }

      const sourceId = sources.items[0].id;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 7);
      const dateFrom = yesterday.toISOString().split('T')[0];

      const result = await caller.fetchedContent.list({
        status: "all",
        sourceId,
        dateFrom,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      result.items.forEach(item => {
        expect(item.sourceId).toBe(sourceId);
        const itemDate = new Date(item.fetchedAt).toISOString().split('T')[0];
        expect(itemDate >= dateFrom).toBe(true);
      });
    });
  });

  describe("Filter Reset", () => {
    it("should return all items when no filters applied", async () => {
      const result = await caller.fetchedContent.list({
        status: "all",
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("should respect pagination with filters", async () => {
      const today = new Date().toISOString().split('T')[0];
      const page1 = await caller.fetchedContent.list({
        status: "all",
        dateFrom: today,
        limit: 5,
        offset: 0,
      });

      const page2 = await caller.fetchedContent.list({
        status: "all",
        dateFrom: today,
        limit: 5,
        offset: 5,
      });

      expect(page1.items).toBeInstanceOf(Array);
      expect(page2.items).toBeInstanceOf(Array);
      
      // Items should be different
      if (page1.items.length > 0 && page2.items.length > 0) {
        expect(page1.items[0].id).not.toBe(page2.items[0].id);
      }
    });
  });

  describe("Count with Filters", () => {
    it("should count correctly with date filter", async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await caller.fetchedContent.list({
        status: "all",
        dateFrom: today,
        limit: 1000,
        offset: 0,
      });

      expect(result.total).toBe(result.items.length);
    });

    it("should count correctly with multiple filters", async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await caller.fetchedContent.list({
        status: "pending",
        category: "law",
        dateFrom: today,
        limit: 1000,
        offset: 0,
      });

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(result.items.length);
    });
  });
});
