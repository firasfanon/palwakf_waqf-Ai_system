import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Content Templates - Clone Feature", () => {
  let adminContext: any;
  let testTemplateId: number;

  beforeAll(async () => {
    // Create admin context
    adminContext = {
      user: {
        id: 1,
        openId: "test-admin",
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    // Create a test template to clone
    const createCaller = appRouter.createCaller(adminContext);
    const template = await createCaller.contentTemplates.create({
      name: "Test Template",
      nameAr: "قالب اختبار",
      description: "Test description",
      descriptionAr: "وصف اختبار",
      type: "landing",
      sections: JSON.stringify(["hero", "features", "cta"]),
      layout: "full-width",
      colorScheme: "#3B82F6",
      thumbnail: "https://example.com/thumb.jpg",
      config: JSON.stringify({ theme: "modern" }),
    });

    testTemplateId = template.id!;
  });

  it("should clone a template successfully", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Clone the template
    const cloned = await caller.contentTemplates.clone({ id: testTemplateId });

    // Verify cloned template
    expect(cloned).toBeDefined();
    expect(cloned.id).not.toBe(testTemplateId);
    expect(cloned.name).toBe("Test Template - نسخة");
    expect(cloned.nameAr).toBe("قالب اختبار - نسخة");
    expect(cloned.description).toBe("Test description");
    expect(cloned.descriptionAr).toBe("وصف اختبار");
    expect(cloned.type).toBe("landing");
    expect(cloned.sections).toBe(JSON.stringify(["hero", "features", "cta"]));
    expect(cloned.layout).toBe("full-width");
    expect(cloned.colorScheme).toBe("#3B82F6");
    expect(cloned.thumbnail).toBe("https://example.com/thumb.jpg");
    expect(cloned.config).toBe(JSON.stringify({ theme: "modern" }));
    expect(cloned.createdBy).toBe(1);
  });

  it("should fail to clone non-existent template", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Try to clone non-existent template
    await expect(
      caller.contentTemplates.clone({ id: 99999 })
    ).rejects.toThrow("القالب غير موجود");
  });

  it("should fail to clone without admin role", async () => {
    const userContext = {
      user: {
        id: 2,
        openId: "test-user",
        name: "Test User",
        email: "user@test.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const caller = appRouter.createCaller(userContext);

    // Try to clone as non-admin
    await expect(
      caller.contentTemplates.clone({ id: testTemplateId })
    ).rejects.toThrow();
  });

  it("should list all templates including cloned ones", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Clone another template
    await caller.contentTemplates.clone({ id: testTemplateId });

    // List all templates
    const templates = await caller.contentTemplates.list();

    // Should have at least 12 templates (10 default + 1 test + 2 clones)
    expect(templates.length).toBeGreaterThanOrEqual(12);

    // Find cloned templates
    const clonedTemplates = templates.filter((t) =>
      t.name.includes("- نسخة")
    );
    expect(clonedTemplates.length).toBeGreaterThanOrEqual(2);
  });
});
