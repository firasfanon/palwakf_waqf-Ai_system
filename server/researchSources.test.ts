import { describe, expect, it } from "vitest";
import { dedupeResearchSources, type ResearchSourceResult } from "./researchSources";

const row = (url: string, title = "بحث وقفي", doi?: string): ResearchSourceResult => ({
  id: url, provider: "test", kind: "academic", title, url, content: title,
  doi: doi || null, authority: "scholarly", reviewed: false,
});

describe("research source normalization", () => {
  it("deduplicates identical URLs", () => {
    expect(dedupeResearchSources([row("https://example.org/a"), row("https://example.org/a/")])).toHaveLength(1);
  });
  it("deduplicates DOI identity across providers", () => {
    expect(dedupeResearchSources([row("https://a.test", "A", "10.1/x"), row("https://b.test", "B", "10.1/x")])).toHaveLength(1);
  });
  it("preserves distinct evidence", () => {
    expect(dedupeResearchSources([row("https://a.test"), row("https://b.test")])).toHaveLength(2);
  });
});
