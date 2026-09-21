import type { SourceAuthorityClass } from "./referenceSourceCollections";
import { authorityRank } from "./referenceSourceCollections";
import type { LegalTerritory } from "./legalReferenceModel";
import type {
  ReferenceCorpusDomain,
  ReferenceCorpusEra,
} from "./referenceCorpus";
import type { ReferenceIssueRoute } from "./referenceIssueRouter";

export type ReferenceRetrievalDocument = {
  documentId: string;
  title: string;
  content: string;
  domain: ReferenceCorpusDomain;
  era?: ReferenceCorpusEra | null;
  territories: LegalTerritory[];
  authorityClass: SourceAuthorityClass;
  sourceUrl: string;
  publisher: string;
  legalStatusVerified: boolean;
  artifactVersionId: string;
  artifactSha256: string;
  locator: string | null;
  semanticScore?: number | null;
  graphScore?: number | null;
  conflictFlag?: boolean;
};

export type ReferenceRetrievalHit = ReferenceRetrievalDocument & {
  scores: {
    lexical: number;
    semantic: number;
    authority: number;
    graph: number;
    hybrid: number;
  };
  usableForConclusion: boolean;
  reasons: string[];
};

function normalize(value: string): string {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(value: string): string[] {
  return [
    ...new Set(
      normalize(value)
        .split(" ")
        .filter(token => token.length >= 2)
    ),
  ];
}

function lexicalScore(
  query: string,
  document: ReferenceRetrievalDocument
): number {
  const q = tokens(query);
  if (!q.length) return 0;
  const title = normalize(document.title);
  const body = normalize(document.content);
  let score = 0;
  for (const token of q) {
    if (title.includes(token)) score += 4;
    const bodyHits = body.split(token).length - 1;
    score += Math.min(bodyHits, 6);
  }
  return Math.min(1, score / Math.max(6, q.length * 5));
}

function authorityScore(authorityClass: SourceAuthorityClass): number {
  return Math.max(0, 1 - authorityRank(authorityClass) / 7);
}

function territoryMatches(
  route: ReferenceIssueRoute,
  document: ReferenceRetrievalDocument
): boolean {
  if (route.territories.includes("UNKNOWN")) return true;
  return route.territories.some(territory =>
    document.territories.includes(territory)
  );
}

function domainMatches(
  route: ReferenceIssueRoute,
  document: ReferenceRetrievalDocument
): boolean {
  return route.preferredDomains.includes(document.domain);
}

function isPositiveLawDomain(domain: ReferenceCorpusDomain): boolean {
  return [
    "land_law",
    "waqf_law",
    "lease_hukr",
    "registration_settlement",
    "case_law",
    "administrative",
  ].includes(domain);
}

export function hybridReferenceSearch(input: {
  query: string;
  route: ReferenceIssueRoute;
  documents: ReferenceRetrievalDocument[];
  limit?: number;
}): ReferenceRetrievalHit[] {
  const limit = Math.min(Math.max(input.limit || 8, 1), 30);
  const territorial = input.documents.filter(document =>
    territoryMatches(input.route, document)
  );
  const domainSpecific = territorial.filter(document =>
    domainMatches(input.route, document)
  );
  const eraSpecific = input.route.preferredEras.length
    ? domainSpecific.filter(document =>
        Boolean(
          document.era && input.route.preferredEras.includes(document.era)
        )
      )
    : domainSpecific;
  const candidates = eraSpecific;
  return candidates
    .map(document => {
      const reasons: string[] = [];
      const lexical = lexicalScore(input.query, document);
      const semantic = Math.max(
        0,
        Math.min(1, Number(document.semanticScore || 0))
      );
      const authority = authorityScore(document.authorityClass);
      const graph = Math.max(0, Math.min(1, Number(document.graphScore || 0)));
      const domainBoost = domainMatches(input.route, document) ? 0.1 : 0;
      const hybrid = Math.min(
        1,
        lexical * 0.45 +
          semantic * 0.25 +
          authority * 0.2 +
          graph * 0.1 +
          domainBoost
      );
      if (
        !document.legalStatusVerified &&
        input.route.requiresLegalStatusVerification &&
        isPositiveLawDomain(document.domain)
      ) {
        reasons.push("legal_status_not_verified");
      }
      if (document.conflictFlag) reasons.push("evidence_conflict");
      if (document.authorityClass === "reference_secondary")
        reasons.push("secondary_authority");
      const usableForConclusion = reasons.every(
        reason =>
          !["legal_status_not_verified", "evidence_conflict"].includes(reason)
      );
      return {
        ...document,
        scores: { lexical, semantic, authority, graph, hybrid },
        usableForConclusion,
        reasons,
      };
    })
    .filter(hit => hit.scores.hybrid > 0)
    .sort(
      (a, b) =>
        b.scores.hybrid - a.scores.hybrid ||
        a.documentId.localeCompare(b.documentId)
    )
    .slice(0, limit);
}

export function selectReferenceEvidencePack(
  hits: ReferenceRetrievalHit[],
  maxItems = 6
): ReferenceRetrievalHit[] {
  const selected: ReferenceRetrievalHit[] = [];
  const hosts = new Set<string>();
  const primaryPresent = hits.some(hit =>
    ["official_primary", "judicial_primary", "archival_primary"].includes(
      hit.authorityClass
    )
  );
  const ordered = [...hits].sort((a, b) => {
    if (a.usableForConclusion !== b.usableForConclusion)
      return a.usableForConclusion ? -1 : 1;
    return b.scores.hybrid - a.scores.hybrid;
  });

  for (const hit of ordered) {
    if (selected.length >= maxItems) break;
    let host = hit.sourceUrl;
    try {
      host = new URL(hit.sourceUrl).hostname.toLowerCase();
    } catch {
      // Keep raw source value for diversity accounting.
    }
    const duplicateHost = hosts.has(host);
    if (duplicateHost && selected.length >= 2) continue;
    if (
      primaryPresent &&
      selected.length === 0 &&
      !["official_primary", "judicial_primary", "archival_primary"].includes(
        hit.authorityClass
      )
    )
      continue;
    selected.push(hit);
    hosts.add(host);
  }
  return selected;
}
