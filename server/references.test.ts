import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Land References Router", () => {
  const mockContext: TrpcContext = {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "test",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  describe("references.list", () => {
    it("should return all active land references", async () => {
      const result = await caller.references.list();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return references with correct structure", async () => {
      const result = await caller.references.list();
      
      if (result.length > 0) {
        const reference = result[0];
        expect(reference).toHaveProperty("id");
        expect(reference).toHaveProperty("title");
        expect(reference).toHaveProperty("type");
        expect(reference).toHaveProperty("region");
        expect(reference).toHaveProperty("year");
      }
    });

    it("should return references sorted by year (descending)", async () => {
      const result = await caller.references.list();
      
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].year).toBeGreaterThanOrEqual(result[i + 1].year);
        }
      }
    });
  });

  describe("references.getById", () => {
    it("should return a specific reference by ID", async () => {
      const allReferences = await caller.references.list();
      if (allReferences.length > 0) {
        const firstId = allReferences[0].id;
        const result = await caller.references.getById({ id: firstId });
        
        expect(result).toBeDefined();
        expect(result?.id).toBe(firstId);
      }
    });

    it("should return undefined for non-existent ID", async () => {
      const result = await caller.references.getById({ id: 999999 });
      expect(result).toBeUndefined();
    });
  });

  describe("references.getRegions", () => {
    it("should return list of unique regions", async () => {
      const result = await caller.references.getRegions();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return regions in alphabetical order", async () => {
      const result = await caller.references.getRegions();
      
      if (result.length > 1) {
        const sorted = [...result].sort();
        expect(result).toEqual(sorted);
      }
    });

    it("should not contain duplicate regions", async () => {
      const result = await caller.references.getRegions();
      const unique = [...new Set(result)];
      expect(result.length).toBe(unique.length);
    });
  });

  describe("references.getStats", () => {
    it("should return statistics object", async () => {
      const result = await caller.references.getStats();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byType");
      expect(result).toHaveProperty("byRegion");
      expect(result).toHaveProperty("byDecade");
    });

    it("should have correct total count", async () => {
      const allReferences = await caller.references.list();
      const stats = await caller.references.getStats();
      
      expect(stats.total).toBe(allReferences.length);
    });

    it("should have valid type distribution", async () => {
      const stats = await caller.references.getStats();
      
      expect(typeof stats.byType).toBe("object");
      const totalByType = Object.values(stats.byType).reduce((sum, count) => sum + (count as number), 0);
      expect(totalByType).toBe(stats.total);
    });

    it("should have valid region distribution", async () => {
      const stats = await caller.references.getStats();
      
      expect(typeof stats.byRegion).toBe("object");
      const totalByRegion = Object.values(stats.byRegion).reduce((sum, count) => sum + (count as number), 0);
      expect(totalByRegion).toBe(stats.total);
    });
  });

  describe("references.create (Admin only)", () => {
    it("should create a new land reference", async () => {
      const newReference = {
        title: "Test Reference",
        description: "Test description",
        author: "Test Author",
        type: "other" as const,
        region: "Test Region",
        year: 2000,
        sourceUrl: "https://example.com/test",
      };

      const result = await caller.references.create(newReference);
      
      expect(result).toBeDefined();
      expect(result.title).toBe(newReference.title);
      expect(result.type).toBe(newReference.type);
      expect(result.region).toBe(newReference.region);
      expect(result.year).toBe(newReference.year);
    });

    it("should require admin role", async () => {
      const userContext: TrpcContext = {
        ...mockContext,
        user: {
          ...mockContext.user!,
          role: "user",
        },
      };

      const userCaller = appRouter.createCaller(userContext);

      await expect(
        userCaller.references.create({
          title: "Test",
          type: "other",
          region: "Test",
          year: 2000,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("references.update (Admin only)", () => {
    it("should update an existing reference", async () => {
      const allReferences = await caller.references.list();
      if (allReferences.length > 0) {
        const referenceId = allReferences[0].id;
        
        await caller.references.update({
          id: referenceId,
          title: "Updated Title",
        });

        const updated = await caller.references.getById({ id: referenceId });
        expect(updated?.title).toBe("Updated Title");
      }
    });

    it("should require admin role", async () => {
      const userContext: TrpcContext = {
        ...mockContext,
        user: {
          ...mockContext.user!,
          role: "user",
        },
      };

      const userCaller = appRouter.createCaller(userContext);

      await expect(
        userCaller.references.update({
          id: 1,
          title: "Test",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("references.delete (Admin only)", () => {
    it("should require admin role", async () => {
      const userContext: TrpcContext = {
        ...mockContext,
        user: {
          ...mockContext.user!,
          role: "user",
        },
      };

      const userCaller = appRouter.createCaller(userContext);

      await expect(
        userCaller.references.delete({ id: 1 })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("Data Validation", () => {
    it("should have valid reference types", async () => {
      const validTypes = [
        "ottoman_record",
        "british_mandate",
        "jordanian_law",
        "israeli_document",
        "palestinian_law",
        "court_ruling",
        "historical_map",
        "land_registry",
        "waqf_deed",
        "other",
      ];

      const allReferences = await caller.references.list();
      
      allReferences.forEach((ref) => {
        expect(validTypes).toContain(ref.type);
      });
    });

    it("should have valid year ranges", async () => {
      const allReferences = await caller.references.list();
      
      allReferences.forEach((ref) => {
        expect(ref.year).toBeGreaterThan(1500);
        expect(ref.year).toBeLessThanOrEqual(new Date().getFullYear());
      });
    });

    it("should have non-empty titles and regions", async () => {
      const allReferences = await caller.references.list();
      
      allReferences.forEach((ref) => {
        expect(ref.title).toBeTruthy();
        expect(ref.title.length).toBeGreaterThan(0);
        expect(ref.region).toBeTruthy();
        expect(ref.region.length).toBeGreaterThan(0);
      });
    });
  });
});
