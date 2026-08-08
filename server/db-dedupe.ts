import crypto from "crypto";
import { getDb } from "./db";
import { fetchedContent, type FetchedContent } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Normalize URL for deduplication
 * - trim
 * - lowercase host
 * - remove trailing slash
 * - remove hash fragment
 */
export function normalizeUrl(url: string): string {
  try {
    const trimmed = url.trim();
    const urlObj = new URL(trimmed);
    
    // lowercase host
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    // remove hash
    urlObj.hash = "";
    
    // get normalized URL
    let normalized = urlObj.toString();
    
    // remove trailing slash from pathname
    if (normalized.endsWith("/") && urlObj.pathname === "/") {
      // keep it for root
    } else if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  } catch {
    // fallback: just trim and lowercase
    return url.trim().toLowerCase();
  }
}

/**
 * Generate SHA-256 hash of content
 */
export function generateContentHash(title: string, content: string): string {
  const combined = `${title}\n${content}`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Generate version group ID (hash of canonical URL)
 */
export function generateVersionGroup(canonicalUrl: string): string {
  return crypto.createHash("sha1").update(canonicalUrl).digest("hex").substring(0, 64);
}

/**
 * Check if content already exists (dedupe)
 */
export async function checkDuplicate(
  canonicalUrl: string,
  contentHash: string
): Promise<{ isDuplicate: boolean; existingId?: number }> {
  const db = await getDb();
  if (!db) return { isDuplicate: false };

  const existing = await db
    .select({ id: fetchedContent.id })
    .from(fetchedContent)
    .where(
      and(
        eq(fetchedContent.canonicalUrl, canonicalUrl),
        eq(fetchedContent.contentHash, contentHash)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { isDuplicate: true, existingId: existing[0].id };
  }

  return { isDuplicate: false };
}

/**
 * Get latest version for URL
 */
export async function getLatestVersion(
  canonicalUrl: string
): Promise<{ versionNo: number; versionGroup: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const latest = await db
    .select({
      versionNo: fetchedContent.versionNo,
      versionGroup: fetchedContent.versionGroup,
    })
    .from(fetchedContent)
    .where(eq(fetchedContent.canonicalUrl, canonicalUrl))
    .orderBy(fetchedContent.versionNo)
    .limit(1);

  if (latest.length > 0) {
    return {
      versionNo: latest[0].versionNo || 1,
      versionGroup: latest[0].versionGroup || "",
    };
  }

  return null;
}

/**
 * Create fetched content with dedupe + versioning
 */
export interface CreateFetchedContentWithDedupeInput {
  sourceId: number;
  title: string;
  content: string;
  author?: string | null;
  url?: string | null;
  pdfUrl?: string;
  category?: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  tags?: string;
  relevanceScore?: number;
}

export interface CreateFetchedContentResult {
  id: number;
  status: "inserted" | "deduped" | "versioned";
  versionNo: number;
  isDuplicate: boolean;
}

export async function createFetchedContentWithDedupe(
  input: CreateFetchedContentWithDedupeInput
): Promise<CreateFetchedContentResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalize URL and generate hashes
  const canonicalUrl = input.url ? normalizeUrl(input.url) : "";
  const contentHash = generateContentHash(input.title, input.content);
  const versionGroup = canonicalUrl ? generateVersionGroup(canonicalUrl) : generateVersionGroup(input.title);

  // Check for duplicate
  const dupCheck = await checkDuplicate(canonicalUrl, contentHash);
  if (dupCheck.isDuplicate && dupCheck.existingId) {
    return {
      id: dupCheck.existingId,
      status: "deduped",
      versionNo: 1,
      isDuplicate: true,
    };
  }

  // Get latest version
  let versionNo = 1;
  const latestVersion = await getLatestVersion(canonicalUrl);
  if (latestVersion) {
    versionNo = (latestVersion.versionNo || 1) + 1;
  }

  // Insert new content
  const [result] = await db.insert(fetchedContent).values({
    sourceId: input.sourceId,
    title: input.title,
    content: input.content,
    author: input.author,
    url: input.url,
    pdfUrl: input.pdfUrl,
    category: input.category as any,
    tags: input.tags,
    relevanceScore: input.relevanceScore,
    status: "pending",
    contentHash,
    canonicalUrl,
    versionGroup,
    versionNo,
    isDuplicate: 0,
  });

  const status = versionNo > 1 ? "versioned" : "inserted";

  return {
    id: result.insertId,
    status,
    versionNo,
    isDuplicate: false,
  };
}
