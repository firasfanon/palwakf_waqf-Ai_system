import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReferenceCorpusItem } from "./referenceCorpus";
import { routeReferenceIssue } from "./referenceIssueRouter";
import {
  hybridReferenceSearch,
  selectReferenceEvidencePack,
  type ReferenceRetrievalDocument,
} from "./referenceRetrieval";
import {
  sha256Bytes,
  type ArtifactVersionManifest,
  type SovereignArchiveStore,
} from "./sovereignReferenceArchive";

export type OfflinePreservedReference = {
  item: ReferenceCorpusItem;
  manifest: ArtifactVersionManifest;
};

export type OfflineRehydratedReference = {
  document: ReferenceRetrievalDocument;
  fixityVerified: true;
  storageKey: string;
  byteSize: number;
  extractedTextCacheHit: boolean;
};

export type ExtractedTextCache = {
  get(artifactSha256: string): Promise<string | null>;
  put(artifactSha256: string, text: string): Promise<void>;
};

export class FileSystemExtractedTextCache implements ExtractedTextCache {
  constructor(private readonly root: string) {}

  private pathFor(artifactSha256: string) {
    if (!/^[a-f0-9]{64}$/i.test(artifactSha256))
      throw new Error("invalid_artifact_sha256_for_text_cache");
    return join(this.root, artifactSha256.toLowerCase() + ".txt");
  }

  async get(artifactSha256: string): Promise<string | null> {
    try {
      return await readFile(this.pathFor(artifactSha256), "utf8");
    } catch (error: any) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  async put(artifactSha256: string, text: string): Promise<void> {
    const path = this.pathFor(artifactSha256);
    await mkdir(this.root, { recursive: true });
    try {
      await writeFile(path, text, { encoding: "utf8", flag: "wx" });
    } catch (error: any) {
      if (error?.code !== "EEXIST") throw error;
      const current = await readFile(path, "utf8");
      if (current !== text) throw new Error("extracted_text_cache_collision");
    }
  }
}

export type OfflineTextExtractor = (input: {
  bytes: Buffer;
  contentType: string;
  item: ReferenceCorpusItem;
}) => Promise<string>;

export async function rehydrateReferenceFromPreservedArtifact(input: {
  preserved: OfflinePreservedReference;
  store: SovereignArchiveStore;
  extractText: OfflineTextExtractor;
  extractedTextCache?: ExtractedTextCache;
}): Promise<OfflineRehydratedReference> {
  const bytes = await input.store.get(input.preserved.manifest.storageKey);
  if (!bytes) throw new Error("preserved_artifact_missing");
  if (sha256Bytes(bytes) !== input.preserved.manifest.sha256) {
    throw new Error("preserved_artifact_fixity_mismatch");
  }

  let extractedTextCacheHit = false;
  let content = input.extractedTextCache
    ? await input.extractedTextCache.get(input.preserved.manifest.sha256)
    : null;
  if (content !== null) {
    extractedTextCacheHit = true;
  } else {
    content = await input.extractText({
      bytes,
      contentType: input.preserved.manifest.contentType,
      item: input.preserved.item,
    });
    if (input.extractedTextCache && content.trim()) {
      await input.extractedTextCache.put(
        input.preserved.manifest.sha256,
        content
      );
    }
  }
  if (!content.trim()) throw new Error("preserved_artifact_text_empty");

  return {
    document: {
      documentId: input.preserved.item.corpusId,
      title: input.preserved.item.title,
      content,
      domain: input.preserved.item.domain,
      era: input.preserved.item.era,
      territories: input.preserved.item.territories,
      authorityClass: input.preserved.item.authorityClass,
      sourceUrl: input.preserved.manifest.canonicalSourceUrl,
      publisher: input.preserved.item.publisher,
      legalStatusVerified: input.preserved.item.statusAssertions.some(
        status => status.verified
      ),
      artifactVersionId: input.preserved.manifest.versionId,
      artifactSha256: input.preserved.manifest.sha256,
      locator: null,
      semanticScore: 0,
      graphScore: input.preserved.item.statusAssertions.length ? 0.3 : 0,
    },
    fixityVerified: true,
    storageKey: input.preserved.manifest.storageKey,
    byteSize: bytes.byteLength,
    extractedTextCacheHit,
  };
}

export async function replayReferenceQuestionOffline(input: {
  question: string;
  preserved: OfflinePreservedReference[];
  store: SovereignArchiveStore;
  extractText: OfflineTextExtractor;
  extractedTextCache?: ExtractedTextCache;
  limit?: number;
}): Promise<{
  question: string;
  networkCalls: 0;
  allFixityVerified: boolean;
  rehydratedCount: number;
  topDocumentIds: string[];
  conclusionEligible: boolean;
  disposition:
    | "OFFLINE_REPLAY_PASS"
    | "OFFLINE_REPLAY_FAIL_CLOSED_NO_DOMAIN_EVIDENCE"
    | "OFFLINE_REPLAY_PASS_STATUS_GATE_CLOSED";
}> {
  const rehydrated = await Promise.all(
    input.preserved.map(preserved =>
      rehydrateReferenceFromPreservedArtifact({
        preserved,
        store: input.store,
        extractText: input.extractText,
        extractedTextCache: input.extractedTextCache,
      })
    )
  );
  const route = routeReferenceIssue(input.question);
  const hits = hybridReferenceSearch({
    query: input.question,
    route,
    documents: rehydrated.map(row => row.document),
    limit: input.limit || 8,
  });
  const pack = selectReferenceEvidencePack(hits, 4, [
    ...route.priorityDomains,
    ...route.preferredDomains,
  ]);
  const conclusionEligible = pack.some(hit => hit.usableForConclusion);
  return {
    question: input.question,
    networkCalls: 0,
    allFixityVerified: rehydrated.every(row => row.fixityVerified),
    rehydratedCount: rehydrated.length,
    topDocumentIds: pack.map(hit => hit.documentId),
    conclusionEligible,
    disposition:
      pack.length === 0
        ? "OFFLINE_REPLAY_FAIL_CLOSED_NO_DOMAIN_EVIDENCE"
        : conclusionEligible
          ? "OFFLINE_REPLAY_PASS"
          : "OFFLINE_REPLAY_PASS_STATUS_GATE_CLOSED",
  };
}
