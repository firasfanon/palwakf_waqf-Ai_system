import { createHash } from "crypto";

/**
 * Generate SHA-256 hash of text
 */
export function generateChunkHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Split text into chunks with overlap
 * Tries to break at sentence/paragraph boundaries first
 * Falls back to character-based chunking if needed
 */
export function chunkText(
  text: string,
  maxChars: number = 900,
  overlapChars: number = 120
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // If remaining text fits in one chunk, add it and done
    if (remaining.length <= maxChars) {
      chunks.push(remaining.trim());
      break;
    }

    // Try to find a good break point (sentence end or paragraph)
    let breakPoint = maxChars;

    // Look for sentence end (period followed by space) within last 200 chars
    const sentenceMatch = remaining
      .substring(Math.max(0, maxChars - 200), maxChars)
      .match(/\.\s+/);
    if (sentenceMatch) {
      breakPoint =
        Math.max(0, maxChars - 200) +
        sentenceMatch.index! +
        sentenceMatch[0].length;
    }

    // If no sentence break, look for paragraph break (newline)
    if (breakPoint === maxChars) {
      const paragraphMatch = remaining
        .substring(Math.max(0, maxChars - 200), maxChars)
        .match(/\n\n+/);
      if (paragraphMatch) {
        breakPoint =
          Math.max(0, maxChars - 200) +
          paragraphMatch.index! +
          paragraphMatch[0].length;
      }
    }

    // If still no good break, look for line break
    if (breakPoint === maxChars) {
      const lineMatch = remaining
        .substring(Math.max(0, maxChars - 100), maxChars)
        .match(/\n/);
      if (lineMatch) {
        breakPoint =
          Math.max(0, maxChars - 100) + lineMatch.index! + 1;
      }
    }

    // Extract chunk
    const chunk = remaining.substring(0, breakPoint).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move remaining text, accounting for overlap
    const nextStart = Math.max(
      breakPoint - overlapChars,
      breakPoint - 100
    );
    remaining = remaining.substring(nextStart).trim();

    // Prevent infinite loop
    if (nextStart === breakPoint) {
      remaining = remaining.substring(maxChars);
    }
  }

  return chunks.filter((c) => c.length > 0);
}
