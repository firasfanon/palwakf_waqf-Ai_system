import { load as loadHtml } from "cheerio";
import { canonicalizeSourceUrl } from "./sovereignReferenceArchive";

export type SourceAuthorityClass =
  | "official_primary"
  | "official_derivative"
  | "judicial_primary"
  | "archival_primary"
  | "scholarly_authoritative"
  | "reference_secondary"
  | "discovery_only"
  | "unverified";

export type SourceCollectionPolicy = {
  collectionId: string;
  name: string;
  seedUrls: string[];
  allowedHosts: string[];
  allowSubdomains: boolean;
  allowedPathPrefixes: string[];
  deniedPathPatterns: RegExp[];
  artifactExtensions: string[];
  authorityClass: SourceAuthorityClass;
  authorityVerified: boolean;
  preserveOriginal: boolean;
  respectRobotsTxt: boolean;
  minimumDelayMs: number;
  maxDepth: number;
  maxDocuments: number;
};

export type DiscoveredCollectionLink = {
  url: string;
  kind: "html" | "artifact";
  parentUrl: string;
};

function cleanHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function hostAllowed(policy: SourceCollectionPolicy, host: string): boolean {
  const candidate = cleanHost(host);
  return policy.allowedHosts.some(allowedRaw => {
    const allowed = cleanHost(allowedRaw);
    if (candidate === allowed) return true;
    return policy.allowSubdomains && candidate.endsWith(`.${allowed}`);
  });
}

function pathAllowed(
  policy: SourceCollectionPolicy,
  pathname: string
): boolean {
  if (policy.deniedPathPatterns.some(pattern => pattern.test(pathname)))
    return false;
  if (!policy.allowedPathPrefixes.length) return true;
  return policy.allowedPathPrefixes.some(prefix => pathname.startsWith(prefix));
}

export function isUrlAllowedByCollection(
  policy: SourceCollectionPolicy,
  rawUrl: string
): boolean {
  try {
    const canonical = canonicalizeSourceUrl(rawUrl);
    const url = new URL(canonical);
    return (
      hostAllowed(policy, url.hostname) && pathAllowed(policy, url.pathname)
    );
  } catch {
    return false;
  }
}

function extensionFor(pathname: string): string {
  const last = pathname.split("/").pop() || "";
  const dot = last.lastIndexOf(".");
  return dot >= 0 ? last.slice(dot).toLowerCase() : "";
}

export function discoverCollectionLinks(input: {
  policy: SourceCollectionPolicy;
  html: string;
  parentUrl: string;
}): DiscoveredCollectionLink[] {
  const parent = canonicalizeSourceUrl(input.parentUrl);
  const $ = loadHtml(input.html);
  const byUrl = new Map<string, DiscoveredCollectionLink>();
  $("a[href]").each((_, element) => {
    const href = String($(element).attr("href") || "").trim();
    if (!href || /^(mailto:|tel:|javascript:|data:)/i.test(href)) return;
    let absolute: string;
    try {
      absolute = canonicalizeSourceUrl(new URL(href, parent).toString());
    } catch {
      return;
    }
    if (!isUrlAllowedByCollection(input.policy, absolute)) return;
    const ext = extensionFor(new URL(absolute).pathname);
    const kind = input.policy.artifactExtensions.includes(ext)
      ? "artifact"
      : "html";
    byUrl.set(absolute, { url: absolute, kind, parentUrl: parent });
  });
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

export function authorityRank(value: SourceAuthorityClass): number {
  const rank: Record<SourceAuthorityClass, number> = {
    official_primary: 0,
    judicial_primary: 1,
    archival_primary: 2,
    official_derivative: 3,
    scholarly_authoritative: 4,
    reference_secondary: 5,
    discovery_only: 6,
    unverified: 7,
  };
  return rank[value];
}

export function validateCollectionPolicy(
  policy: SourceCollectionPolicy
): string[] {
  const errors: string[] = [];
  if (!policy.collectionId.trim()) errors.push("collection_id_required");
  if (!policy.name.trim()) errors.push("collection_name_required");
  if (!policy.seedUrls.length) errors.push("seed_url_required");
  if (!policy.allowedHosts.length) errors.push("allowed_host_required");
  if (policy.maxDepth < 0 || policy.maxDepth > 12)
    errors.push("max_depth_out_of_range");
  if (policy.maxDocuments < 1 || policy.maxDocuments > 100_000)
    errors.push("max_documents_out_of_range");
  if (policy.minimumDelayMs < 0) errors.push("minimum_delay_invalid");
  for (const seed of policy.seedUrls) {
    if (!isUrlAllowedByCollection(policy, seed))
      errors.push(`seed_outside_collection:${seed}`);
  }
  return errors;
}

export const PALESTINIAN_LAND_AUTHORITY_LEGISLATION_COLLECTION: SourceCollectionPolicy =
  {
    collectionId: "pla-official-land-legislation",
    name: "Palestinian Land Authority — Legislation and Laws",
    seedUrls: [
      "https://www.pla.pna.ps/ar/Category/20/%D8%A7%D9%84%D8%AA%D8%B4%D8%B1%D9%8A%D8%B9%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86",
    ],
    allowedHosts: ["pla.pna.ps"],
    allowSubdomains: false,
    allowedPathPrefixes: ["/"],
    deniedPathPatterns: [/\/login(?:\/|$)/i, /\/admin(?:\/|$)/i],
    artifactExtensions: [".pdf", ".doc", ".docx", ".rtf", ".txt", ".xml"],
    authorityClass: "official_primary",
    authorityVerified: true,
    preserveOriginal: true,
    respectRobotsTxt: true,
    minimumDelayMs: 750,
    maxDepth: 5,
    maxDocuments: 2_500,
  };
