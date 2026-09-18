import { describe, expect, it } from "vitest";
import { buildEvidenceSnippet, dedupeResearchSources, filterRelevantResearchSources, researchRelevanceScore, type ResearchSourceResult } from "./researchSources";

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
  it("compresses authoritative evidence around query terms", () => {
    const content = "مقدمة ".repeat(500) + "وقف خاصكي سلطان من وقف التخصيصات وفق قانون الأراضي العثماني " + "خاتمة ".repeat(500);
    const snippet = buildEvidenceSnippet("وقف خاصكي سلطان وقف التخصيصات", content, 700);
    expect(snippet.length).toBeLessThanOrEqual(700);
    expect(snippet).toContain("خاصكي سلطان");
    expect(snippet).toContain("وقف التخصيصات");
  });
  it("rejects academically indexed but irrelevant results", () => {
    const relevant = row("https://a.test", "قانون الأراضي العثماني ووقف التخصيصات");
    const irrelevant = row("https://b.test", "المادة السادسة من قانون الإجراءات الجزائية الجزائرية");
    expect(researchRelevanceScore("قانون الأراضي العثماني وقف تخصيصات", relevant)).toBeGreaterThan(researchRelevanceScore("قانون الأراضي العثماني وقف تخصيصات", irrelevant));
    expect(filterRelevantResearchSources("قانون الأراضي العثماني وقف تخصيصات", [irrelevant, relevant])).toEqual([relevant]);
  });
});
