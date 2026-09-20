import { describe, expect, it } from "vitest";
import { mapGovernedChunkToKnowledgeDocument } from "./governedRuntimeRag";

describe("governed runtime RAG mapping", () => {
  it("maps a verified chunk result into grounded chat context", () => {
    const mapped = mapGovernedChunkToKnowledgeDocument({
      chunkId: "chunk-1",
      knowledgeDocumentId: "knowledge-1",
      referenceDocumentId: "reference-1",
      sourceId: "source-1",
      title: "وقف خليل الرحمن",
      category: "law",
      sectionType: "article",
      heading: "المادة 4",
      locator: "المادة 4",
      content: "وقف خليل الرحمن مثال على وقف التخصيصات.",
      contentHash: "hash",
      sourceName: "سلطة الأراضي الفلسطينية",
      sourceUrl: "https://example.test/source",
      referenceTitle: "معاملة الوقف",
      authorityLevel: "official",
      citation: {
        id: "citation-1",
        locator: "المادة 4",
        excerpt: "وقف خليل الرحمن مثال على وقف التخصيصات.",
        verificationStatus: "verified",
        referenceDocumentId: "reference-1",
      },
      scores: {
        hybrid: 0.92,
        semantic: 0.88,
        lexical: 0.75,
        trigram: 0.6,
        entity: 1,
        authority: 1,
      },
    });
    expect(mapped.runtimeSource).toBe("supabase_governed_chunk_rag");
    expect(mapped.isChatEligible).toBe(true);
    expect(mapped.citations[0].verificationStatus).toBe("verified");
    expect(mapped.relevanceScore).toBe(92);
  });
});
