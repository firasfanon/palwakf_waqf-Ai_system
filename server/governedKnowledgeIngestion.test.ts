import { describe, expect, it } from "vitest";
import {
  extractDocumentText,
  matchEntityAliases,
  normalizeEntityAlias,
  structuralChunkDocument,
} from "./governedKnowledgeIngestion";

describe("governed knowledge ingestion", () => {
  it("chunks legal articles structurally instead of blind fixed windows", () => {
    const text = [
      "المادة 2",
      "الأراضي المملوكة هي الأراضي التي يملك أصحابها رقبتها ومنافعها.",
      "",
      "المادة 4",
      "الأراضي الأميرية الموقوفة قد تكون من قبيل تخصيص المنافع.",
    ].join("\n");
    const chunks = structuralChunkDocument(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((chunk) => chunk.sectionType === "article" && chunk.content.includes("المادة 2"))).toBe(true);
    expect(chunks.some((chunk) => chunk.sectionType === "article" && chunk.content.includes("المادة 4"))).toBe(true);
  });

  it("recognizes waqf clauses as structural sections", () => {
    const chunks = structuralChunkDocument(
      "الواقف: فلان بن فلان\nالموقوف: أرض معلومة\nشرط الواقف: يصرف الريع على الفقراء",
    );
    expect(chunks.some((chunk) => chunk.sectionType === "waqf_clause")).toBe(true);
  });

  it("normalizes Arabic aliases and matches the longest entity alias", () => {
    const aliases = [
      { entity_id: "1", alias: "خليل الرحمن", normalized_alias: "خليل الرحمن", is_verified: true },
      { entity_id: "1", alias: "وقف خليل الرحمن", normalized_alias: "وقف خليل الرحمن", is_verified: true },
      { entity_id: "2", alias: "خاصكي سلطان", normalized_alias: "خاصكي سلطان", is_verified: true },
    ];
    const hits = matchEntityAliases("ما حكم وقف خليل الرحمن؟", aliases);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ entityId: "1", alias: "وقف خليل الرحمن", verified: true });
    expect(normalizeEntityAlias("الحَرَم الإبراهيمي")).toBe("الحرم الابراهيمي");
  });

  it("extracts deterministic UTF-8 text payloads", async () => {
    const text = await extractDocumentText({
      buffer: Buffer.from("وقف خليل الرحمن\nالمادة 4", "utf8"),
      mimeType: "text/plain",
      filename: "source.txt",
    });
    expect(text).toContain("وقف خليل الرحمن");
    expect(text).toContain("المادة 4");
  });

  it("extracts text from HTML without retaining markup", async () => {
    const text = await extractDocumentText({
      buffer: Buffer.from("<html><body><h1>وقف خاصكي سلطان</h1><p>نص مرجعي</p></body></html>", "utf8"),
      mimeType: "text/html",
      filename: "source.html",
    });
    expect(text).toContain("وقف خاصكي سلطان");
    expect(text).not.toContain("<h1>");
  });
});
