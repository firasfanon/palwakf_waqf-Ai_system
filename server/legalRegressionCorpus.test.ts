import { describe, expect, it } from "vitest";
import { auditLegalDraftWithSkillRules } from "./legalSkillAdapter";
import { BROADER_LEGAL_REGRESSION_CORPUS } from "./legalRegressionCorpus";

describe("Broader legal regression corpus", () => {
  for (const testCase of BROADER_LEGAL_REGRESSION_CORPUS) {
    it(testCase.id, () => {
      const result = auditLegalDraftWithSkillRules(testCase.draft, testCase.claims, testCase.sources);
      expect(new Set(result.defects)).toEqual(new Set(testCase.expectedDefects));
      expect(result.valid).toBe(testCase.expectedDefects.length === 0);
    });
  }

  it("covers multiple legal families beyond the original Haseki benchmark", () => {
    const families = new Set(BROADER_LEGAL_REGRESSION_CORPUS.map(testCase => testCase.family));
    expect(families.size).toBeGreaterThanOrEqual(6);
    expect(BROADER_LEGAL_REGRESSION_CORPUS.length).toBeGreaterThanOrEqual(10);
  });
});
