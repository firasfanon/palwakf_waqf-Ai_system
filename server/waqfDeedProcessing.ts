import { createHash } from "node:crypto";

export type DeedPageInput = {
  pageNumber: number;
  imageArtifactVersionId: string;
};

export type DeedPageTranscription = {
  pageNumber: number;
  text: string;
  confidence: number;
  method: "OCR" | "HTR" | "HUMAN_TRANSCRIPTION" | "HYBRID";
  modelOrReviewerRef: string;
  uncertainSegments: Array<{
    text: string;
    locator: string;
    confidence: number;
    alternatives: string[];
  }>;
};

export interface DeedTranscriptionProvider {
  transcribe(page: DeedPageInput): Promise<DeedPageTranscription>;
}

export type AlignedDeedTranscription = {
  transcriptionId: string;
  artifactVersionId: string;
  pages: DeedPageTranscription[];
  fullText: string;
  meanConfidence: number;
  minimumConfidence: number;
  requiresHumanReview: boolean;
  uncertainSegmentCount: number;
};

function stableId(parts: string[]): string {
  return createHash("sha256")
    .update(parts.join("\n"))
    .digest("hex")
    .slice(0, 32);
}

function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export async function transcribeWaqfDeed(input: {
  artifactVersionId: string;
  pages: DeedPageInput[];
  provider: DeedTranscriptionProvider;
  humanReviewThreshold?: number;
}): Promise<AlignedDeedTranscription> {
  if (!input.artifactVersionId.trim())
    throw new Error("artifact_version_required");
  if (!input.pages.length) throw new Error("deed_pages_required");
  const pageNumbers = input.pages.map(page => page.pageNumber);
  if (new Set(pageNumbers).size !== pageNumbers.length)
    throw new Error("duplicate_page_number");

  const ordered = [...input.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const pages: DeedPageTranscription[] = [];
  for (const page of ordered) {
    const result = await input.provider.transcribe(page);
    if (result.pageNumber !== page.pageNumber)
      throw new Error("transcription_page_mismatch");
    pages.push({
      ...result,
      confidence: normalizeConfidence(result.confidence),
      uncertainSegments: result.uncertainSegments.map(segment => ({
        ...segment,
        confidence: normalizeConfidence(segment.confidence),
      })),
    });
  }

  const confidences = pages.map(page => page.confidence);
  const meanConfidence =
    confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
  const minimumConfidence = Math.min(...confidences);
  const uncertainSegmentCount = pages.reduce(
    (sum, page) => sum + page.uncertainSegments.length,
    0
  );
  const threshold = input.humanReviewThreshold ?? 0.9;
  const fullText = pages
    .map(page => `[PAGE ${page.pageNumber}]\n${page.text.trim()}`)
    .join("\n\n");

  return {
    transcriptionId: `transcription-${stableId([input.artifactVersionId, ...pages.map(page => String(page.pageNumber)), fullText])}`,
    artifactVersionId: input.artifactVersionId,
    pages,
    fullText,
    meanConfidence,
    minimumConfidence,
    requiresHumanReview:
      minimumConfidence < threshold ||
      uncertainSegmentCount > 0 ||
      pages.some(
        page => page.method !== "HUMAN_TRANSCRIPTION" && page.confidence < 0.98
      ),
    uncertainSegmentCount,
  };
}

export type DeedRelationType =
  | "TAWLIYA"
  | "HUKR"
  | "ISTIBDAL"
  | "LEASE"
  | "AMENDMENT"
  | "ACCOUNTING"
  | "CONFIRMATION"
  | "OTHER";

export type WaqfDeedRelation = {
  sourceDeedId: string;
  targetDeedId: string;
  relationType: DeedRelationType;
  effectiveDate: string | null;
  evidenceArtifactVersionId: string;
  verified: boolean;
  confidence: number;
};

export function validateDeedRelation(relation: WaqfDeedRelation): string[] {
  const errors: string[] = [];
  if (!relation.sourceDeedId.trim() || !relation.targetDeedId.trim())
    errors.push("deed_relation_endpoint_required");
  if (relation.sourceDeedId === relation.targetDeedId)
    errors.push("self_deed_relation_forbidden");
  if (!relation.evidenceArtifactVersionId.trim())
    errors.push("deed_relation_evidence_required");
  if (relation.confidence < 0 || relation.confidence > 1)
    errors.push("deed_relation_confidence_out_of_range");
  return errors;
}
