import { describe, expect, it } from "vitest";
import {
  filterEntityConsistentResearchSources,
  matchesNamedEntityIntent,
  type ResearchSourceResult,
} from "./researchSources";

const source = (
  title: string,
  content: string,
  url = "https://example.test/source",
): ResearchSourceResult => ({
  id: title,
  provider: "test",
  kind: "web",
  title,
  url,
  content,
  authority: "discovery",
  reviewed: false,
});

describe("named entity isolation for وقف خليل الرحمن", () => {
  const query = "ما هو وقف خليل الرحمن؟";

  it("rejects a person named Khalil that is unrelated to the waqf entity", () => {
    expect(
      matchesNamedEntityIntent(
        query,
        source(
          "خليل إسماعيل (ممثل كويتي)",
          "خليل إسماعيل ممثل كويتي ولد سنة 1947.",
        ),
      ),
    ).toBe(false);
  });

  it("rejects generic waqf content that does not mention the named entity", () => {
    expect(
      matchesNamedEntityIntent(
        query,
        source(
          "وقف المرأة",
          "مساهمات المرأة في الوقف عبر التاريخ الإسلامي.",
        ),
      ),
    ).toBe(false);
  });

  it("accepts direct Khalil al-Rahman / Ibrahimic sanctuary evidence", () => {
    expect(
      matchesNamedEntityIntent(
        query,
        source(
          "معاملة الوقف - وقف خليل الرحمن",
          "وقف خليل الرحمن مثال على الوقف غير الصحيح.",
        ),
      ),
    ).toBe(true);

    expect(
      matchesNamedEntityIntent(
        query,
        source(
          "Haram al-Ibrahimi (Sanctuary of Abraham), Hebron",
          "Historical description of the sanctuary and associated waqf.",
        ),
      ),
    ).toBe(true);
  });

  it("filters mixed fallback results fail-closed to entity-consistent evidence", () => {
    const rows = [
      source("خليل إسماعيل", "ممثل كويتي"),
      source("وقف المرأة", "مساهمات المرأة في الوقف"),
      source(
        "نقض 950/2016 - وقف خليل الرحمن ووقف التخصيصات",
        "الحكم يتناول وقف خليل الرحمن ووقف التخصيصات.",
      ),
    ];

    expect(
      filterEntityConsistentResearchSources(query, rows).map((row) => row.title),
    ).toEqual(["نقض 950/2016 - وقف خليل الرحمن ووقف التخصيصات"]);
  });
});
