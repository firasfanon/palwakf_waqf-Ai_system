import { describe, expect, it } from "vitest";
import { buildEvidenceSnippet, dedupeResearchSources, filterEntityConsistentResearchSources, filterRelevantResearchSources, matchesNamedEntityIntent, requiredPhraseMatches, researchRelevanceScore, type ResearchSourceResult } from "./researchSources";

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
  it("matches Arabic required phrases across definite-article morphology", () => {
    expect(requiredPhraseMatches("أرض من وقف التخصيصات ضمن حدود البلدية", "وقف تخصيصات")).toBe(true);
    expect(requiredPhraseMatches("بحث عن الأراضي الموقوفة", "الأراضي الموقوفة")).toBe(true);
    expect(requiredPhraseMatches("بحث إداري عام", "وقف تخصيصات")).toBe(false);
  });
  it("rejects academically indexed but irrelevant results", () => {
    const relevant = row("https://a.test", "قانون الأراضي العثماني ووقف التخصيصات");
    const irrelevant = row("https://b.test", "المادة السادسة من قانون الإجراءات الجزائية الجزائرية");
    expect(researchRelevanceScore("قانون الأراضي العثماني وقف تخصيصات", relevant)).toBeGreaterThan(researchRelevanceScore("قانون الأراضي العثماني وقف تخصيصات", irrelevant));
    expect(filterRelevantResearchSources("قانون الأراضي العثماني وقف تخصيصات", [irrelevant, relevant])).toEqual([relevant]);
  });

  it("keeps Khalil al-Rahman entity intent isolated from lexical collisions", () => {
    const khalilIsmail: ResearchSourceResult = {
      id: "wiki:khalil-ismail",
      provider: "Wikipedia",
      kind: "encyclopedic",
      title: "خليل إسماعيل",
      url: "https://example.org/khalil-ismail",
      content: "خليل إسماعيل ممثل كويتي.",
      authority: "discovery",
      reviewed: false,
    };
    const womenWaqf: ResearchSourceResult = {
      id: "wiki:women-waqf",
      provider: "Wikipedia",
      kind: "encyclopedic",
      title: "وقف المرأة",
      url: "https://example.org/women-waqf",
      content: "مقال عام عن مساهمة المرأة في الوقف.",
      authority: "discovery",
      reviewed: false,
    };
    const ibrahimiWaqf: ResearchSourceResult = {
      id: "reference:khalil-al-rahman",
      provider: "Reference",
      kind: "web",
      title: "Haram al-Ibrahimi (Sanctuary of Abraham), Hebron",
      url: "https://example.org/haram-al-ibrahimi",
      content: "The Khalil al-Rahman waqf is connected with the Sanctuary of Abraham in Hebron.",
      authority: "reference",
      reviewed: false,
    };

    const query = "ما هو وقف خليل الرحمن";
    expect(matchesNamedEntityIntent(query, khalilIsmail)).toBe(false);
    expect(matchesNamedEntityIntent(query, womenWaqf)).toBe(false);
    expect(matchesNamedEntityIntent(query, ibrahimiWaqf)).toBe(true);
    expect(
      filterEntityConsistentResearchSources(query, [
        khalilIsmail,
        womenWaqf,
        ibrahimiWaqf,
      ]),
    ).toEqual([ibrahimiWaqf]);
  });
});
