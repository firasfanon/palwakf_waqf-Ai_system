import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context for admin user
const mockAdminContext: Context = {
  user: {
    id: 1,
    openId: "test-admin",
    name: "Test Admin",
    email: "admin@test.com",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "test",
  },
};

// Mock context for regular user
const mockUserContext: Context = {
  user: {
    id: 2,
    openId: "test-user",
    name: "Test User",
    email: "user@test.com",
    role: "user",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "test",
  },
};

// Mock context for guest (no user)
const mockGuestContext: Context = {
  user: null,
};

describe("HomeSections Router", () => {
  let testSectionId: number;

  describe("create", () => {
    it("should allow admin to create a section", async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.homeSections.create({
        title: "Test Section",
        content: "<p>Test content with <strong>rich text</strong></p>",
        order: 1,
        backgroundColor: "#f0f0f0",
        textColor: "#333333",
        layout: "centered",
        imageUrl: "https://example.com/image.jpg",
        ctaText: "Learn More",
        ctaLink: "/learn-more",
        isVisible: 1,
        scheduledStatus: "draft",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Section");
      expect(result.content).toContain("rich text");
      testSectionId = result.id;
    });

    it("should reject non-admin users from creating sections", async () => {
      const caller = appRouter.createCaller(mockUserContext);
      await expect(
        caller.homeSections.create({
          title: "Unauthorized Section",
          content: "<p>Should fail</p>",
          order: 2,
          scheduledStatus: "draft",
        })
      ).rejects.toThrow();
    });

    it("should reject guests from creating sections", async () => {
      const caller = appRouter.createCaller(mockGuestContext);
      await expect(
        caller.homeSections.create({
          title: "Guest Section",
          content: "<p>Should fail</p>",
          order: 3,
          scheduledStatus: "draft",
        })
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should allow admin to list all sections", async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.homeSections.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const testSection = result.find((s) => s.id === testSectionId);
      expect(testSection).toBeDefined();
      expect(testSection?.title).toBe("Test Section");
    });

    it("should reject non-admin users from listing all sections", async () => {
      const caller = appRouter.createCaller(mockUserContext);
      await expect(caller.homeSections.list()).rejects.toThrow();
    });
  });

  describe("listPublished", () => {
    it("should allow anyone to list published sections", async () => {
      // First, publish the test section
      const adminCaller = appRouter.createCaller(mockAdminContext);
      await adminCaller.homeSections.update({
        id: testSectionId,
        isVisible: 1,
        scheduledStatus: "published",
      });

      // Now test with guest
      const guestCaller = appRouter.createCaller(mockGuestContext);
      const result = await guestCaller.homeSections.listPublished();

      expect(Array.isArray(result)).toBe(true);
      // Should only include published sections
      result.forEach((section) => {
        expect(section.isVisible).toBe(1);
        expect(section.scheduledStatus).toBe("published");
      });
    });
  });

  describe("update", () => {
    it("should allow admin to update a section", async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.homeSections.update({
        id: testSectionId,
        title: "Updated Test Section",
        content: "<p>Updated content</p>",
      });

      expect(result.title).toBe("Updated Test Section");
      expect(result.content).toBe("<p>Updated content</p>");
    });

    it("should reject non-admin users from updating sections", async () => {
      const caller = appRouter.createCaller(mockUserContext);
      await expect(
        caller.homeSections.update({
          id: testSectionId,
          title: "Unauthorized Update",
        })
      ).rejects.toThrow();
    });
  });

  describe("toggleVisibility", () => {
    it("should allow admin to toggle section visibility", async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      
      // Toggle to inactive
      await caller.homeSections.toggleVisibility({ id: testSectionId });
      let section = await caller.homeSections.getById({ id: testSectionId });
      expect(section.isVisible).toBe(0);

      // Toggle back to active
      await caller.homeSections.toggleVisibility({ id: testSectionId });
      section = await caller.homeSections.getById({ id: testSectionId });
      expect(section.isVisible).toBe(1);
    });
  });

  describe("reorder", () => {
    it("should allow admin to reorder sections", async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      
      // Create another section for reordering test
      const section2 = await caller.homeSections.create({
        title: "Test Section 2",
        content: "<p>Second section</p>",
        order: 2,
        scheduledStatus: "draft",
      });

      // Reorder
      await caller.homeSections.reorder({
        sectionIds: [section2.id, testSectionId],
      });

      // Verify order
      const sections = await caller.homeSections.list();
      const reorderedSection1 = sections.find((s) => s.id === section2.id);
      const reorderedSection2 = sections.find((s) => s.id === testSectionId);

      expect(reorderedSection1?.order).toBe(0);
      expect(reorderedSection2?.order).toBe(1);

      // Clean up
      await caller.homeSections.delete({ id: section2.id });
    });
  });

  describe("delete", () => {
    it("should allow admin to delete a section", async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      
      // Create a section to delete
      const sectionToDelete = await caller.homeSections.create({
        title: "Section to Delete",
        content: "<p>Will be deleted</p>",
        order: 99,
        scheduledStatus: "draft",
      });

      // Delete it
      await caller.homeSections.delete({ id: sectionToDelete.id });

      // Verify it's deleted
      await expect(
        caller.homeSections.getById({ id: sectionToDelete.id })
      ).rejects.toThrow();
    });

    it("should reject non-admin users from deleting sections", async () => {
      const caller = appRouter.createCaller(mockUserContext);
      await expect(
        caller.homeSections.delete({ id: testSectionId })
      ).rejects.toThrow();
    });
  });
});
