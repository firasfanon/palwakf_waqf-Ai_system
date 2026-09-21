import { createHash } from "node:crypto";

export type ArtifactVersionRelationship =
  | "initial"
  | "identical_retrieval"
  | "new_version";

export type PreservationEventType =
  | "retrieved"
  | "hashed"
  | "preserved"
  | "fixity_verified"
  | "version_detected"
  | "restore_verified";

export type PreservationEvent = {
  type: PreservationEventType;
  at: string;
  artifactId: string;
  versionId: string;
  detail?: Record<string, unknown>;
};

export type ArtifactVersionManifest = {
  artifactId: string;
  versionId: string;
  collectionId: string;
  canonicalSourceUrl: string;
  retrievedAt: string;
  contentType: string;
  byteSize: number;
  sha256: string;
  storageKey: string;
  previousVersionId: string | null;
  relationship: ArtifactVersionRelationship;
  immutable: true;
  metadata: Record<string, unknown>;
};

export type PreserveArtifactInput = {
  collectionId: string;
  sourceUrl: string;
  retrievedAt: string;
  contentType: string;
  bytes: Buffer;
  metadata?: Record<string, unknown>;
  previous?: ArtifactVersionManifest | null;
};

export interface SovereignArchiveStore {
  putImmutable(
    key: string,
    bytes: Buffer
  ): Promise<"created" | "already_present">;
  get(key: string): Promise<Buffer | null>;
  has(key: string): Promise<boolean>;
}

function safeSegment(value: string): string {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

export function sha256Bytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalizeSourceUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(
      "Only HTTP(S) source URLs can be preserved as web provenance."
    );
  }
  if (url.username || url.password)
    throw new Error("Credential-bearing source URLs are forbidden.");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_)/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  const path = url.pathname.replace(/\/{2,}/g, "/") || "/";
  const query = url.searchParams.toString();
  return `${url.protocol}//${url.host}${path}${query ? `?${query}` : ""}`;
}

export function buildArtifactId(
  collectionId: string,
  sourceUrl: string
): string {
  const canonical = canonicalizeSourceUrl(sourceUrl);
  const identityHash = createHash("sha256")
    .update(`${collectionId}\n${canonical}`)
    .digest("hex")
    .slice(0, 32);
  return `artifact-${identityHash}`;
}

export function buildStorageKey(
  collectionId: string,
  artifactId: string,
  sha256: string
): string {
  return `${safeSegment(collectionId)}/objects/${safeSegment(artifactId)}/sha256-${sha256}`;
}

export function createArtifactVersionManifest(
  input: PreserveArtifactInput
): ArtifactVersionManifest {
  const canonicalSourceUrl = canonicalizeSourceUrl(input.sourceUrl);
  const artifactId = buildArtifactId(input.collectionId, canonicalSourceUrl);
  const sha256 = sha256Bytes(input.bytes);
  const previous = input.previous ?? null;
  const identical = previous?.sha256 === sha256;
  const versionId =
    identical && previous
      ? previous.versionId
      : `version-${sha256.slice(0, 32)}`;
  return {
    artifactId,
    versionId,
    collectionId: input.collectionId,
    canonicalSourceUrl,
    retrievedAt: input.retrievedAt,
    contentType: input.contentType || "application/octet-stream",
    byteSize: input.bytes.byteLength,
    sha256,
    storageKey: buildStorageKey(input.collectionId, artifactId, sha256),
    previousVersionId: previous?.versionId ?? null,
    relationship: previous
      ? identical
        ? "identical_retrieval"
        : "new_version"
      : "initial",
    immutable: true,
    metadata: { ...(input.metadata || {}) },
  };
}

export class InMemorySovereignArchiveStore implements SovereignArchiveStore {
  private readonly objects = new Map<string, Buffer>();

  async putImmutable(
    key: string,
    bytes: Buffer
  ): Promise<"created" | "already_present"> {
    const existing = this.objects.get(key);
    if (existing) {
      if (!existing.equals(bytes)) {
        throw new Error(`Immutable archive key collision: ${key}`);
      }
      return "already_present";
    }
    this.objects.set(key, Buffer.from(bytes));
    return "created";
  }

  async get(key: string): Promise<Buffer | null> {
    const value = this.objects.get(key);
    return value ? Buffer.from(value) : null;
  }

  async has(key: string): Promise<boolean> {
    return this.objects.has(key);
  }
}

export async function verifyArtifactFixity(
  store: SovereignArchiveStore,
  manifest: ArtifactVersionManifest
): Promise<boolean> {
  const bytes = await store.get(manifest.storageKey);
  return Boolean(bytes && sha256Bytes(bytes) === manifest.sha256);
}

export class SovereignReferenceArchiveCoordinator {
  constructor(private readonly store: SovereignArchiveStore) {}

  async preserve(input: PreserveArtifactInput): Promise<{
    manifest: ArtifactVersionManifest;
    events: PreservationEvent[];
    stored: "created" | "already_present";
  }> {
    const manifest = createArtifactVersionManifest(input);
    const events: PreservationEvent[] = [
      {
        type: "retrieved",
        at: input.retrievedAt,
        artifactId: manifest.artifactId,
        versionId: manifest.versionId,
        detail: { sourceUrl: manifest.canonicalSourceUrl },
      },
      {
        type: "hashed",
        at: input.retrievedAt,
        artifactId: manifest.artifactId,
        versionId: manifest.versionId,
        detail: { sha256: manifest.sha256, byteSize: manifest.byteSize },
      },
    ];
    if (manifest.relationship !== "initial") {
      events.push({
        type: "version_detected",
        at: input.retrievedAt,
        artifactId: manifest.artifactId,
        versionId: manifest.versionId,
        detail: {
          relationship: manifest.relationship,
          previousVersionId: manifest.previousVersionId,
        },
      });
    }
    const stored = await this.store.putImmutable(
      manifest.storageKey,
      input.bytes
    );
    events.push({
      type: "preserved",
      at: input.retrievedAt,
      artifactId: manifest.artifactId,
      versionId: manifest.versionId,
      detail: { storageKey: manifest.storageKey, stored },
    });
    if (!(await verifyArtifactFixity(this.store, manifest))) {
      throw new Error(
        "Archive fixity verification failed immediately after preservation."
      );
    }
    events.push({
      type: "fixity_verified",
      at: input.retrievedAt,
      artifactId: manifest.artifactId,
      versionId: manifest.versionId,
      detail: { sha256: manifest.sha256 },
    });
    return { manifest, events, stored };
  }
}

export function serializeWarcResponseRecord(input: {
  targetUrl: string;
  retrievedAt: string;
  body: Buffer;
  httpStatusLine?: string;
  httpHeaders?: Record<string, string>;
  recordId?: string;
}): Buffer {
  const target = canonicalizeSourceUrl(input.targetUrl);
  const httpHeaders = Object.entries(input.httpHeaders || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\r\n");
  const httpPayload = Buffer.concat([
    Buffer.from(
      `${input.httpStatusLine || "HTTP/1.1 200 OK"}\r\n${httpHeaders}${httpHeaders ? "\r\n" : ""}\r\n`,
      "utf8"
    ),
    input.body,
  ]);
  const recordId =
    input.recordId ||
    `<urn:uuid:${createHash("sha256")
      .update(target + input.retrievedAt)
      .digest("hex")
      .slice(0, 32)}>`;
  const warcHeaders = [
    "WARC/1.1",
    "WARC-Type: response",
    `WARC-Target-URI: ${target}`,
    `WARC-Date: ${input.retrievedAt}`,
    `WARC-Record-ID: ${recordId}`,
    "Content-Type: application/http; msgtype=response",
    `Content-Length: ${httpPayload.byteLength}`,
    "",
    "",
  ].join("\r\n");
  return Buffer.concat([
    Buffer.from(warcHeaders, "utf8"),
    httpPayload,
    Buffer.from("\r\n\r\n", "utf8"),
  ]);
}
