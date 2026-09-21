import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ReferenceCorpusItem } from "./referenceCorpus";
import {
  SovereignReferenceArchiveCoordinator,
  type SovereignArchiveStore,
} from "./sovereignReferenceArchive";
import {
  crawlSourceCollection,
  type CollectionFetchResponse,
  type CollectionFetcher,
} from "./comprehensiveReferenceOrchestrator";
import type { SourceCollectionPolicy } from "./referenceSourceCollections";

export class FileSystemSovereignArchiveStore implements SovereignArchiveStore {
  constructor(private readonly root: string) {}

  private pathFor(key: string) {
    const safe = key
      .split("/")
      .map(part => part.replace(/[^A-Za-z0-9._-]+/g, "-"));
    return join(this.root, ...safe);
  }

  async putImmutable(
    key: string,
    bytes: Buffer
  ): Promise<"created" | "already_present"> {
    const path = this.pathFor(key);
    try {
      const current = await readFile(path);
      if (!current.equals(bytes))
        throw new Error("immutable_archive_key_collision");
      return "already_present";
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, { flag: "wx" });
    return "created";
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.pathFor(key));
    } catch (error: any) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    return Boolean(await this.get(key));
  }
}

export function corpusItemToCollectionPolicy(
  item: ReferenceCorpusItem
): SourceCollectionPolicy {
  const url = new URL(item.sourceUrl);
  return {
    collectionId: "waqf-reference-" + item.corpusId,
    name: item.title,
    seedUrls: [item.sourceUrl],
    allowedHosts: [url.hostname],
    allowSubdomains: false,
    allowedPathPrefixes: [item.acquisition.maxDepth === 0 ? url.pathname : "/"],
    deniedPathPatterns: [/\/login(?:\/|$)/i, /\/admin(?:\/|$)/i],
    artifactExtensions: [".pdf", ".doc", ".docx", ".rtf", ".txt", ".xml"],
    authorityClass: item.authorityClass,
    authorityVerified: item.authorityVerified,
    preserveOriginal: true,
    respectRobotsTxt: item.acquisition.respectRobotsTxt,
    minimumDelayMs: 750,
    maxDepth: item.acquisition.maxDepth,
    maxDocuments: item.acquisition.maxDocuments,
  };
}

export const DEFAULT_NETWORK_TIMEOUT_MS = 8_000;
export const DEFAULT_NETWORK_ATTEMPTS = 2;

export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export function isRetryableNetworkError(error: unknown): boolean {
  const name = String((error as any)?.name || "");
  const code = String(
    (error as any)?.code || (error as any)?.cause?.code || ""
  );
  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    [
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "EAI_AGAIN",
      "ENETUNREACH",
    ].includes(code)
  );
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithResilience(
  url: string,
  options: {
    timeoutMs?: number;
    attempts?: number;
    fetchImpl?: typeof fetch;
    wait?: (ms: number) => Promise<void>;
  } = {}
): Promise<Response> {
  const timeoutMs = Math.max(
    250,
    options.timeoutMs ?? DEFAULT_NETWORK_TIMEOUT_MS
  );
  const attempts = Math.max(
    1,
    Math.min(options.attempts ?? DEFAULT_NETWORK_ATTEMPTS, 5)
  );
  const fetchImpl = options.fetchImpl || fetch;
  const wait = options.wait || sleep;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        headers: {
          "user-agent":
            "PalWakf-Reference-Preservation/1.0 (+governed-research)",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!isRetryableHttpStatus(response.status) || attempt === attempts)
        return response;
      lastError = new Error("retryable_http_status_" + response.status);
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === attempts) throw error;
    }
    await wait(Math.min(4_000, 500 * 2 ** (attempt - 1)));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("network_fetch_failed");
}

export async function defaultCollectionFetcherWithOptions(
  url: string,
  options: { timeoutMs?: number; attempts?: number } = {}
): Promise<CollectionFetchResponse> {
  const response = await fetchWithResilience(url, options);
  const body = Buffer.from(await response.arrayBuffer());
  return {
    url: response.url || url,
    status: response.status,
    contentType:
      response.headers.get("content-type") || "application/octet-stream",
    body,
    retrievedAt: new Date().toISOString(),
    headers: Object.fromEntries(response.headers.entries()),
  };
}

export async function defaultCollectionFetcher(
  url: string
): Promise<CollectionFetchResponse> {
  return defaultCollectionFetcherWithOptions(url);
}

type RobotsRuleSet = {
  disallow: string[];
  allow: string[];
};

function parseRobots(text: string): RobotsRuleSet {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/#.*/, "").trim())
    .filter(Boolean);
  let applies = false;
  const out: RobotsRuleSet = { disallow: [], allow: [] };
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      applies = value === "*";
      continue;
    }
    if (!applies) continue;
    if (key === "disallow" && value) out.disallow.push(value);
    if (key === "allow" && value) out.allow.push(value);
  }
  return out;
}

export async function robotsAllowsUrl(urlValue: string): Promise<boolean> {
  const url = new URL(urlValue);
  const robotsUrl = new URL("/robots.txt", url.origin);
  try {
    const response = await fetchWithResilience(robotsUrl.toString(), {
      timeoutMs: 5_000,
      attempts: 1,
    });
    if (!response.ok) return true;
    const rules = parseRobots(await response.text());
    const path = url.pathname || "/";
    const longestAllow =
      rules.allow
        .filter(rule => path.startsWith(rule))
        .sort((a, b) => b.length - a.length)[0] || "";
    const longestDeny =
      rules.disallow
        .filter(rule => path.startsWith(rule))
        .sort((a, b) => b.length - a.length)[0] || "";
    if (!longestDeny) return true;
    return longestAllow.length >= longestDeny.length;
  } catch {
    return false;
  }
}

export async function acquireCorpusItemPrivate(input: {
  item: ReferenceCorpusItem;
  privateArchiveRoot: string;
  fetcher?: CollectionFetcher;
}) {
  const archive = new SovereignReferenceArchiveCoordinator(
    new FileSystemSovereignArchiveStore(input.privateArchiveRoot)
  );
  return crawlSourceCollection({
    policy: corpusItemToCollectionPolicy(input.item),
    fetcher:
      input.fetcher ||
      (url =>
        defaultCollectionFetcherWithOptions(url, {
          timeoutMs:
            input.item.acquisition.timeoutMs ??
            (input.item.acquisition.kind === "pdf"
              ? 20_000
              : DEFAULT_NETWORK_TIMEOUT_MS),
        })),
    archive,
    robotsAllowed: robotsAllowsUrl,
    wait: sleep,
    assess: async () => ({
      identityVerified: input.item.authorityVerified,
      legalStatus:
        input.item.statusAssertions.find(status => status.verified)?.status ||
        "UNRESOLVED",
      legalStatusVerified: input.item.statusAssertions.some(
        status => status.verified
      ),
      rights: input.item.rights,
      extractionConfidence: 1,
      hasEvidenceConflict: false,
      citationAlignmentVerified: false,
      sensitivePersonalData: false,
    }),
  });
}
