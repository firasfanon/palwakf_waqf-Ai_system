import { describe, it, expect, beforeAll } from "vitest";
import {
  getWaqfCategories,
  getWaqfCategoryById,
  createWaqfCategory,
  updateWaqfCategory,
  deleteWaqfCategory,
  getWaqfPropertiesCountByCategory,
  getWaqfStatistics,
} from "./db";

describe("Waqf Categories Management", () => {
  let testCategoryId: number;

  describe("createWaqfCategory", () => {
    it("should create a new waqf category", async () => {
      const category = await createWaqfCategory({
        name: "Religious Buildings",
        nameAr: "المباني الدينية",
        description: "مساجد ومقامات ومدارس دينية",
        icon: "Building",
        color: "#10b981",
        order: 1,
        createdBy: 1,
      });

      expect(category).toBeDefined();
      expect(category.name).toBe("Religious Buildings");
      expect(category.nameAr).toBe("المباني الدينية");
      testCategoryId = category.id;
    });

    it("should create category without optional fields", async () => {
      const category = await createWaqfCategory({
        name: "Test Category",
        nameAr: "تصنيف تجريبي",
        createdBy: 1,
      });

      expect(category).toBeDefined();
      expect(category.name).toBe("Test Category");
    });
  });

  describe("getWaqfCategories", () => {
    it("should retrieve all active categories", async () => {
      const categories = await getWaqfCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should return categories ordered by order and nameAr", async () => {
      const categories = await getWaqfCategories();

      if (categories.length > 1) {
        // Check if categories are ordered
        for (let i = 0; i < categories.length - 1; i++) {
          expect(categories[i].order).toBeLessThanOrEqual(categories[i + 1].order);
        }
      }
    });
  });

  describe("getWaqfCategoryById", () => {
    it("should retrieve a category by ID", async () => {
      const category = await getWaqfCategoryById(testCategoryId);

      expect(category).toBeDefined();
      expect(category?.id).toBe(testCategoryId);
      expect(category?.name).toBe("Religious Buildings");
    });

    it("should return undefined for non-existent category", async () => {
      const category = await getWaqfCategoryById(999999);

      expect(category).toBeUndefined();
    });
  });

  describe("updateWaqfCategory", () => {
    it("should update category name", async () => {
      await updateWaqfCategory(testCategoryId, {
        name: "Religious Buildings Updated",
        nameAr: "المباني الدينية المحدثة",
      });

      const updated = await getWaqfCategoryById(testCategoryId);
      expect(updated?.name).toBe("Religious Buildings Updated");
      expect(updated?.nameAr).toBe("المباني الدينية المحدثة");
    });

    it("should update category icon and color", async () => {
      await updateWaqfCategory(testCategoryId, {
        icon: "Landmark",
        color: "#3b82f6",
      });

      const updated = await getWaqfCategoryById(testCategoryId);
      expect(updated?.icon).toBe("Landmark");
      expect(updated?.color).toBe("#3b82f6");
    });

    it("should update category order", async () => {
      await updateWaqfCategory(testCategoryId, {
        order: 10,
      });

      const updated = await getWaqfCategoryById(testCategoryId);
      expect(updated?.order).toBe(10);
    });
  });

  describe("getWaqfPropertiesCountByCategory", () => {
    it("should return count of properties by category", async () => {
      const counts = await getWaqfPropertiesCountByCategory();

      expect(Array.isArray(counts)).toBe(true);
      // Each item should have categoryId and count
      counts.forEach((item) => {
        expect(item).toHaveProperty("categoryId");
        expect(item).toHaveProperty("count");
        expect(typeof item.count).toBe("number");
      });
    });
  });

  describe("getWaqfStatistics", () => {
    it("should return comprehensive waqf statistics", async () => {
      const stats = await getWaqfStatistics();

      expect(stats).toBeDefined();
      expect(typeof stats.totalWaqfs).toBe("number");
      expect(typeof stats.totalCategories).toBe("number");
      expect(Array.isArray(stats.waqfsByCategory)).toBe(true);
      expect(Array.isArray(stats.waqfsByType)).toBe(true);
      expect(Array.isArray(stats.waqfsByStatus)).toBe(true);
      expect(Array.isArray(stats.waqfsByGovernorate)).toBe(true);
    });

    it("should return correct structure for waqfsByCategory", async () => {
      const stats = await getWaqfStatistics();

      stats.waqfsByCategory.forEach((item) => {
        expect(item).toHaveProperty("categoryId");
        expect(item).toHaveProperty("categoryName");
        expect(item).toHaveProperty("count");
        expect(typeof item.count).toBe("number");
      });
    });

    it("should return correct structure for waqfsByType", async () => {
      const stats = await getWaqfStatistics();

      stats.waqfsByType.forEach((item) => {
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("count");
        expect(["charitable", "family", "mixed"]).toContain(item.type);
      });
    });

    it("should return correct structure for waqfsByStatus", async () => {
      const stats = await getWaqfStatistics();

      stats.waqfsByStatus.forEach((item) => {
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("count");
        expect(["active", "inactive", "disputed", "under_development"]).toContain(item.status);
      });
    });

    it("should return correct structure for waqfsByGovernorate", async () => {
      const stats = await getWaqfStatistics();

      stats.waqfsByGovernorate.forEach((item) => {
        expect(item).toHaveProperty("governorate");
        expect(item).toHaveProperty("count");
        expect(typeof item.governorate).toBe("string");
      });
    });

    it("should have totalCategories matching active categories count", async () => {
      const stats = await getWaqfStatistics();
      const categories = await getWaqfCategories();

      expect(stats.totalCategories).toBe(categories.length);
    });
  });

  describe("deleteWaqfCategory", () => {
    it("should soft delete a category", async () => {
      await deleteWaqfCategory(testCategoryId);

      const deleted = await getWaqfCategoryById(testCategoryId);
      // Category should not be returned by getWaqfCategoryById after soft delete
      // because it filters by isActive = true
      expect(deleted?.isActive).toBe(false);
    });

    it("should not appear in active categories list after deletion", async () => {
      const categories = await getWaqfCategories();
      const found = categories.find((c) => c.id === testCategoryId);

      expect(found).toBeUndefined();
    });
  });
});

describe("Waqf Statistics Edge Cases", () => {
  it("should handle empty database gracefully", async () => {
    const stats = await getWaqfStatistics();

    expect(stats).toBeDefined();
    expect(stats.totalWaqfs).toBeGreaterThanOrEqual(0);
    expect(stats.totalCategories).toBeGreaterThanOrEqual(0);
  });

  it("should handle categories with no properties", async () => {
    const counts = await getWaqfPropertiesCountByCategory();

    // Should return array even if some categories have 0 properties
    expect(Array.isArray(counts)).toBe(true);
  });
});
