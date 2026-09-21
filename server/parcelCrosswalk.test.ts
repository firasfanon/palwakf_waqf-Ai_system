import { describe, expect, it } from "vitest";
import {
  evaluateParcelCrosswalk,
  matchHistoricalPlaceName,
} from "./parcelCrosswalk";

describe("parcel crosswalk", () => {
  it("requires corroborated documentary anchors and never infers ownership", () => {
    const result = evaluateParcelCrosswalk({
      parcelRef: "basin-1/parcel-22",
      candidateName: "بيت لحم",
      evidence: [
        {
          evidenceId: "settlement-1",
          type: "SETTLEMENT_RECORD",
          value: "1/22",
          sourceArtifactVersionId: "v1",
          verified: true,
          weight: 1,
        },
        {
          evidenceId: "map-1",
          type: "SURVEY_MAP",
          value: "1/22",
          sourceArtifactVersionId: "v2",
          verified: true,
          weight: 0.9,
        },
      ],
    });
    expect(result.unresolved).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.ownershipInferenceAllowed).toBe(false);
  });

  it("keeps name-only matches unresolved", () => {
    const result = evaluateParcelCrosswalk({
      parcelRef: "candidate",
      candidateName: "بيت جالا",
      evidence: [
        {
          evidenceId: "name-1",
          type: "HISTORICAL_NAME",
          value: "بيت جالا",
          sourceArtifactVersionId: "v1",
          verified: true,
          weight: 1,
        },
      ],
    });
    expect(result.unresolved).toBe(true);
    expect(result.reasons).toContain("no_title_settlement_or_survey_anchor");
    expect(result.ownershipInferenceAllowed).toBe(false);
    expect(
      matchHistoricalPlaceName("بيت جالا", ["بيت جالا", "بيت لحم"])[0]
        .normalizedMatch
    ).toBe(true);
  });
});
