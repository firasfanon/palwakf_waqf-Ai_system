import {
  buildArtifactId,
  serializeWarcResponseRecord,
  sha256Bytes,
  SovereignReferenceArchiveCoordinator,
  type ArtifactVersionManifest,
} from "./sovereignReferenceArchive";
import {
  discoverCollectionLinks,
  isUrlAllowedByCollection,
  type SourceCollectionPolicy,
} from "./referenceSourceCollections";
import {
  evaluateReferenceAdmission,
  reviewerRolesForDecision,
  type ReferenceAdmissionDecision,
  type ReferenceAdmissionInput,
  type RightsProfile,
} from "./referenceGovernance";
import {
  buildInitialCheckpoint,
  type CollectionCheckpointStore,
  type CollectionQueueItem,
} from "./collectionCheckpoint";

export type CollectionFetchResponse = {
  url: string;
  status: number;
  contentType: string;
  body: Buffer;
  retrievedAt: string;
  headers?: Record<string, string>;
};

export type CollectionFetcher = (
  url: string
) => Promise<CollectionFetchResponse>;
export type RobotsEvaluator = (url: string) => Promise<boolean>;
export type Waiter = (ms: number) => Promise<void>;

export type ResourceAssessment = {
  identityVerified: boolean;
  legalStatus: ReferenceAdmissionInput["legalStatus"];
  legalStatusVerified: boolean;
  rights: RightsProfile;
  extractionConfidence: number | null;
  hasEvidenceConflict: boolean;
  citationAlignmentVerified: boolean;
  sensitivePersonalData: boolean;
};

export type ResourceAssessmentProvider = (input: {
  url: string;
  contentType: string;
  body: Buffer;
}) => Promise<ResourceAssessment>;

export type CollectionCrawlRecord = {
  url: string;
  depth: number;
  kind: "html" | "artifact";
  httpStatus: number;
  bodySha256: string;
  artifact: ArtifactVersionManifest;
  admission: ReferenceAdmissionDecision;
  reviewerRoles: string[];
};

function isHtml(contentType: string): boolean {
  return /(?:text\/html|application\/xhtml\+xml)/i.test(contentType);
}

async function defaultWait(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function crawlSourceCollection(input: {
  policy: SourceCollectionPolicy;
  fetcher: CollectionFetcher;
  archive: SovereignReferenceArchiveCoordinator;
  assess: ResourceAssessmentProvider;
  robotsAllowed?: RobotsEvaluator;
  wait?: Waiter;
  previousVersions?: Map<string, ArtifactVersionManifest>;
  checkpointStore?: CollectionCheckpointStore;
  runId?: string;
}): Promise<{
  records: CollectionCrawlRecord[];
  skipped: Array<{ url: string; reason: string }>;
  stoppedByLimit: boolean;
}> {
  const policyErrors = input.policy.seedUrls.filter(
    url => !isUrlAllowedByCollection(input.policy, url)
  );
  if (policyErrors.length) {
    throw new Error(
      `Collection has out-of-policy seed URLs: ${policyErrors.join(", ")}`
    );
  }
  if (input.policy.respectRobotsTxt && !input.robotsAllowed) {
    throw new Error("robots_evaluator_required_for_collection");
  }

  const seedQueue: CollectionQueueItem[] = input.policy.seedUrls.map(url => ({
    url,
    depth: 0,
    kind: "html",
  }));
  const restored =
    input.checkpointStore && input.runId
      ? await input.checkpointStore.load(input.runId)
      : null;
  if (restored && restored.collectionId !== input.policy.collectionId) {
    throw new Error("checkpoint_collection_mismatch");
  }
  const checkpoint =
    restored ||
    (input.runId
      ? buildInitialCheckpoint({
          runId: input.runId,
          collectionId: input.policy.collectionId,
          queue: seedQueue,
        })
      : null);
  const queue: CollectionQueueItem[] = checkpoint
    ? [...checkpoint.queue]
    : [...seedQueue];
  const seen = new Set<string>(checkpoint?.seen || []);
  const records: CollectionCrawlRecord[] = [];
  const skipped: Array<{ url: string; reason: string }> = [
    ...(checkpoint?.skipped || []),
  ];
  const wait = input.wait || defaultWait;
  let stoppedByLimit = false;

  while (queue.length) {
    if (records.length >= input.policy.maxDocuments) {
      stoppedByLimit = true;
      break;
    }
    const current = queue.shift()!;
    if (seen.has(current.url)) continue;
    if (!isUrlAllowedByCollection(input.policy, current.url)) {
      skipped.push({ url: current.url, reason: "outside_collection_policy" });
      seen.add(current.url);
      if (checkpoint) {
        checkpoint.queue = [...queue];
        checkpoint.seen = [...seen];
        checkpoint.skipped = [...skipped];
        checkpoint.updatedAt = new Date().toISOString();
        await input.checkpointStore!.save(checkpoint);
      }
      continue;
    }
    if (
      input.policy.respectRobotsTxt &&
      !(await input.robotsAllowed!(current.url))
    ) {
      skipped.push({ url: current.url, reason: "robots_blocked" });
      seen.add(current.url);
      if (checkpoint) {
        checkpoint.queue = [...queue];
        checkpoint.seen = [...seen];
        checkpoint.skipped = [...skipped];
        checkpoint.updatedAt = new Date().toISOString();
        await input.checkpointStore!.save(checkpoint);
      }
      continue;
    }

    if (records.length > 0) await wait(input.policy.minimumDelayMs);
    const response = await input.fetcher(current.url);
    if (response.status < 200 || response.status >= 300) {
      skipped.push({
        url: current.url,
        reason: `http_status_${response.status}`,
      });
      seen.add(current.url);
      if (checkpoint) {
        checkpoint.queue = [...queue];
        checkpoint.seen = [...seen];
        checkpoint.skipped = [...skipped];
        checkpoint.updatedAt = new Date().toISOString();
        await input.checkpointStore!.save(checkpoint);
      }
      continue;
    }

    const html = isHtml(response.contentType);
    const preservedBytes = html
      ? serializeWarcResponseRecord({
          targetUrl: current.url,
          retrievedAt: response.retrievedAt,
          body: response.body,
          httpStatusLine: `HTTP/1.1 ${response.status}`,
          httpHeaders: response.headers,
        })
      : response.body;
    const artifactId = buildArtifactId(input.policy.collectionId, current.url);
    const previous = input.previousVersions?.get(artifactId) || null;
    const preservation = await input.archive.preserve({
      collectionId: input.policy.collectionId,
      sourceUrl: current.url,
      retrievedAt: response.retrievedAt,
      contentType: html ? "application/warc" : response.contentType,
      bytes: preservedBytes,
      previous,
      metadata: {
        source_content_type: response.contentType,
        source_body_sha256: sha256Bytes(response.body),
        http_status: response.status,
        web_capture: html,
      },
    });

    const assessment = await input.assess({
      url: current.url,
      contentType: response.contentType,
      body: response.body,
    });
    const admissionInput: ReferenceAdmissionInput = {
      authorityClass: input.policy.authorityClass,
      authorityVerified: input.policy.authorityVerified,
      ...assessment,
    };
    const admission = evaluateReferenceAdmission(admissionInput);
    seen.add(current.url);
    records.push({
      url: current.url,
      depth: current.depth,
      kind: html ? "html" : "artifact",
      httpStatus: response.status,
      bodySha256: sha256Bytes(response.body),
      artifact: preservation.manifest,
      admission,
      reviewerRoles: reviewerRolesForDecision(admissionInput),
    });
    if (checkpoint) {
      checkpoint.completedUrls = [
        ...new Set([...checkpoint.completedUrls, current.url]),
      ];
      checkpoint.seen = [...seen];
      checkpoint.skipped = [...skipped];
      checkpoint.updatedAt = new Date().toISOString();
      await input.checkpointStore!.save(checkpoint);
    }

    if (html && current.depth < input.policy.maxDepth) {
      const links = discoverCollectionLinks({
        policy: input.policy,
        html: response.body.toString("utf8"),
        parentUrl: current.url,
      });
      for (const link of links) {
        if (seen.has(link.url)) continue;
        queue.push({
          url: link.url,
          depth: current.depth + 1,
          kind: link.kind,
        });
      }
      if (checkpoint) {
        checkpoint.queue = [...queue];
        checkpoint.updatedAt = new Date().toISOString();
        await input.checkpointStore!.save(checkpoint);
      }
    }
  }

  if (checkpoint) {
    checkpoint.queue = [...queue];
    checkpoint.seen = [...seen];
    checkpoint.skipped = [...skipped];
    checkpoint.updatedAt = new Date().toISOString();
    if (!stoppedByLimit && queue.length === 0)
      await input.checkpointStore!.clear(checkpoint.runId);
    else await input.checkpointStore!.save(checkpoint);
  }
  return { records, skipped, stoppedByLimit };
}
