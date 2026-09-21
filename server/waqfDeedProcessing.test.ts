import { describe, expect, it } from "vitest";
import { transcribeWaqfDeed, validateDeedRelation } from "./waqfDeedProcessing";

describe("waqf deed processing", () => {
  it("preserves page alignment and escalates uncertain OCR/HTR segments", async () => {
    const result = await transcribeWaqfDeed({
      artifactVersionId: "version-deed-1",
      pages: [
        { pageNumber: 2, imageArtifactVersionId: "page-2" },
        { pageNumber: 1, imageArtifactVersionId: "page-1" },
      ],
      provider: {
        async transcribe(page) {
          return {
            pageNumber: page.pageNumber,
            text: page.pageNumber === 1 ? "وقف صحيح" : "شرط الواقف",
            confidence: page.pageNumber === 1 ? 0.99 : 0.82,
            method: "HTR",
            modelOrReviewerRef: "test-provider",
            uncertainSegments:
              page.pageNumber === 2
                ? [
                    {
                      text: "لفظ غير واضح",
                      locator: "p2:l3",
                      confidence: 0.5,
                      alternatives: ["بديل"],
                    },
                  ]
                : [],
          };
        },
      },
    });
    expect(result.pages.map(page => page.pageNumber)).toEqual([1, 2]);
    expect(result.fullText).toContain("[PAGE 1]");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.uncertainSegmentCount).toBe(1);
  });

  it("rejects self-relations and requires evidence", () => {
    expect(
      validateDeedRelation({
        sourceDeedId: "d1",
        targetDeedId: "d1",
        relationType: "ISTIBDAL",
        effectiveDate: null,
        evidenceArtifactVersionId: "",
        verified: false,
        confidence: 0.5,
      })
    ).toEqual([
      "self_deed_relation_forbidden",
      "deed_relation_evidence_required",
    ]);
  });
});
