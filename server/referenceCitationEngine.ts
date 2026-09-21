import { createHash } from "node:crypto";

export type ReferenceLocator =
  | { type: "article"; value: string }
  | { type: "page"; value: string }
  | { type: "clause"; value: string }
  | { type: "paragraph"; value: string }
  | { type: "section"; value: string };

export type ReferenceGradeCitation = {
  citationId: string;
  claimId: string;
  sourceUrl: string;
  sourceTitle: string;
  artifactVersionId: string;
  artifactSha256: string;
  locator: ReferenceLocator;
  excerptHash: string | null;
  alignmentVerified: boolean;
  legalStatusEvidenceRefs: string[];
};

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function buildReferenceGradeCitation(input: {
  claimId: string;
  sourceUrl: string;
  sourceTitle: string;
  artifactVersionId: string;
  artifactSha256: string;
  locator: ReferenceLocator;
  excerpt?: string | null;
  alignmentVerified: boolean;
  legalStatusEvidenceRefs?: string[];
}): ReferenceGradeCitation {
  if (!input.claimId.trim()) throw new Error("claim_id_required");
  if (!input.artifactVersionId.trim())
    throw new Error("artifact_version_required");
  if (!/^[a-f0-9]{64}$/i.test(input.artifactSha256))
    throw new Error("artifact_sha256_required");
  if (!input.locator.value.trim()) throw new Error("citation_locator_required");
  const excerptHash = input.excerpt?.trim()
    ? digest(input.excerpt.trim())
    : null;
  const identity = [
    input.claimId,
    input.artifactVersionId,
    input.artifactSha256.toLowerCase(),
    input.locator.type,
    input.locator.value,
    excerptHash || "",
  ].join("\n");
  return {
    citationId: "refcite-" + digest(identity).slice(0, 24),
    claimId: input.claimId,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    artifactVersionId: input.artifactVersionId,
    artifactSha256: input.artifactSha256.toLowerCase(),
    locator: input.locator,
    excerptHash,
    alignmentVerified: input.alignmentVerified,
    legalStatusEvidenceRefs: [...new Set(input.legalStatusEvidenceRefs || [])],
  };
}

export function auditReferenceGradeCitations(
  citations: ReferenceGradeCitation[]
) {
  const defects: string[] = [];
  const ids = new Set<string>();
  for (const citation of citations) {
    if (ids.has(citation.citationId))
      defects.push("duplicate_citation:" + citation.citationId);
    ids.add(citation.citationId);
    if (!citation.alignmentVerified)
      defects.push("alignment_unverified:" + citation.citationId);
    if (!citation.locator.value.trim())
      defects.push("locator_missing:" + citation.citationId);
    if (!citation.artifactVersionId.trim())
      defects.push("artifact_version_missing:" + citation.citationId);
    if (!/^[a-f0-9]{64}$/i.test(citation.artifactSha256))
      defects.push("artifact_hash_invalid:" + citation.citationId);
  }
  return { valid: defects.length === 0, defects };
}
