import { describe, expect, it } from "vitest";
import {
  InMemorySovereignArchiveStore,
  SovereignReferenceArchiveCoordinator,
  canonicalizeSourceUrl,
  serializeWarcResponseRecord,
  verifyArtifactFixity,
} from "./sovereignReferenceArchive";

describe("sovereign reference archive", () => {
  it("preserves identical bytes idempotently and creates a new version for changed bytes", async () => {
    const store = new InMemorySovereignArchiveStore();
    const archive = new SovereignReferenceArchiveCoordinator(store);
    const first = await archive.preserve({
      collectionId: "official-land-law",
      sourceUrl: "https://example.gov/law.pdf?utm_source=test",
      retrievedAt: "2026-09-21T00:00:00Z",
      contentType: "application/pdf",
      bytes: Buffer.from("version-one"),
    });
    const identical = await archive.preserve({
      collectionId: "official-land-law",
      sourceUrl: "https://example.gov/law.pdf",
      retrievedAt: "2026-09-22T00:00:00Z",
      contentType: "application/pdf",
      bytes: Buffer.from("version-one"),
      previous: first.manifest,
    });
    const changed = await archive.preserve({
      collectionId: "official-land-law",
      sourceUrl: "https://example.gov/law.pdf",
      retrievedAt: "2026-09-23T00:00:00Z",
      contentType: "application/pdf",
      bytes: Buffer.from("version-two"),
      previous: first.manifest,
    });

    expect(identical.manifest.relationship).toBe("identical_retrieval");
    expect(identical.manifest.versionId).toBe(first.manifest.versionId);
    expect(changed.manifest.relationship).toBe("new_version");
    expect(changed.manifest.versionId).not.toBe(first.manifest.versionId);
    expect(await verifyArtifactFixity(store, changed.manifest)).toBe(true);
  });

  it("blocks immutable key collisions with different bytes", async () => {
    const store = new InMemorySovereignArchiveStore();
    await store.putImmutable("fixed-key", Buffer.from("A"));
    await expect(
      store.putImmutable("fixed-key", Buffer.from("B"))
    ).rejects.toThrow("Immutable archive key collision");
  });

  it("canonicalizes tracking URLs without losing source identity", () => {
    expect(
      canonicalizeSourceUrl(
        "HTTPS://Example.GOV/path?utm_source=x&b=2&a=1#part"
      )
    ).toBe("https://example.gov/path?a=1&b=2");
  });

  it("serializes a WARC 1.1 response record containing the captured payload", () => {
    const warc = serializeWarcResponseRecord({
      targetUrl: "https://example.gov/page",
      retrievedAt: "2026-09-21T00:00:00Z",
      body: Buffer.from("<html>waqf</html>"),
      httpHeaders: { "Content-Type": "text/html; charset=utf-8" },
    }).toString("utf8");
    expect(warc).toContain("WARC/1.1");
    expect(warc).toContain("WARC-Target-URI: https://example.gov/page");
    expect(warc).toContain("<html>waqf</html>");
  });
});
