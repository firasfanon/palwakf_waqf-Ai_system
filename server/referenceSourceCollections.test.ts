import { describe, expect, it } from "vitest";
import {
  PALESTINIAN_LAND_AUTHORITY_LEGISLATION_COLLECTION,
  discoverCollectionLinks,
  isUrlAllowedByCollection,
  validateCollectionPolicy,
} from "./referenceSourceCollections";

describe("reference source collections", () => {
  const policy = PALESTINIAN_LAND_AUTHORITY_LEGISLATION_COLLECTION;

  it("accepts the canonical PLA collection policy", () => {
    expect(validateCollectionPolicy(policy)).toEqual([]);
    expect(policy.authorityClass).toBe("official_primary");
    expect(policy.preserveOriginal).toBe(true);
    expect(policy.respectRobotsTxt).toBe(true);
  });

  it("blocks links outside the controlled PLA host", () => {
    expect(
      isUrlAllowedByCollection(policy, "https://pla.pna.ps/ar/Article/1")
    ).toBe(true);
    expect(
      isUrlAllowedByCollection(policy, "https://evil.example/ar/Article/1")
    ).toBe(false);
    expect(
      isUrlAllowedByCollection(policy, "https://fake.pla.pna.ps/ar/Article/1")
    ).toBe(false);
  });

  it("discovers in-policy artifacts and pages but not mailto or off-domain links", () => {
    const html = [
      '<a href="/ar/Article/360?utm_source=test">قانون</a>',
      '<a href="/uploads/land-law.pdf">PDF</a>',
      '<a href="mailto:test@pla.pna.ps">mail</a>',
      '<a href="https://other.example/law.pdf">external</a>',
    ].join("");
    const links = discoverCollectionLinks({
      policy,
      html,
      parentUrl: policy.seedUrls[0],
    });
    expect(links.map(entry => entry.url)).toEqual([
      "https://www.pla.pna.ps/ar/Article/360",
      "https://www.pla.pna.ps/uploads/land-law.pdf",
    ]);
    expect(links.find(entry => entry.url.endsWith(".pdf"))?.kind).toBe(
      "artifact"
    );
  });
});
