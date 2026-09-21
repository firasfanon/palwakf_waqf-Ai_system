import { describe, expect, it } from "vitest";
import { crawlSourceCollection } from "./comprehensiveReferenceOrchestrator";
import {
  InMemorySovereignArchiveStore,
  SovereignReferenceArchiveCoordinator,
} from "./sovereignReferenceArchive";
import { InMemoryCollectionCheckpointStore } from "./collectionCheckpoint";
import type { SourceCollectionPolicy } from "./referenceSourceCollections";

const policy: SourceCollectionPolicy = {
  collectionId: "test-official",
  name: "Official test",
  seedUrls: ["https://official.example/root"],
  allowedHosts: ["official.example"],
  allowSubdomains: false,
  allowedPathPrefixes: ["/"],
  deniedPathPatterns: [],
  artifactExtensions: [".pdf"],
  authorityClass: "official_primary",
  authorityVerified: true,
  preserveOriginal: true,
  respectRobotsTxt: true,
  minimumDelayMs: 0,
  maxDepth: 2,
  maxDocuments: 10,
};

const safeAssessment = {
  identityVerified: true,
  legalStatus: "IN_FORCE" as const,
  legalStatusVerified: true,
  rights: {
    preserveAllowed: true,
    fullTextRetentionAllowed: true,
    ragAllowed: true,
    publicDisplayAllowed: false,
    downloadAllowed: false,
    quoteAllowed: true,
    reviewStatus: "verified" as const,
  },
  extractionConfidence: 0.99,
  hasEvidenceConflict: false,
  citationAlignmentVerified: true,
  sensitivePersonalData: false,
};

describe("comprehensive reference orchestrator", () => {
  it("preserves bounded official collection content and never fetches off-domain links", async () => {
    const store = new InMemorySovereignArchiveStore();
    const archive = new SovereignReferenceArchiveCoordinator(store);
    const fetched: string[] = [];
    const responses = new Map([
      [
        "https://official.example/root",
        {
          status: 200,
          contentType: "text/html",
          body: Buffer.from(
            '<a href="/law.pdf">law</a><a href="https://outside.example/x.pdf">outside</a>'
          ),
        },
      ],
      [
        "https://official.example/law.pdf",
        {
          status: 200,
          contentType: "application/pdf",
          body: Buffer.from("%PDF-test"),
        },
      ],
    ]);
    const result = await crawlSourceCollection({
      policy,
      archive,
      robotsAllowed: async () => true,
      wait: async () => {},
      assess: async () => safeAssessment,
      fetcher: async url => {
        fetched.push(url);
        const response = responses.get(url);
        if (!response) throw new Error(`unexpected fetch: ${url}`);
        return {
          url,
          retrievedAt: "2026-09-21T00:00:00Z",
          headers: {},
          ...response,
        };
      },
    });

    expect(fetched).toEqual([
      "https://official.example/root",
      "https://official.example/law.pdf",
    ]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].artifact.contentType).toBe("application/warc");
    expect(result.records[1].artifact.contentType).toBe("application/pdf");
    expect(
      result.records.every(record => record.admission.chatEligible === false)
    ).toBe(true);
    expect(
      result.records.every(
        record => record.admission.canonicalReference === false
      )
    ).toBe(true);
  });

  it("requires a robots evaluator when the collection policy requires robots compliance", async () => {
    const store = new InMemorySovereignArchiveStore();
    await expect(
      crawlSourceCollection({
        policy,
        archive: new SovereignReferenceArchiveCoordinator(store),
        assess: async () => safeAssessment,
        fetcher: async () => {
          throw new Error("should not fetch");
        },
      })
    ).rejects.toThrow("robots_evaluator_required_for_collection");
  });

  it("does not fetch a URL that robots policy rejects", async () => {
    const store = new InMemorySovereignArchiveStore();
    let fetchCount = 0;
    const result = await crawlSourceCollection({
      policy,
      archive: new SovereignReferenceArchiveCoordinator(store),
      assess: async () => safeAssessment,
      robotsAllowed: async () => false,
      wait: async () => {},
      fetcher: async () => {
        fetchCount += 1;
        throw new Error("blocked URL was fetched");
      },
    });
    expect(fetchCount).toBe(0);
    expect(result.records).toHaveLength(0);
    expect(result.skipped[0].reason).toBe("robots_blocked");
  });

  it("resumes from a persisted checkpoint without duplicating completed URLs", async () => {
    const store = new InMemorySovereignArchiveStore();
    const checkpointStore = new InMemoryCollectionCheckpointStore();
    const archive = new SovereignReferenceArchiveCoordinator(store);
    let failChild = true;
    const fetcher = async (url: string) => {
      if (url.endsWith("/root")) {
        return {
          url,
          status: 200,
          contentType: "text/html",
          body: Buffer.from('<a href="/law.pdf">law</a>'),
          retrievedAt: "2026-09-21T00:00:00Z",
          headers: {},
        };
      }
      if (failChild) {
        failChild = false;
        throw new Error("simulated network interruption");
      }
      return {
        url,
        status: 200,
        contentType: "application/pdf",
        body: Buffer.from("%PDF-resumed"),
        retrievedAt: "2026-09-21T00:01:00Z",
        headers: {},
      };
    };

    await expect(
      crawlSourceCollection({
        policy,
        archive,
        assess: async () => safeAssessment,
        robotsAllowed: async () => true,
        wait: async () => {},
        checkpointStore,
        runId: "resume-run-1",
        fetcher,
      })
    ).rejects.toThrow("simulated network interruption");

    const saved = await checkpointStore.load("resume-run-1");
    expect(saved?.completedUrls).toContain("https://official.example/root");
    expect(saved?.queue.map(item => item.url)).toContain(
      "https://official.example/law.pdf"
    );

    const resumed = await crawlSourceCollection({
      policy,
      archive,
      assess: async () => safeAssessment,
      robotsAllowed: async () => true,
      wait: async () => {},
      checkpointStore,
      runId: "resume-run-1",
      fetcher,
    });
    expect(resumed.records.map(record => record.url)).toEqual([
      "https://official.example/law.pdf",
    ]);
    expect(await checkpointStore.load("resume-run-1")).toBeNull();
  });
});
