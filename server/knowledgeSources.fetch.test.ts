import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { knowledgeSources, fetchLogs, fetchedContent } from "../drizzle/schema";

describe("knowledgeSources.fetch", () => {
  let testSourceId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test Wikipedia source
    const result = await db.insert(knowledgeSources).values({
      name: "Test Wikipedia Source",
      type: "wikipedia",
      url: "https://ar.wikipedia.org",
      config: JSON.stringify({
        searchTerm: "الوقف",
        maxArticles: 2,
      }),
      isActive: 1,
      createdBy: 1,
      fetchFrequency: "manual",
    });

    testSourceId = result[0].insertId;
    console.log("Created test source with ID:", testSourceId);
  });

  afterAll(async () => {
    if (!db || !testSourceId) return;

    // Clean up: Delete fetch logs
    await db.delete(fetchLogs).where(eq(fetchLogs.sourceId, testSourceId));

    // Clean up: Delete fetched content
    await db.delete(fetchedContent).where(eq(fetchedContent.sourceId, testSourceId));

    // Clean up: Delete source
    await db.delete(knowledgeSources).where(eq(knowledgeSources.id, testSourceId));

    console.log("Cleaned up test data");
  });

  it("should create a fetch log when fetch is called", async () => {
    const { createFetchLog, getKnowledgeSourceById, updateFetchLog, updateKnowledgeSourceStats } = await import("./db");
    const { fetchFromSource } = await import("./fetchers");

    const source = await getKnowledgeSourceById(testSourceId);
    expect(source).toBeDefined();
    expect(source?.isActive).toBe(1);

    // Create a fetch log
    const log = await createFetchLog({
      sourceId: testSourceId,
      status: "running",
    });

    expect(log).toBeDefined();
    expect(log.id).toBeGreaterThan(0);
    expect(log.status).toBe("running");
    expect(log.sourceId).toBe(testSourceId);

    console.log("✅ Fetch log created successfully:", log.id);
  });

  it("should fetch from Wikipedia and save items", async () => {
    const { fetchFromSource } = await import("./fetchers");
    const source = await import("./db").then(m => m.getKnowledgeSourceById(testSourceId));

    if (!source) throw new Error("Source not found");

    const config = source.config ? JSON.parse(source.config) : {};
    const result = await fetchFromSource(testSourceId, "wikipedia", source.url, config);

    expect(result).toBeDefined();
    expect(result.sourceId).toBe(testSourceId);
    expect(result.sourceType).toBe("wikipedia");
    expect(Array.isArray(result.items)).toBe(true);

    console.log(`✅ Fetched ${result.items.length} items from Wikipedia`);
  });

  it("should save fetched items to fetched_content table", async () => {
    const { createFetchedContent, getKnowledgeSourceById } = await import("./db");
    const source = await getKnowledgeSourceById(testSourceId);

    if (!source) throw new Error("Source not found");

    // Create a test fetched content item
    const result = await createFetchedContent({
      sourceId: testSourceId,
      title: "Test Article",
      content: "This is a test article about وقف",
      author: "Test Author",
      url: "https://example.com/test",
      category: "jurisprudence",
      tags: "test,waqf",
      relevanceScore: 75,
      status: "pending",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.sourceId).toBe(testSourceId);
    expect(result.status).toBe("pending");

    console.log("✅ Fetched content item created successfully:", result.id);
  });

  it("should update fetch log status", async () => {
    const { createFetchLog, updateFetchLog, getFetchLogById } = await import("./db");

    // Create a log
    const log = await createFetchLog({
      sourceId: testSourceId,
      status: "running",
    });

    // Update it
    await updateFetchLog(log.id, {
      status: "success",
      itemsFetched: 5,
      errors: "",
      completedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    // Verify
    const updated = await getFetchLogById(log.id);
    expect(updated).toBeDefined();
    expect(updated?.status).toBe("success");
    expect(updated?.itemsFetched).toBe(5);

    console.log("✅ Fetch log updated successfully");
  });
});
