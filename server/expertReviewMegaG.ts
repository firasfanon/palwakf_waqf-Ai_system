import type { ExpertReviewItem } from "./expertReviewQueue";
import { buildMegaFSpecialistReadinessQueue } from "./expertReviewMegaF";
import {
  buildMegaGCorpusTerminalLedger,
  buildMegaGTerritoryTerminalPackets,
  type MegaGCorpusTrack,
} from "./referenceMegaG";

export type MegaGSpecialistEvidencePack = {
  packId: string;
  todoId: string;
  role: MegaGCorpusTrack["reviewRole"];
  territories: string[];
  terminalState: MegaGCorpusTrack["terminalState"];
  evidenceRefs: string[];
  unresolvedQuestions: string[];
  evidenceGaps: string[];
  actualHumanDecisionIncluded: false;
};

export function buildMegaGSpecialistEvidencePacks(): MegaGSpecialistEvidencePack[] {
  const corpusPacks = buildMegaGCorpusTerminalLedger().map(track => ({
    packId: "mega-g-pack-" + track.todoId.toLowerCase(),
    todoId: track.todoId,
    role: track.reviewRole,
    territories: [...track.territories],
    terminalState: track.terminalState,
    evidenceRefs: [...new Set(track.evidenceRefs)],
    unresolvedQuestions: [...track.unresolvedQuestions],
    evidenceGaps: [...track.evidenceGaps],
    actualHumanDecisionIncluded: false as const,
  }));

  const jerusalem = buildMegaGTerritoryTerminalPackets().find(
    packet => packet.territory === "JERUSALEM"
  );
  const territoryPacks: MegaGSpecialistEvidencePack[] = jerusalem
    ? [
        {
          packId: "mega-g-pack-land-jerusalem-track",
          todoId: "LAND-JERUSALEM-TRACK",
          role: "LEGAL_STATUS_REVIEWER",
          territories: ["JERUSALEM"],
          terminalState: jerusalem.terminalState,
          evidenceRefs: [...jerusalem.evidenceRefs],
          unresolvedQuestions: [
            "Determine current jurisdiction/applicability only from admitted territory-specific evidence.",
          ],
          evidenceGaps: [...jerusalem.evidenceGaps],
          actualHumanDecisionIncluded: false,
        },
      ]
    : [];

  return [...corpusPacks, ...territoryPacks];
}

function queueItemFromPack(
  pack: MegaGSpecialistEvidencePack
): ExpertReviewItem {
  const territory =
    pack.territories.length === 1 &&
    ["WEST_BANK", "GAZA", "JERUSALEM"].includes(pack.territories[0])
      ? (pack.territories[0] as "WEST_BANK" | "GAZA" | "JERUSALEM")
      : null;

  return {
    reviewId: "review-" + pack.packId,
    kind:
      pack.role === "FIQH_SHARIA_REVIEWER"
        ? "FIQH_SHARIA_SOURCE_ADMISSION"
        : pack.role === "RIGHTS_REVIEWER"
          ? "SOURCE_FAMILY_AUTHORITY_RIGHTS"
          : "LEGAL_STATUS_EXCEPTION",
    role: pack.role,
    priority: "P0",
    subjectId: pack.todoId,
    subjectTitle: "MEGA_G specialist handoff — " + pack.todoId,
    territory,
    evidenceRefs: [...pack.evidenceRefs],
    reasons: [
      ...pack.unresolvedQuestions,
      ...pack.evidenceGaps,
      "terminal_state:" + pack.terminalState,
    ],
    blocksAuthoritativeConclusion: true,
    status: "PENDING_HUMAN_REVIEW",
  };
}

export function buildMegaGSpecialistQueue(): ExpertReviewItem[] {
  const combined = [
    ...buildMegaFSpecialistReadinessQueue(),
    ...buildMegaGSpecialistEvidencePacks().map(queueItemFromPack),
  ];
  const byId = new Map<string, ExpertReviewItem>();
  for (const item of combined) byId.set(item.reviewId, item);
  return [...byId.values()];
}

export function megaGSpecialistHandoffSummary(): {
  totalPacks: number;
  expertReviewReadyPacks: number;
  explicitlyDeferredPacks: number;
  queueItems: number;
  p0QueueItems: number;
  blockingQueueItems: number;
  actualHumanDecisionsIncluded: false;
  productionExpertSignoffSatisfied: false;
} {
  const packs = buildMegaGSpecialistEvidencePacks();
  const queue = buildMegaGSpecialistQueue();
  return {
    totalPacks: packs.length,
    expertReviewReadyPacks: packs.filter(
      pack => pack.terminalState === "EXPERT_REVIEW_READY"
    ).length,
    explicitlyDeferredPacks: packs.filter(
      pack => pack.terminalState === "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"
    ).length,
    queueItems: queue.length,
    p0QueueItems: queue.filter(item => item.priority === "P0").length,
    blockingQueueItems: queue.filter(item => item.blocksAuthoritativeConclusion)
      .length,
    actualHumanDecisionsIncluded: false,
    productionExpertSignoffSatisfied: false,
  };
}

export function megaGNoAutoApproval(): boolean {
  return buildMegaGSpecialistEvidencePacks().every(
    pack => pack.actualHumanDecisionIncluded === false
  );
}
