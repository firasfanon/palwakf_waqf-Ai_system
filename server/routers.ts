
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { systemSettingsRouter } from "./_core/systemSettingsRouter";
import { siteSettingsRouter } from "./_core/siteSettingsRouter";
import { protectedProcedure, publicProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getFrequentQuestions } from "./learning";
import {
  getInteractionStats,
  getCommentsOverTime,
  getRatingsDistribution,
  getNotificationsByType,
  getRecentComments,
  getCommentsByEntityType,
  getRatingsByEntityType,
} from "./interaction-stats";
import { faqs } from "../drizzle/schema";
import {
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  isBookmarked,
  getBookmarkCollections,
  addFavoriteConversation,
  removeFavoriteConversation,
  getUserFavoriteConversations,
  isFavorited,
} from "./bookmarks";
import {
  exportUserConversations,
  exportUserBookmarks,
} from "./export";
// Stub functions for conversations and knowledge routers
// These are placeholders since the actual implementation files are not available
const createConversation = async (...args: any[]) => ({ error: "Not implemented" });
const getConversations = async (...args: any[]) => [];
const getConversation = async (...args: any[]) => null;
const updateConversation = async (...args: any[]) => ({ error: "Not implemented" });
const deleteConversation = async (...args: any[]) => ({ success: true });
const createMessage = async (...args: any[]) => ({ error: "Not implemented" });
const getMessages = async (...args: any[]) => [];
const updateMessage = async (...args: any[]) => ({ error: "Not implemented" });
const deleteMessage = async (...args: any[]) => ({ success: true });
const updateMessageRating = async (...args: any[]) => ({ error: "Not implemented" });
const getMessageRatings = async (...args: any[]) => [];
const createComment = async (...args: any[]) => ({ error: "Not implemented" });
const getComments = async (...args: any[]) => [];
const updateComment = async (...args: any[]) => ({ error: "Not implemented" });
const deleteComment = async (...args: any[]) => ({ success: true });
const createRating = async (...args: any[]) => ({ error: "Not implemented" });
const getRatings = async (...args: any[]) => [];
const updateRating = async (...args: any[]) => ({ error: "Not implemented" });
const deleteRating = async (...args: any[]) => ({ success: true });

const getKnowledgeSources = async (...args: any[]) => [];
const getKnowledgeSource = async (...args: any[]) => null;
const createKnowledgeSource = async (...args: any[]) => ({ error: "Not implemented" });
const updateKnowledgeSource = async (...args: any[]) => ({ error: "Not implemented" });
const deleteKnowledgeSource = async (...args: any[]) => ({ success: true });
const getKnowledgeSourceStats = async (...args: any[]) => ({});
const getFetchedContent = async (...args: any[]) => [];
const getFetchedContentItem = async (...args: any[]) => null;
const createFetchedContent = async (...args: any[]) => ({ error: "Not implemented" });
const updateFetchedContent = async (...args: any[]) => ({ error: "Not implemented" });
const deleteFetchedContent = async (...args: any[]) => ({ success: true });
const getFetchLogs = async (...args: any[]) => [];
const createFetchLog = async (...args: any[]) => ({ error: "Not implemented" });
const updateFetchLog = async (...args: any[]) => ({ error: "Not implemented" });
const deleteFetchLog = async (...args: any[]) => ({ success: true });
import {
  listWatchlists,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  listAlerts,
  markAlertSeen,
  markAlertDone,
  markAlertsSeen,
  markAlertsDone,
  deleteAlerts,
  runWatchlists,
  acquireSchedulerLock,
  releaseSchedulerLock,
  createAlertRun,
  finishAlertRun,
} from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import {
  files,
  messageRatings,
  conversations,
  messages,
  users,
  knowledgeDocuments,
  knowledgeSources,
  fetchedContent,
  fetchLogs,
  cachedResponses,
  waqfProperties,
  waqfCases,
  judicialRulings,
  waqfDeeds,
  ministerialInstructions,
  waqfCategories,
  contentTemplates,
  notifications,
  comments,
  ratings,
  homeSections,
  pageSettings,
  roles,
  permissions,
  rolePermissions,
} from "../drizzle/schema";
import { getDb, getJudicialRulingById } from "./db";
import * as dbOps from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { extractPdfFields } from "./pdf-extraction/extractPdfFields";
import { extractTextFromFile } from "./fileExtractor";
import { fetchFromSource } from "./knowledge-fetchers";
import { classifyDocument, extractInformation, summarizeText } from "./ai-advanced";
import { compareRulings as runCompareRulings, analyzePrecedents as runAnalyzePrecedents, predictCaseOutcome } from "./legal-analysis";
import { retrieveRelevantDocuments, extractRelevantContext, generateSystemPrompt, buildGroundingReferences, ensureGroundedAnswer } from "./rag";
import { invokeLLM } from "./_core/llm";
import { runResearchAnswer } from "./researchOrchestrator";
import { getPlatformBridgeStatus, checkPlatformBridgeConnectivity, previewPlatformSourceOfTruth, previewMappedPlatformSourceOfTruth, getPlatformSourceOfTruthMatrix, listPlatformAdminUsers, listPlatformOrgUnits, listPlatformWaqfAssets, listPlatformEndowments } from "./platform/bridge";
import { buildPlatformAssistantContext, formatPlatformAssistantContext } from "./platform/assistantContext";
import { checkDatabaseHealth } from "./health/databaseHealth";
import { checkLlmProviderHealth } from "./llm/providerHealth";
import { checkSupabaseHealth } from "./health/supabaseHealth";
import { getTrustMetrics, applyTrustMetadata } from "./assistantTrust";
import { buildPublicReadinessHealth } from "./health/readiness";
import { getSourceProvenanceAccess, getSourceProvenanceRegistry, resolveSourceProvenanceActor, upsertSourceProvenance, reviewSourceRightsProfile, archiveSourceProvenance } from "./sourceProvenanceRights";
import { getLegacyManusProvenanceReconciliation } from "./legacyManusProvenance";
import { getAutonomousProvenanceAudit } from "./autonomousProvenanceAudit";
import { getAutonomousExternalSourceVerification } from "./externalSourceVerification";
import { getControlledSourceRegistryDesign } from "./controlledSourceRegistryDesign";
import { getVerifiedSourceSelectionAndControlledReleasePlan } from "./verifiedSourceSelection";
import {
  getGovernedAgenticRagPilotStatus,
  getGovernedAgenticRagPilotCandidates,
  runGovernedAgenticRagPilotSingleFlowReadinessCycle,
  prepareGovernedAgenticRagPilotSessionAuthority,
  getGovernedAgenticRagPilotAuthorityPreparation,
  revokeGovernedAgenticRagPilotAuthorityPreparation,
  startGovernedAgenticRagPilotSession,
  runGovernedAgenticRagPilotQuestion,
  getGovernedAgenticRagPilotEvents,
  rollbackGovernedAgenticRagPilotSession,
} from "./governedAgenticRagPilot";
import { resolveDatabaseConfig } from "./config/databaseConfig";
import {
  runtimeCreateConversation,
  runtimeGetUserConversations,
  runtimeGetConversationById,
  runtimeUpdateConversation,
  runtimeCreateMessage,
  runtimeGetConversationMessages,
  runtimeCreateKnowledgeDocument,
  runtimeGetKnowledgeDocuments,
  runtimeGetKnowledgeScopeCodes,
  runtimeGetKnowledgeDocumentById,
  runtimeUpdateKnowledgeDocument,
  runtimeReviewKnowledgeDocument,
  runtimeGetKnowledgeReviewTrace,
  runtimeDeleteKnowledgeDocument,
  runtimeGetKnowledgeSources,
  runtimeGetKnowledgeSourceById,
  runtimeCreateKnowledgeSource,
  runtimeUpdateKnowledgeSource,
  runtimeDeleteKnowledgeSource,
  runtimeGetKnowledgeSourcesStats,
  runtimeGetTopActiveKnowledgeSources,
  runtimeGetFetchActivityLast7Days,
  runtimeCreateFetchedContent,
  runtimeListFetchedContent,
  runtimeCountFetchedContent,
  runtimeGetFetchedContentById,
  runtimeDeleteFetchedContent,
  runtimeCreateFetchLog,
  runtimeGetFetchLogs,
  runtimeUpdateFetchLog,
  runtimeApproveFetchedContent,
  runtimeRejectFetchedContent,
  runtimeBulkApproveFetchedContent,
  runtimeBulkRejectFetchedContent,
  runtimeUpdateFetchedContentProcessing,
  runtimeListPendingUnprocessedFetchedContent,
  runtimeUpdateFetchedContentExtraction,
  runtimeCreateFetchedContentReviewEvent,
  runtimeListFetchedContentReviewEvents,
  runtimeCreateClassificationRating,
  runtimeGetClassificationRatingsStats,
  runtimeGetDocumentFiles,
  runtimeAddDocumentFile,
  runtimeDeleteDocumentFile,
  runtimeGetAssistantKnowledgeReadDiagnostics,
  runtimeCreateKnowledgeDocumentFromTool,
  runtimeCreateAiToolRun,
  runtimeListAiToolRuns,
  runtimeGetAiToolRunDetails,
  runtimeUpdateAiToolRunReview,
  runtimeGetAiToolRunMetrics,
  runtimeGetAiToolBackendActivationSnapshot,
  runtimeReopenAiToolRun,
  runtimeGetSystemSettings,
  runtimeUpdateSystemSettings,
} from "./runtimeRepository";
import {
  runtimeGetKnowledgeReviewOperationsSnapshot,
  runtimeGetContentClassificationReconciliation,
  runtimeListKnowledgeReviewTasks,
  runtimeClaimKnowledgeReviewTask,
  runtimeVerifyReferenceSource,
  runtimeVerifyKnowledgeCitation,
  runtimeReleaseOfficialKnowledgeDocument,
  runtimeListKb08bMappingQueue,
  runtimeResolveKb08bMapping,
  runtimeListPageOperationBindings,
  runtimeSetPageOperationBinding,
  runtimeGetKnowledgeReviewTaskCase,
  runtimeAssertKnowledgeReviewTaskClaim,
  runtimeResolveContentClassificationContainment,
  runtimeGetKnowledgeOperationAccess,
  runtimeAssertKnowledgeOperationAccess,
  runtimeRecordKnowledgeOperationDenied,
  runtimeRunKnowledgeActivationAudit,
  runtimeGetKnowledgeActivationSnapshot,
  runtimeListKnowledgeActivationItems,
  runtimeRunLegacyProvenanceReconstruction,
  runtimeGetLegacyProvenanceSnapshot,
  runtimeListLegacyProvenanceItems,
  runtimeListLegacyProvenanceGroups,
  runtimeRecordLegacyProvenanceDecision,
  runtimeListDuplicateCitationReviewTasks,
  runtimeReconcileDuplicateCitationReviewTask,
  runtimeRunLegacyProvenanceReconstructionV11,
  runtimeGetLegacyProvenanceSnapshotV11,
  runtimeListLegacyProvenanceItemsV11,
  runtimeListLegacyProvenanceGroupsV11,
  runtimeGetLegacyProvenanceDecisionContextV11,
  runtimeRecordLegacyProvenanceDecisionV11,
  runtimeListDuplicateCitationReviewTasksV11,
  runtimeReconcileDuplicateCitationReviewTaskV11,
} from "./knowledgeOperations";
import {
  assertAssistantMaturityOperationEnabled,
  getAssistantMaturityPolicySnapshot,
  type AssistantMaturityOperation,
} from "./assistantMaturityPolicy";

function requireAssistantMaturityOperation(operation: AssistantMaturityOperation): void {
  try {
    assertAssistantMaturityOperationEnabled(operation);
  } catch (error: any) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: error?.message || 'العملية مؤجلة في مرحلة نضج المساعد الحالية.',
      cause: error,
    });
  }
}

// Cache router
const cacheRouter = router({
  // Get cache statistics
  getStats: adminProcedure.query(async () => {
    const { getCacheStats } = await import("./cache");
    return await getCacheStats();
  }),

  // Get most frequent questions
  getFrequentQuestions: publicProcedure.query(async () => {
    return await getFrequentQuestions();
  }),

  getMostFrequent: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => {
      const { getMostFrequentQuestions } = await import("./cache");
      return await getMostFrequentQuestions(input?.limit || 20);
    }),

  cleanExpired: adminProcedure.mutation(async () => {
    const { cleanExpiredCache } = await import("./cache");
    const deletedCount = await cleanExpiredCache();
    return { deletedCount };
  }),

  updateSuggestedQuestions: adminProcedure
    .input(z.object({ topN: z.number().min(1).max(50).optional() }).optional())
    .mutation(async ({ input }) => {
      const { getMostFrequentQuestions } = await import("./cache");
      const rows = await getMostFrequentQuestions(input?.topN || 12);
      return {
        suggestedQuestions: rows.map((row: any, index: number) => ({
          question: row.questionOriginal || row.question || row.questionNormalized || `سؤال مقترح ${index + 1}`,
          category: row.category || 'general',
          hitCount: row.hitCount || 0,
          displayOrder: index + 1,
        })),
      };
    }),
});

// Interaction stats router
const interactionStatsRouter = router({
  getStats: adminProcedure.query(async () => {
    return await getInteractionStats();
  }),
  getCommentsOverTime: adminProcedure
    .input(z.object({ days: z.number().min(1).max(365).optional() }))
    .query(async ({ input }) => {
      return await getCommentsOverTime();
    }),
  getRatingsDistribution: adminProcedure.query(async () => {
    return await getRatingsDistribution();
  }),
  getNotificationsByType: adminProcedure.query(async () => {
    return await getNotificationsByType();
  }),
  getRecentComments: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      return await getRecentComments();
    }),
  getCommentsByEntityType: adminProcedure.query(async () => {
    return await getCommentsByEntityType();
  }),
  getRatingsByEntityType: adminProcedure.query(async () => {
    return await getRatingsByEntityType();
  }),
});

// Bookmarks router
const bookmarksRouter = router({
  add: protectedProcedure
    .input(z.object({ entityId: z.number(), entityType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await addBookmark(ctx.user.id, input.entityId, input.entityType);
    }),
  remove: protectedProcedure
    .input(z.object({ entityId: z.number(), entityType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await removeBookmark(ctx.user.id, input.entityId);
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await getUserBookmarks(ctx.user.id);
  }),
  isBookmarked: protectedProcedure
    .input(z.object({ entityId: z.number(), entityType: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await isBookmarked(ctx.user.id, input.entityId);
    }),
  getCollections: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await getBookmarkCollections(ctx.user.id);
  }),
});

// Favorites router
const favoritesRouter = router({
  addConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await addFavoriteConversation(ctx.user.id, input.conversationId);
    }),
  removeConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await removeFavoriteConversation(ctx.user.id, input.conversationId);
    }),
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await getUserFavoriteConversations(ctx.user.id);
  }),
  isFavorited: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await isFavorited(ctx.user.id, input.conversationId);
    }),
});

// Export router
const exportRouter = router({
  conversations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await exportUserConversations(ctx.user.id, "json");
  }),
  bookmarks: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await exportUserBookmarks(ctx.user.id, "json");
  }),
  // searchLogs, ratings, comments exports are not available
  // searchLogs: protectedProcedure.query(async ({ ctx }) => {
  //   if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  //   return await exportUserSearchLogs(ctx.user.id);
  // }),
  // ratings: protectedProcedure.query(async ({ ctx }) => {
  //   if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  //   return await exportUserRatings(ctx.user.id);
  // }),
  // comments: protectedProcedure.query(async ({ ctx }) => {
  //   if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  //   return await exportUserComments(ctx.user.id);
  // }),
});

// Conversations router
const conversationsRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await createConversation(ctx.user.id, input.title);
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return await getConversations(ctx.user.id);
  }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getConversation(input.id, ctx.user.id);
    }),
  update: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await updateConversation(input.id, ctx.user.id, input.title);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await deleteConversation(input.id, ctx.user.id);
    }),
  createMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string(),
        role: z.enum(["user", "assistant"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await createMessage(
        input.conversationId,
        ctx.user.id,
        input.content,
        input.role
      );
    }),
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getMessages(input.conversationId, ctx.user.id);
    }),
  updateMessage: protectedProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await updateMessage(input.id, ctx.user.id, input.content);
    }),
  deleteMessage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await deleteMessage(input.id, ctx.user.id);
    }),
  updateMessageRating: protectedProcedure
    .input(z.object({ messageId: z.string(), rating: z.number().min(1).max(5) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await updateMessageRating(input.messageId, ctx.user.id, input.rating);
    }),
  getMessageRatings: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getMessageRatings(input.conversationId, ctx.user.id);
    }),
  createComment: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await createComment(input.messageId, ctx.user.id, input.content);
    }),
  getComments: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getComments(input.messageId, ctx.user.id);
    }),
  updateComment: protectedProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await updateComment(input.id, ctx.user.id, input.content);
    }),
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await deleteComment(input.id, ctx.user.id);
    }),
  createRating: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await createRating(input.messageId, ctx.user.id, input.rating);
    }),
  getRatings: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getRatings(input.messageId, ctx.user.id);
    }),
  updateRating: protectedProcedure
    .input(z.object({ id: z.string(), rating: z.number().min(1).max(5) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await updateRating(input.id, ctx.user.id, input.rating);
    }),
  deleteRating: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await deleteRating(input.id, ctx.user.id);
    }),
});

// Knowledge router
const knowledgeRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional(), category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return await runtimeGetKnowledgeDocuments({
        search: input?.search,
        category: input?.category,
        isActive: 1,
      } as any);
    }),
  adminList: adminProcedure
    .input(z.object({ search: z.string().optional(), category: z.string().optional(), status: z.enum(['all','draft','review_only','approved','rejected']).optional() }).optional())
    .query(async ({ input }) => {
      const docs = await runtimeGetKnowledgeDocuments({
        search: input?.search,
        category: input?.category,
      } as any);
      const wanted = input?.status && input.status !== 'all' ? input.status : null;
      return (docs || []).filter((doc: any) => wanted ? (doc.status || (doc.isActive === 1 ? 'approved' : 'draft')) === wanted : true);
    }),
  getById: publicProcedure
    .input(z.object({ id: z.union([z.number(), z.string()]) }).optional())
    .query(async ({ input }) => {
      if (!input?.id) return null;
      return await runtimeGetKnowledgeDocumentById(input.id);
    }),
  reviewTrace: adminProcedure
    .input(z.object({ id: z.union([z.number(), z.string()]) }))
    .query(async ({ input }) => {
      return await runtimeGetKnowledgeReviewTrace(input.id);
    }),
  create: adminProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.enum(["law","jurisprudence","majalla","historical","administrative","reference"]),
      source: z.string().optional(),
      sourceUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await runtimeCreateKnowledgeDocument({
        ...input,
        createdBy: ctx.user?.id,
      });
    }),
  update: adminProcedure
    .input(z.object({
      id: z.union([z.number(), z.string()]),
      title: z.string().optional(),
      content: z.string().optional(),
      category: z.enum(["law","jurisprudence","majalla","historical","administrative","reference"]).optional(),
      source: z.string().optional(),
      sourceUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
      tags: z.string().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await runtimeUpdateKnowledgeDocument(id, updates as any);
    }),
  setReviewStatus: adminProcedure
    .input(z.object({ id: z.union([z.number(), z.string()]), status: z.enum(['draft','review_only','approved','rejected']), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await runtimeReviewKnowledgeDocument(input.id, { status: input.status, notes: input.notes, reviewedBy: ctx.user?.id ?? null });
    }),
  delete: adminProcedure
    .input(z.object({ id: z.union([z.number(), z.string()]) }))
    .mutation(async ({ input }) => {
      return await runtimeDeleteKnowledgeDocument(input.id);
    }),
  uploadPdf: adminProcedure
    .input(z.object({ fileName: z.string(), fileData: z.string(), fileType: z.string().optional() }))
    .mutation(async ({ input }) => {
      const mimeType = input.fileType || 'application/pdf';
      const buffer = Buffer.from(input.fileData.includes(',') ? input.fileData.split(',')[1] : input.fileData, 'base64');
      const extractedText = await extractTextFromFile(buffer, mimeType).catch(() => '');
      return {
        success: true,
        url: `data:${mimeType};base64,${input.fileData.includes(',') ? input.fileData.split(',')[1] : input.fileData}`,
        extractedText: extractedText || '',
      };
    }),
  getFiles: publicProcedure
    .input(z.object({ documentId: z.union([z.number(), z.string()]) }))
    .query(async ({ input }) => {
      return await runtimeGetDocumentFiles(input.documentId);
    }),
  addFile: adminProcedure
    .input(z.object({
      documentId: z.number(),
      fileName: z.string(),
      fileData: z.string(),
      fileType: z.enum(['original','translation','supplement','other']).optional(),
      language: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const mimeType = 'application/pdf';
      const rawBase64 = input.fileData.includes(',') ? input.fileData.split(',')[1] : input.fileData;
      const buffer = Buffer.from(rawBase64, 'base64');
      const extractedText = await extractTextFromFile(buffer, mimeType).catch(() => '');
      return await runtimeAddDocumentFile({
        documentId: input.documentId,
        fileName: input.fileName,
        fileUrl: `data:${mimeType};base64,${rawBase64}`,
        fileSize: buffer.length,
        fileType: input.fileType || 'original',
        language: input.language || 'ar',
        extractedText: extractedText || null,
        isOcr: extractedText ? 1 : 0,
        uploadedBy: ctx.user?.id,
      } as any);
    }),
  deleteFile: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await runtimeDeleteDocumentFile(input.id);
      return { success: true };
    }),
  sources: router({
    list: publicProcedure.query(async () => {
      return await runtimeGetKnowledgeSources();
    }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await runtimeGetKnowledgeSourceById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          url: z.string().url(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runtimeCreateKnowledgeSource({
          name: input.name,
          type: 'rss',
          url: input.url,
          config: input.category,
          createdBy: ctx.user?.id,
        } as any);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          url: z.string().url().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await runtimeUpdateKnowledgeSource(input.id, {
          name: input.name,
          url: input.url,
          config: input.category,
        } as any);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await runtimeDeleteKnowledgeSource(input.id);
      }),
    getStats: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getFetchLogsStats } = await import("./db");
        return await getFetchLogsStats(input.id);
      }),
  }),
  content: router({
    list: publicProcedure
      .input(
        z.object({
          sourceId: z.number().optional(),
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
      )
      .query(async ({ input }) => {
        return await runtimeListFetchedContent({ sourceId: input.sourceId, limit: input.limit, offset: input.offset } as any);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await runtimeGetFetchedContentById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          sourceId: z.number(),
          title: z.string(),
          url: z.string().url(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await runtimeCreateFetchedContent({
          sourceId: input.sourceId,
          title: input.title,
          url: input.url,
          content: input.content,
        } as any);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          url: z.string().url().optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await runtimeUpdateFetchedContentProcessing(input.id, { processingVersion: 'manual-status-update-v1' });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await runtimeDeleteFetchedContent(input.id);
      }),
  }),
  logs: router({
    list: adminProcedure
      .input(
        z.object({
          sourceId: z.number().optional(),
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
      )
      .query(async ({ input }) => {
        return await runtimeGetFetchLogs({ sourceId: input.sourceId, limit: input.limit, offset: input.offset } as any);
      }),
    create: adminProcedure
      .input(
        z.object({
          sourceId: z.number(),
          status: z.string(),
          itemsCount: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await runtimeCreateFetchLog({ sourceId: input.sourceId, status: input.status as any, itemsFetched: input.itemsCount } as any);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string().optional(),
          itemsCount: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await runtimeUpdateFetchLog(input.id, {
          status: input.status as any,
          itemsFetched: input.itemsCount,
        } as any);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // deleteFetchLog helper غير متوفر في قاعدة البيانات الحالية
        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "حذف سجل الجلب غير مدعوم حاليًا" });
      }),
  }),
});

const knowledgeSourcesRouter = router({
  list: publicProcedure
    .input(z.object({ type: z.string().optional(), isActive: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await runtimeGetKnowledgeSources(input || undefined);
    }),
  create: adminProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["wikipedia","rss","scraper","pdf_url","api"]),
      url: z.string().url(),
      config: z.string().optional(),
      fetchFrequency: z.enum(["manual","daily","weekly","monthly"]).optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await runtimeCreateKnowledgeSource({ ...input, createdBy: ctx.user?.id });
    }),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(["wikipedia","rss","scraper","pdf_url","api"]).optional(),
      url: z.string().url().optional(),
      config: z.string().optional(),
      fetchFrequency: z.enum(["manual","daily","weekly","monthly"]).optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await runtimeUpdateKnowledgeSource(id, updates as any);
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await runtimeDeleteKnowledgeSource(input.id);
      return { success: true };
    }),
  toggleActive: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.number() }))
    .mutation(async ({ input }) => {
      await runtimeUpdateKnowledgeSource(input.id, { isActive: input.isActive } as any);
      return { success: true };
    }),
  fetch: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          sourceId: input.id,
          sourceName: "local-mode",
          sourceType: "local",
          items: [],
          itemsFetched: 0,
          errors: ["الجلب الخارجي مؤجل في النمط المحلي حتى ربط قاعدة البيانات التشغيلية."],
          fetchedAt: new Date(),
        };
      }
      return await fetchFromSource(input.id);
    }),
  stats: publicProcedure.query(async () => {
      return await runtimeGetKnowledgeSourcesStats();
  }),
  topActive: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await runtimeGetTopActiveKnowledgeSources(input?.limit || 5);
    }),
  fetchActivity: publicProcedure.query(async () => {
      return await runtimeGetFetchActivityLast7Days();
  }),
});

const fetchedContentRouter = router({
  list: adminProcedure
    .input(z.object({
      status: z.enum(["all","pending","approved","rejected","processing"]).optional(),
      sourceId: z.number().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const normalized = input ? { ...input, status: input.status === 'all' ? undefined : input.status } : undefined;
      const items = await runtimeListFetchedContent(normalized as any);
      const total = await runtimeCountFetchedContent(normalized as any);
      return { items, total };
    }),
  approve: adminProcedure
    .input(z.object({ id: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await runtimeApproveFetchedContent(input.id, ctx.user!.id);
      await runtimeCreateFetchedContentReviewEvent({
        fetchedContentId: input.id,
        eventType: 'approval',
        eventSource: 'reviewer',
        previousStatus: 'pending',
        nextStatus: 'approved',
        notes: input.notes || 'تم اعتماد الوثيقة وترقيتها إلى المعرفة.',
        actorUserId: ctx.user!.id,
      } as any);
      return doc;
    }),
  reject: adminProcedure
    .input(z.object({ id: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await runtimeRejectFetchedContent(input.id, ctx.user!.id);
      await runtimeCreateFetchedContentReviewEvent({
        fetchedContentId: input.id,
        eventType: 'rejection',
        eventSource: 'reviewer',
        previousStatus: 'pending',
        nextStatus: 'rejected',
        notes: input.notes || 'تم رفض الوثيقة من مسار المعرفة الحالي.',
        actorUserId: ctx.user!.id,
      } as any);
      return { success: true };
    }),
  approveMultiple: adminProcedure
    .input(z.object({ ids: z.array(z.number()), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const successCount = await runtimeBulkApproveFetchedContent(input.ids, ctx.user!.id);
      for (const id of input.ids) {
        await runtimeCreateFetchedContentReviewEvent({
          fetchedContentId: id,
          eventType: 'bulk_action',
          eventSource: 'admin',
          previousStatus: 'pending',
          nextStatus: 'approved',
          notes: input.notes || 'اعتماد جماعي.',
          actorUserId: ctx.user!.id,
        } as any).catch(() => null);
      }
      return { successCount, errorCount: Math.max(0, input.ids.length - successCount) };
    }),
  rejectMultiple: adminProcedure
    .input(z.object({ ids: z.array(z.number()), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const successCount = await runtimeBulkRejectFetchedContent(input.ids, ctx.user!.id);
      for (const id of input.ids) {
        await runtimeCreateFetchedContentReviewEvent({
          fetchedContentId: id,
          eventType: 'bulk_action',
          eventSource: 'admin',
          previousStatus: 'pending',
          nextStatus: 'rejected',
          notes: input.notes || 'رفض جماعي.',
          actorUserId: ctx.user!.id,
        } as any).catch(() => null);
      }
      return { successCount, errorCount: Math.max(0, input.ids.length - successCount) };
    }),
  classifyItem: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const item = await runtimeGetFetchedContentById(input.id);
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'العنصر غير موجود' });
      const result = await classifyDocument(item.content || '', item.title || undefined);
      const mappedCategory = mapAiCategory(result.category);
      await runtimeUpdateFetchedContentProcessing(input.id, {
        aiCategory: mappedCategory,
        aiKeywords: result.keywords?.join(', '),
        aiSummary: result.summary,
        aiConfidence: result.confidence,
        aiReasoning: result.subcategories?.join('، '),
        relevanceScore: result.relevanceScore,
        processingVersion: 'ai-advanced-v1',
      });
      await runtimeCreateFetchedContentReviewEvent({
        fetchedContentId: input.id,
        eventType: 'classification',
        eventSource: 'ai',
        confidence: String(result.confidence),
        notes: `تصنيف ذكي: ${mappedCategory}`,
        payload: JSON.stringify(result),
        actorUserId: ctx.user?.id,
      } as any).catch(() => null);
      return { category: mappedCategory, confidence: result.confidence, keywords: result.keywords, summary: result.summary, reasoning: result.subcategories?.join('، '), relevanceScore: result.relevanceScore };
    }),
  classifyMultiple: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      let successCount = 0;
      let errorCount = 0;
      for (const id of input.ids) {
        try {
          const item = await runtimeGetFetchedContentById(id);
          if (!item) throw new Error('missing');
          const result = await classifyDocument(item.content || '', item.title || undefined);
          const mappedCategory = mapAiCategory(result.category);
          await runtimeUpdateFetchedContentProcessing(id, {
            aiCategory: mappedCategory,
            aiKeywords: result.keywords?.join(', '),
            aiSummary: result.summary,
            aiConfidence: result.confidence,
            aiReasoning: result.subcategories?.join('، '),
            relevanceScore: result.relevanceScore,
            processingVersion: 'ai-advanced-v1',
          });
          await runtimeCreateFetchedContentReviewEvent({
            fetchedContentId: id,
            eventType: 'classification',
            eventSource: 'ai',
            confidence: String(result.confidence),
            notes: `تصنيف جماعي: ${mappedCategory}`,
            payload: JSON.stringify(result),
            actorUserId: ctx.user?.id,
          } as any).catch(() => null);
          successCount++;
        } catch {
          errorCount++;
        }
      }
      return { successCount, errorCount };
    }),
  rateClassification: adminProcedure
    .input(z.union([
      z.object({ id: z.number(), rating: z.enum(['positive','negative']), feedback: z.string().optional() }),
      z.object({ fetchedContentId: z.number(), isAccurate: z.boolean(), feedback: z.string().optional() })
    ]))
    .mutation(async ({ input, ctx }) => {
      const fetchedContentId = 'fetchedContentId' in input ? input.fetchedContentId : input.id;
      const rating = 'isAccurate' in input ? (input.isAccurate ? 'positive' : 'negative') : input.rating;
      return await runtimeCreateClassificationRating({
        fetchedContentId,
        rating,
        feedback: input.feedback,
        ratedBy: ctx.user?.id,
      } as any);
    }),
  getRatingsStats: adminProcedure.query(async () => {
    return await runtimeGetClassificationRatingsStats();
  }),
  getReviewEvents: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await runtimeListFetchedContentReviewEvents(input.id);
    }),
  resolvePlatformContext: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const item = await runtimeGetFetchedContentById(input.id);
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'العنصر غير موجود' });

      const contentSnippet = (item.content || '').slice(0, 600);
      const hints = [item.title, item.docNumber, item.issuer, item.aiKeywords, item.tags, contentSnippet];

      return await buildPlatformAssistantContext({
        query: [item.title, item.docNumber, item.issuer].filter(Boolean).join(' '),
        hints,
        user: ctx.user,
        limit: 4,
      });
    }),
});

const smartProcessingRouter = router({
  processOne: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const item = await runtimeGetFetchedContentById(input.id);
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'العنصر غير موجود' });
      const result = await classifyDocument(item.content || '', item.title || undefined);
      const mappedCategory = mapAiCategory(result.category);
      await runtimeUpdateFetchedContentProcessing(input.id, {
        aiCategory: mappedCategory,
        aiKeywords: result.keywords?.join(', '),
        aiSummary: result.summary,
        aiConfidence: result.confidence,
        aiReasoning: result.subcategories?.join('، '),
        relevanceScore: result.relevanceScore,
        processingVersion: 'smart-processing-v1',
      });
      await runtimeCreateFetchedContentReviewEvent({
        fetchedContentId: input.id,
        eventType: 'manual_update',
        eventSource: 'ai',
        confidence: String(result.confidence),
        notes: 'تمت المعالجة الذكية للعنصر.',
        payload: JSON.stringify(result),
        actorUserId: ctx.user?.id,
      } as any).catch(() => null);
      return { category: mappedCategory, confidence: result.confidence, keywords: result.keywords, summary: result.summary, reasoning: result.subcategories?.join('، '), relevanceScore: result.relevanceScore };
    }),
  processPending: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .mutation(async ({ input, ctx }) => {
      const items = await runtimeListPendingUnprocessedFetchedContent(input?.limit || 10);
      let successCount = 0;
      let errorCount = 0;
      for (const item of items) {
        try {
          const result = await classifyDocument(item.content || '', item.title || undefined);
          const mappedCategory = mapAiCategory(result.category);
          await runtimeUpdateFetchedContentProcessing(item.id, {
            aiCategory: mappedCategory,
            aiKeywords: result.keywords?.join(', '),
            aiSummary: result.summary,
            aiConfidence: result.confidence,
            aiReasoning: result.subcategories?.join('، '),
            relevanceScore: result.relevanceScore,
            processingVersion: 'smart-processing-v1',
          });
          await runtimeCreateFetchedContentReviewEvent({
            fetchedContentId: item.id,
            eventType: 'manual_update',
            eventSource: 'ai',
            confidence: String(result.confidence),
            notes: 'معالجة ذكية مجمعة.',
            payload: JSON.stringify(result),
            actorUserId: ctx.user?.id,
          } as any).catch(() => null);
          successCount++;
        } catch {
          errorCount++;
        }
      }
      return { successCount, errorCount };
    }),
  updateOne: adminProcedure
    .input(z.object({
      id: z.number(),
      aiCategory: z.enum(["law","jurisprudence","majalla","historical","administrative","reference"]).optional(),
      aiKeywords: z.array(z.string()).optional(),
      aiSummary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      relevanceScore: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await runtimeUpdateFetchedContentProcessing(input.id, {
        aiCategory: input.aiCategory,
        aiKeywords: input.aiKeywords?.join(', '),
        aiSummary: input.aiSummary,
        tags: input.tags?.join(', '),
        relevanceScore: input.relevanceScore,
        processingVersion: 'manual-review-v1',
      });
      await runtimeCreateFetchedContentReviewEvent({
        fetchedContentId: input.id,
        eventType: 'manual_update',
        eventSource: 'reviewer',
        notes: 'تحديث يدوي لحقول المعالجة الذكية.',
        payload: JSON.stringify(input),
        actorUserId: ctx.user?.id,
      } as any).catch(() => null);
      return { success: true };
    }),
});

const ratingsRouter = router({
  getUserRating: protectedProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { getUserRating } = await import("./db");
      return await getUserRating(ctx.user!.id, input.entityType, input.entityId);
    }),
  rate: protectedProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number(), rating: z.number().min(1).max(5), review: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { rateEntity } = await import("./db");
      return await rateEntity({ userId: ctx.user!.id, entityType: input.entityType, entityId: input.entityId, rating: input.rating, review: input.review } as any);
    }),
  delete: protectedProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { deleteRating } = await import("./db");
      await deleteRating(ctx.user!.id, input.entityType, input.entityId);
      return { success: true };
    }),
});

const referencesRouter = router({
  list: publicProcedure.query(async () => {
    const { getLandReferences } = await import("./db");
    return await getLandReferences({ isActive: 1 } as any);
  }),
});

const fileRouter = router({
  extractText: protectedProcedure
    .input(z.object({ fileData: z.string(), mimeType: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const buffer = Buffer.from(input.fileData, 'base64');
        const text = await extractTextFromFile(buffer, input.mimeType || 'application/octet-stream');
        return { success: true, text };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'فشل استخراج النص' };
      }
    }),
});


function isLocalLlmProviderUnavailable(error: unknown): boolean {
  const text = error instanceof Error
    ? `${error.name} ${error.message} ${(error as any)?.cause?.message || ''} ${(error as any)?.cause?.code || ''}`
    : String(error || '');

  return /ECONNREFUSED|fetch failed|127\.0\.0\.1:11434|localhost:11434/i.test(text);
}

function buildLocalLlmUnavailableMessage(query: string, docsCount: number): string {
  const trimmedQuery = query.trim();
  const safeQuery = trimmedQuery.length > 160 ? `${trimmedQuery.slice(0, 157)}...` : trimmedQuery;
  const groundingNote = docsCount > 0
    ? `تم العثور على ${docsCount} مرجع/مؤشر معرفة محلي، لكن لم يتم توليد إجابة نهائية لأن مزود النموذج غير متصل.`
    : 'لم يتم توليد إجابة نهائية لأن مزود النموذج غير متصل.';

  return [
    'تعذر إكمال الطلب من مزود الذكاء المحلي.',
    '',
    groundingNote,
    '',
    'السبب التشغيلي: خدمة Ollama المحلية غير متاحة على `127.0.0.1:11434` أو أن النموذج المحدد غير مشغّل.',
    '',
    safeQuery ? `السؤال المستلم: ${safeQuery}` : null,
    '',
    'إجراء مقترح: شغّل Ollama محليًا وتحقق من توفر النموذج، أو غيّر إعدادات مزود النموذج من لوحة الإعدادات. تم حفظ الرسالة دون إسقاط واجهة المحادثة.'
  ].filter(Boolean).join('\n');
}

const chatRouter = router({
  createConversation: protectedProcedure
    .input(z.object({ title: z.string().optional(), category: z.enum(["general","legal","jurisprudence","administrative","historical"]).optional() }))
    .mutation(async ({ input, ctx }) => {
      return await runtimeCreateConversation({
        userId: ctx.user!.id,
        title: input.title || 'محادثة جديدة',
        category: input.category || 'general',
        isActive: 1,
      } as any);
    }),
  myConversations: protectedProcedure.query(async ({ ctx }) => {
    return await runtimeGetUserConversations(ctx.user!.id);
  }),
  getConversation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const conversation = await runtimeGetConversationById(input.id);
      if (!conversation || conversation.userId !== ctx.user!.id) throw new TRPCError({ code: 'NOT_FOUND', message: 'المحادثة غير موجودة' });
      const messages = await runtimeGetConversationMessages(input.id);
      return { conversation, messages };
    }),
  deleteConversation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await runtimeGetConversationById(input.id);
      if (!conversation || conversation.userId !== ctx.user!.id) throw new TRPCError({ code: 'NOT_FOUND', message: 'المحادثة غير موجودة' });
      await runtimeUpdateConversation(input.id, { isActive: 0 } as any);
      return { success: true };
    }),
  sendMessage: protectedProcedure
    .input(z.object({ conversationId: z.number(), message: z.string(), mode: z.enum(["answer", "deep_research"]).optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('[chat.sendMessage] start', {
          conversationId: input.conversationId,
          userId: ctx.user!.id,
          messageLength: input.message.length,
        });
        const conversation = await runtimeGetConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user!.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'المحادثة غير موجودة' });
        }
        const userMessage = await runtimeCreateMessage({ conversationId: input.conversationId, role: 'user', content: input.message } as any);
        const scopeCodes = await runtimeGetKnowledgeScopeCodes(ctx.user).catch(() => []);
        const platformContext = await buildPlatformAssistantContext({
          query: input.message,
          user: ctx.user,
          hints: [conversation.title],
          limit: 3,
        });
        const research = await runResearchAnswer({
          question: input.message,
          mode: input.mode || "answer",
          actor: ctx.user,
          scopeCodes,
        });
        const groundingReferences = research.references;
        const content = research.answer || 'تعذر توليد إجابة موثقة من الأدلة المتاحة.';
        const assistantMessage = await runtimeCreateMessage({ conversationId: input.conversationId, role: 'assistant', content, sources: JSON.stringify(groundingReferences) } as any);
        await runtimeUpdateConversation(input.conversationId, { updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') } as any);
        console.log('[chat.sendMessage] success', { conversationId: input.conversationId, assistantMessageId: assistantMessage?.id, docsCount: research.internalEvidenceCount });
        return { userMessage, assistantMessage, groundingReferences, platformContextUsed: platformContext, knowledgeScopeCodesApplied: scopeCodes, research };
      } catch (error: any) {
        console.error('[chat.sendMessage] failed', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'فشل إرسال الرسالة أو توليد الرد',
        });
      }
    }),
});

function mapAiCategory(category?: string | null): "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference" {
  const normalized = (category || '').trim().toLowerCase();
  if (normalized.includes('قانون') || normalized === 'law') return 'law';
  if (normalized.includes('شرع') || normalized.includes('فقه') || normalized === 'jurisprudence') return 'jurisprudence';
  if (normalized.includes('مجلة') || normalized.includes('majalla')) return 'majalla';
  if (normalized.includes('تاريخ') || normalized === 'historical') return 'historical';
  if (normalized.includes('إدار') || normalized === 'administrative') return 'administrative';
  return 'reference';
}


function buildKnowledgeDraftPayloadFromTool(input: {
  tool: 'extract' | 'classify' | 'summarize' | 'compare' | 'precedents' | 'predict';
  text: string;
  title?: string;
  result: any;
  category?: string | null;
}) {
  const trimmedText = (input.text || '').trim();
  const fallbackTitle = trimmedText.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim()?.slice(0, 120) || 'مادة ذكية جديدة';
  const title = (input.title || '').trim() || `${fallbackTitle} — ${input.tool}`;
  const toolLabelMap: Record<string, string> = {
    extract: 'أداة الاستخراج',
    classify: 'أداة التصنيف',
    summarize: 'أداة التلخيص',
    compare: 'أداة مقارنة الأحكام',
    precedents: 'أداة تحليل السوابق',
    predict: 'أداة توقع النتائج',
  };
  const toolLabel = toolLabelMap[input.tool] || input.tool;

  if (input.tool === 'classify') {
    const category = mapAiCategory(input.category || input.result?.rawCategory || input.result?.category || 'reference');
    const tags = Array.isArray(input.result?.tags) ? input.result.tags.join(', ') : '';
    const content = [
      `عنوان المادة: ${title}`,
      `الأداة المنتجة: ${toolLabel}`,
      `الفئة المقترحة: ${input.result?.category || '-'}`,
      `نوع الوثيقة: ${input.result?.documentType || '-'}`,
      `درجة الثقة: ${typeof input.result?.confidence === 'number' ? `${Math.round(input.result.confidence * 100)}%` : '-'}`,
      input.result?.subcategory ? `فئة فرعية: ${input.result.subcategory}` : null,
      input.result?.reasoning ? `ملاحظات التصنيف: ${input.result.reasoning}` : null,
      '',
      'النص الأصلي:',
      trimmedText,
    ].filter(Boolean).join('\n');
    return { title, category, tags, content, metadata: { tool: input.tool, result: input.result } };
  }

  if (input.tool === 'extract') {
    const keyPoints = Array.isArray(input.result?.keyPoints) ? input.result.keyPoints : [];
    const legalTopics = Array.isArray(input.result?.legalTopics) ? input.result.legalTopics : [];
    const citations = Array.isArray(input.result?.citations) ? input.result.citations : [];
    const entities = input.result?.entities || {};
    const tags = [...legalTopics, ...citations].filter(Boolean).join(', ');
    const content = [
      `عنوان المادة: ${title}`,
      `الأداة المنتجة: ${toolLabel}`,
      '',
      'النقاط الرئيسية:',
      ...(keyPoints.length ? keyPoints.map((item: string) => `- ${item}`) : ['- لا توجد نقاط رئيسية واضحة']),
      '',
      'الكيانات المستخرجة:',
      ...Object.entries(entities).map(([key, value]: any) => `- ${key}: ${Array.isArray(value) ? value.join('، ') : value || '-'}`),
      '',
      'المواضيع/الإحالات القانونية:',
      ...(legalTopics.length ? legalTopics.map((item: string) => `- ${item}`) : ['- لا توجد مواضيع قانونية واضحة']),
      ...(citations.length ? ['', 'الإحالات المستخرجة:', ...citations.map((item: string) => `- ${item}`)] : []),
      '',
      'النص الأصلي:',
      trimmedText,
    ].filter(Boolean).join('\n');
    return { title, category: 'reference', tags, content, metadata: { tool: input.tool, result: input.result } };
  }

  if (input.tool === 'compare') {
    const similarities = Array.isArray(input.result?.similarities) ? input.result.similarities : [];
    const differences = Array.isArray(input.result?.differences) ? input.result.differences : [];
    const recommendations = Array.isArray(input.result?.recommendations) ? input.result.recommendations : [];
    const content = [
      `عنوان المادة: ${title}`,
      `الأداة المنتجة: ${toolLabel}`,
      '',
      'الخلاصة:',
      input.result?.conclusion || 'لا توجد خلاصة محفوظة.',
      '',
      'أوجه التشابه:',
      ...(similarities.length ? similarities.map((item: string) => `- ${item}`) : ['- لا توجد أوجه تشابه محفوظة']),
      '',
      'أوجه الاختلاف:',
      ...(differences.length ? differences.map((item: string) => `- ${item}`) : ['- لا توجد أوجه اختلاف محفوظة']),
      ...(recommendations.length ? ['', 'التوصيات:', ...recommendations.map((item: string) => `- ${item}`)] : []),
      '',
      'النص الأصلي/المدخلات:',
      trimmedText,
    ].filter(Boolean).join('\n');
    return { title, category: 'law', tags: 'مقارنة, أحكام', content, metadata: { tool: input.tool, result: input.result } };
  }

  if (input.tool === 'precedents') {
    const patterns = Array.isArray(input.result?.patterns) ? input.result.patterns : [];
    const recommendations = Array.isArray(input.result?.recommendations) ? input.result.recommendations : [];
    const precedents = Array.isArray(input.result?.precedents) ? input.result.precedents : [];
    const content = [
      `عنوان المادة: ${title}`,
      `الأداة المنتجة: ${toolLabel}`,
      '',
      'السوابق ذات الصلة:',
      ...(precedents.length ? precedents.map((item: any) => `- ${item.title || 'سابقة'}: ${item.summary || '-'}`) : ['- لا توجد سوابق محفوظة']),
      ...(patterns.length ? ['', 'الاتجاهات:', ...patterns.map((item: string) => `- ${item}`)] : []),
      ...(recommendations.length ? ['', 'التوصيات:', ...recommendations.map((item: string) => `- ${item}`)] : []),
      '',
      'النص الأصلي/المدخلات:',
      trimmedText,
    ].filter(Boolean).join('\n');
    return { title, category: 'law', tags: 'سوابق, تحليل', content, metadata: { tool: input.tool, result: input.result } };
  }

  if (input.tool === 'predict') {
    const factors = Array.isArray(input.result?.factors) ? input.result.factors : [];
    const similarCases = Array.isArray(input.result?.similarCases) ? input.result.similarCases : [];
    const recommendations = input.result?.recommendations ? [input.result.recommendations] : [];
    const content = [
      `عنوان المادة: ${title}`,
      `الأداة المنتجة: ${toolLabel}`,
      '',
      `النتيجة المتوقعة: ${input.result?.prediction || 'غير محددة'}`,
      `درجة الاحتمال: ${typeof input.result?.probability === 'number' ? Math.round(input.result.probability * 100) + '%' : '-'}`,
      '',
      'العوامل المؤثرة:',
      ...(factors.length ? factors.map((item: any) => `- ${item.name || 'عامل'} (${typeof item.weight === 'number' ? Math.round(item.weight * 100) + '%' : '-'})`) : ['- لا توجد عوامل محفوظة']),
      ...(similarCases.length ? ['', 'سوابق داعمة:', ...similarCases.map((item: any) => `- ${item.title || 'سابقة'}: ${item.outcome || '-'}`)] : []),
      ...(recommendations.length ? ['', 'التوصيات:', ...recommendations.map((item: string) => `- ${item}`)] : []),
      '',
      'النص الأصلي/المدخلات:',
      trimmedText,
    ].filter(Boolean).join('\n');
    return { title, category: 'law', tags: 'توقع, نتيجة', content, metadata: { tool: input.tool, result: input.result } };
  }

  const summary = input.result?.summary || input.result?.detailedSummary || '';
  const keyPoints = Array.isArray(input.result?.keyPoints) ? input.result.keyPoints : [];
  const recommendations = Array.isArray(input.result?.recommendations)
    ? input.result.recommendations
    : input.result?.recommendations
      ? [input.result.recommendations]
      : [];
  const content = [
    `عنوان المادة: ${title}`,
    `الأداة المنتجة: ${toolLabel}`,
    '',
    'الملخص:',
    summary || 'لا يوجد ملخص متاح.',
    '',
    'النقاط الرئيسية:',
    ...(keyPoints.length ? keyPoints.map((item: string) => `- ${item}`) : ['- لا توجد نقاط رئيسية واضحة']),
    ...(recommendations.length ? ['', 'الخلاصة/التوصيات:', ...recommendations.map((item: string) => `- ${item}`)] : []),
    '',
    'النص الأصلي:',
    trimmedText,
  ].filter(Boolean).join('\n');
  return { title, category: 'reference', tags: '', content, metadata: { tool: input.tool, result: input.result } };
}

const legalAnalysisRouter = router({
  compareRulings: adminProcedure
    .input(z.object({
      ruling1: z.string().min(1),
      ruling2: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const createdByAdminUserId = ctx.user?.platformUserId ?? null;
      const buildTitle = () => `مقارنة الأحكام — ${new Date().toISOString().slice(0, 19)}`;
      try {
        const resolveRuling = async (value: string, label: string) => {
          const trimmed = value.trim();
          if (/^\d+$/.test(trimmed)) {
            const ruling = await getJudicialRulingById(Number(trimmed));
            if (ruling) {
              return {
                meta: {
                  id: ruling.id,
                  caseNumber: ruling.caseNumber,
                  court: ruling.court,
                  date: ruling.rulingDate,
                  title: ruling.title,
                },
                text: [ruling.title, ruling.subject, ruling.summary, ruling.fullText || ""]
                  .filter(Boolean)
                  .join("\n\n"),
              };
            }
          }

          return {
            meta: {
              caseNumber: label,
              court: "نص حر",
              date: "—",
              title: label,
            },
            text: trimmed,
          };
        };

        const ruling1 = await resolveRuling(input.ruling1, "الحكم الأول");
        const ruling2 = await resolveRuling(input.ruling2, "الحكم الثاني");
        const result = await runCompareRulings(ruling1.text, ruling2.text);

        const response = {
          ruling1: ruling1.meta,
          ruling2: ruling2.meta,
          similarities: (result.similarities || []).map((item) => `${item.aspect}: ${item.description}`),
          differences: (result.differences || []).map((item) => `${item.aspect}: ${item.description} (${item.significance})`),
          conclusion: result.conclusion || "",
          recommendations: result.recommendation ? [result.recommendation] : [],
          raw: result,
        };

        const toolRun = await runtimeCreateAiToolRun({
          toolKey: 'compare',
          runStatus: 'completed',
          approvalStatus: 'pending',
          title: buildTitle(),
          inputText: [input.ruling1, input.ruling2].join("\n\n---\n\n"),
          inputJson: input,
          outputText: [response.conclusion, ...(response.recommendations || [])].filter(Boolean).join("\n"),
          outputJson: response,
          sourceContextJson: {
            entrypoint: '/admin/tools/compare',
            userSource: ctx.user?.source ?? null,
          },
          createdByAdminUserId,
          notes: 'Compare tool run persisted to assistant.ai_tool_runs',
        });

        return {
          ...response,
          toolRunId: toolRun.id,
        };
      } catch (error) {
        try {
          await runtimeCreateAiToolRun({
            toolKey: 'compare',
            runStatus: 'failed',
            approvalStatus: 'pending',
            title: buildTitle(),
            inputText: [input.ruling1, input.ruling2].join("\n\n---\n\n"),
            inputJson: input,
            errorMessage: error instanceof Error ? error.message : 'Unknown compare error',
            sourceContextJson: {
              entrypoint: '/admin/tools/compare',
              userSource: ctx.user?.source ?? null,
            },
            createdByAdminUserId,
            notes: 'Compare tool run failed and was persisted to assistant.ai_tool_runs',
          });
        } catch (persistError) {
          console.error('Failed to persist failed compare tool run', persistError);
        }
        throw error;
      }
    }),
  analyzePrecedents: adminProcedure
    .input(z.object({
      caseDescription: z.string().min(5),
    }))
    .mutation(async ({ input, ctx }) => {
      const createdByAdminUserId = ctx.user?.platformUserId ?? null;
      const buildTitle = () => `تحليل السوابق — ${new Date().toISOString().slice(0, 19)}`;
      try {
        const result = await runAnalyzePrecedents(input.caseDescription);
        const response = {
          precedents: (result.relevantPrecedents || []).map((item, index) => ({
            title: `سابقة ${index + 1}`,
            date: "—",
            summary: item.reasoning,
            principle: item.principle,
            similarity: item.applicability,
          })),
          patterns: result.trends || [],
          recommendations: result.recommendations || [],
          raw: result,
        };

        const toolRun = await runtimeCreateAiToolRun({
          toolKey: 'precedents',
          runStatus: 'completed',
          approvalStatus: 'pending',
          title: buildTitle(),
          inputText: input.caseDescription,
          inputJson: input,
          outputText: [...(response.patterns || []), ...(response.recommendations || [])].filter(Boolean).join("\n"),
          outputJson: response,
          sourceContextJson: {
            entrypoint: '/admin/tools/precedents',
            userSource: ctx.user?.source ?? null,
          },
          createdByAdminUserId,
          notes: 'Precedents tool run persisted to assistant.ai_tool_runs',
        });

        return {
          ...response,
          toolRunId: toolRun.id,
        };
      } catch (error) {
        try {
          await runtimeCreateAiToolRun({
            toolKey: 'precedents',
            runStatus: 'failed',
            approvalStatus: 'pending',
            title: buildTitle(),
            inputText: input.caseDescription,
            inputJson: input,
            errorMessage: error instanceof Error ? error.message : 'Unknown precedents error',
            sourceContextJson: {
              entrypoint: '/admin/tools/precedents',
              userSource: ctx.user?.source ?? null,
            },
            createdByAdminUserId,
            notes: 'Precedents tool run failed and was persisted to assistant.ai_tool_runs',
          });
        } catch (persistError) {
          console.error('Failed to persist failed precedents tool run', persistError);
        }
        throw error;
      }
    }),
  predictOutcome: adminProcedure
    .input(z.object({
      caseDescription: z.string().min(10),
      party: z.enum(["plaintiff", "defendant"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const createdByAdminUserId = ctx.user?.platformUserId ?? null;
      const buildTitle = () => `توقع النتائج — ${new Date().toISOString().slice(0, 19)}`;
      try {
        const result = await predictCaseOutcome(input.caseDescription, input.party || "plaintiff");

        const predictionMap: Record<string, string> = {
          favorable: "النتيجة المتوقعة تميل لصالح الطرف المحدد",
          unfavorable: "النتيجة المتوقعة لا تميل لصالح الطرف المحدد",
          uncertain: "النتيجة المتوقعة غير محسومة وتحتاج دعمًا قانونيًا أقوى",
        };

        const factorGroups = [
          ...(result.reasoning || []).map((item) => ({ name: item, weight: Number((result.confidence || 0.5).toFixed(2)) })),
          ...(result.risks || []).map((item) => ({ name: `مخاطرة: ${item}`, weight: 0.35 })),
          ...(result.opportunities || []).map((item) => ({ name: `فرصة: ${item}`, weight: 0.65 })),
        ].slice(0, 6);

        const response = {
          probability: result.confidence,
          prediction: predictionMap[result.predictedOutcome] || predictionMap.uncertain,
          factors: factorGroups,
          similarCases: (result.supportingPrecedents || []).map((item, index) => ({
            title: `سابقة داعمة ${index + 1}`,
            outcome: item,
          })),
          recommendations: Array.isArray(result.recommendations) ? result.recommendations.join("\n• ") : "",
          raw: result,
        };

        const toolRun = await runtimeCreateAiToolRun({
          toolKey: 'predict',
          runStatus: 'completed',
          approvalStatus: 'pending',
          title: buildTitle(),
          inputText: input.caseDescription,
          inputJson: input,
          outputText: [response.prediction, response.recommendations].filter(Boolean).join("\n"),
          outputJson: response,
          sourceContextJson: {
            entrypoint: '/admin/tools/predict',
            userSource: ctx.user?.source ?? null,
          },
          createdByAdminUserId,
          notes: 'Predict tool run persisted to assistant.ai_tool_runs',
        });

        return {
          ...response,
          toolRunId: toolRun.id,
        };
      } catch (error) {
        try {
          await runtimeCreateAiToolRun({
            toolKey: 'predict',
            runStatus: 'failed',
            approvalStatus: 'pending',
            title: buildTitle(),
            inputText: input.caseDescription,
            inputJson: input,
            errorMessage: error instanceof Error ? error.message : 'Unknown predict error',
            sourceContextJson: {
              entrypoint: '/admin/tools/predict',
              userSource: ctx.user?.source ?? null,
            },
            createdByAdminUserId,
            notes: 'Predict tool run failed and was persisted to assistant.ai_tool_runs',
          });
        } catch (persistError) {
          console.error('Failed to persist failed predict tool run', persistError);
        }
        throw error;
      }
    }),
});


// ===== Mega Batch 27B — Wider Admin Backend Activation helpers =====
const adminPageBackendActivationMatrix = [
  { href: '/admin/dashboard', title: 'لوحة التحكم الرئيسية', backendRoute: 'admin.systemStats + admin.charts.*', status: 'connected', operation: 'read' },
  { href: '/admin/activity', title: 'سجل النشاط', backendRoute: 'admin.activityLog', status: 'connected', operation: 'read' },
  { href: '/admin/analytics', title: 'التحليلات والتقييمات', backendRoute: 'analytics.*', status: 'connected', operation: 'read' },
  { href: '/admin/content', title: 'إدارة المحتوى', backendRoute: 'admin.content.faqs.* + admin.content.documents.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/users', title: 'إدارة المستخدمين', backendRoute: 'admin.users.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/cache', title: 'إدارة Cache', backendRoute: 'admin.operations.cacheSnapshot', status: 'connected', operation: 'read' },
  { href: '/admin/backup', title: 'النسخ الاحتياطي', backendRoute: 'admin.operations.backupSnapshot + createBackupManifest', status: 'connected', operation: 'read/manifest' },
  { href: '/admin/integrations', title: 'التكاملات', backendRoute: 'admin.operations.integrationsSnapshot', status: 'connected', operation: 'read' },
  { href: '/admin/webhooks', title: 'Webhooks', backendRoute: 'admin.operations.webhooksSnapshot', status: 'connected', operation: 'read' },
  { href: '/admin/properties', title: 'إدارة العقارات الوقفية', backendRoute: 'properties.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/cases', title: 'إدارة القضايا الوقفية', backendRoute: 'cases.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/rulings', title: 'إدارة الأحكام القضائية', backendRoute: 'rulings.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/deeds', title: 'إدارة الحجج الوقفية', backendRoute: 'deeds.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/instructions', title: 'التعليمات الوزارية', backendRoute: 'instructions.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/waqf-categories', title: 'تصنيفات الأوقاف', backendRoute: 'waqfCategories.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/content-templates', title: 'إدارة القوالب', backendRoute: 'contentTemplates.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/home-sections', title: 'أقسام الصفحة الرئيسية', backendRoute: 'homeSections.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/notifications', title: 'الإشعارات', backendRoute: 'notifications.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/comments', title: 'إدارة التعليقات', backendRoute: 'comments.*', status: 'connected', operation: 'moderation' },
  { href: '/admin/settings', title: 'إعدادات الموقع', backendRoute: 'siteSettings.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/knowledge', title: 'إدارة قاعدة المعرفة', backendRoute: 'knowledge.*', status: 'connected', operation: 'read/write/review' },
  { href: '/admin/library', title: 'المكتبة الرقمية', backendRoute: 'digitalLibrary.list', status: 'connected', operation: 'read' },
  { href: '/admin/files', title: 'إدارة الملفات', backendRoute: 'files.*', status: 'connected', operation: 'read/link/delete-safe' },
  { href: '/admin/knowledge-dashboard', title: 'لوحة معلومات المصادر', backendRoute: 'knowledgeSources.stats/topActive/fetchActivity', status: 'connected', operation: 'read' },
  { href: '/admin/knowledge-sources', title: 'مصادر المعرفة', backendRoute: 'knowledgeSources.*', status: 'connected', operation: 'read/write/fetch-manual' },
  { href: '/admin/data-fetching', title: 'أدوات الجلب التلقائي', backendRoute: 'fetcher.*', status: 'connected', operation: 'manual/deferred' },
  { href: '/admin/fetched-content', title: 'مراجعة المحتوى المجلوب', backendRoute: 'fetchedContent.* + smartProcessing.*', status: 'connected', operation: 'review/workflow' },
  { href: '/admin/fetch-logs', title: 'سجل عمليات الجلب', backendRoute: 'fetchLogs.*', status: 'connected', operation: 'read' },
  { href: '/admin/reports', title: 'التقارير', backendRoute: 'reports.summary', status: 'connected', operation: 'read' },
  { href: '/admin/cache-analytics', title: 'إحصائيات Cache', backendRoute: 'cache.getMostFrequent + cleanExpired + updateSuggestedQuestions', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/interaction-analytics', title: 'إحصائيات التفاعل', backendRoute: 'interaction.* alias', status: 'connected', operation: 'read' },
  { href: '/admin/waqf-analytics', title: 'إحصائيات الأوقاف', backendRoute: 'waqfAnalytics.getStatistics', status: 'connected', operation: 'read' },
  { href: '/admin/roles', title: 'الأدوار', backendRoute: 'roles.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/permissions', title: 'الصلاحيات', backendRoute: 'permissions.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/system-settings', title: 'إعدادات النظام', backendRoute: 'systemSettings.*', status: 'connected', operation: 'read/write-safe' },
  { href: '/admin/platform-bridge', title: 'جسر المنصة', backendRoute: 'platformBridge.*', status: 'connected', operation: 'read-sovereign' },
];

function isDbUnavailable(error: unknown) {
  return error instanceof Error && /database not available/i.test(error.message);
}

async function getOptionalDb() {
  try {
    return await getDb();
  } catch (error) {
    console.warn('[admin-27b] Database unavailable; using safe empty-state fallback', error);
    return null;
  }
}

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return !['0', 'false', 'no', 'off', 'inactive'].includes(value.toLowerCase());
  return false;
}

function safeDate(value: any) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)
    ? raw.replace(/\s+/, 'T')
    : raw;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeRuntimeDate(value: any) {
  const d = safeDate(value);
  return d ? d.toISOString() : (value ?? null);
}

function runtimeDateTime(value: any) {
  const d = safeDate(value);
  return d ? d.getTime() : 0;
}

function inDateRange(value: any, after?: string, before?: string) {
  const d = safeDate(value);
  if (!d) return true;
  if (after) {
    const a = safeDate(after);
    if (a && d < a) return false;
  }
  if (before) {
    const b = safeDate(before);
    if (b) {
      b.setHours(23, 59, 59, 999);
      if (d > b) return false;
    }
  }
  return true;
}

function paginate<T>(rows: T[], page = 1, limit = 20) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
  const start = (safePage - 1) * safeLimit;
  return {
    rows: rows.slice(start, start + safeLimit),
    page: safePage,
    limit: safeLimit,
    total: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / safeLimit)),
  };
}

async function countTable(table: any) {
  const db = await getOptionalDb();
  if (!db) return 0;
  try {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(table as any);
    return toNumber((rows as any[])?.[0]?.count, 0);
  } catch (error) {
    console.warn('[admin-27b] countTable failed', error);
    return 0;
  }
}

async function selectAllSafe(table: any, limit = 1000) {
  const db = await getOptionalDb();
  if (!db) return [] as any[];
  try {
    return await db.select().from(table as any).limit(limit) as any[];
  } catch (error) {
    console.warn('[admin-27b] selectAllSafe failed', error);
    return [] as any[];
  }
}

async function buildDailySeries(table: any, dateField: any, days = 30, label = 'count') {
  const safeDays = Math.min(Math.max(Number(days) || 30, 1), 365);
  const rows = await selectAllSafe(table, 5000);
  const buckets = new Map<string, number>();
  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  const min = new Date();
  min.setDate(min.getDate() - safeDays);
  for (const row of rows) {
    const d = safeDate(row?.createdAt ?? row?.created_at ?? row?.updatedAt ?? row?.updated_at);
    if (!d || d < min) continue;
    const key = d.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, [label]: count }));
}

function normalizeAdminUserRow(row: any, conversationCount = 0) {
  return {
    id: row.id,
    openId: row.openId ?? row.open_id ?? null,
    name: row.name || row.email || `مستخدم #${row.id}`,
    email: row.email || '',
    loginMethod: row.loginMethod ?? row.login_method ?? null,
    role: row.role || 'user',
    isActive: toBoolean(row.isActive ?? row.is_active ?? 1),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    lastSignedIn: row.lastSignedIn ?? row.last_signed_in ?? row.createdAt ?? row.created_at ?? null,
    conversationCount,
  };
}

async function listAdminUsersInternal(input: any = {}) {
  const userRows = await selectAllSafe(users, 5000);
  const conversationRows = await selectAllSafe(conversations, 10000);
  const conversationCounts = new Map<number, number>();
  for (const conversation of conversationRows) {
    const userId = Number(conversation.userId ?? conversation.user_id ?? 0);
    if (!userId) continue;
    conversationCounts.set(userId, (conversationCounts.get(userId) || 0) + 1);
  }

  const search = String(input.search || '').trim().toLowerCase();
  const normalized = userRows
    .map((row) => normalizeAdminUserRow(row, conversationCounts.get(Number(row.id)) || 0))
    .filter((row) => !input.role || row.role === input.role)
    .filter((row) => !search || `${row.name} ${row.email} ${row.openId}`.toLowerCase().includes(search))
    .filter((row) => inDateRange(row.createdAt, input.createdAfter, input.createdBefore))
    .filter((row) => inDateRange(row.lastSignedIn, input.lastSignedInAfter, input.lastSignedInBefore))
    .sort((a, b) => `${b.createdAt || ''}`.localeCompare(`${a.createdAt || ''}`));

  const paginated = paginate(normalized, input.page, input.limit);
  return {
    users: paginated.rows,
    total: paginated.total,
    page: paginated.page,
    limit: paginated.limit,
    totalPages: paginated.totalPages,
  };
}

async function updateAdminUserInternal(userId: number, updates: any) {
  const db = await getOptionalDb();
  if (!db) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'قاعدة بيانات المستخدمين غير متاحة في هذه البيئة.' });
  await db.update(users).set(updates).where(eq(users.id, userId));
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ? normalizeAdminUserRow(rows[0]) : null;
}

async function listFaqsInternal() {
  const rows = await selectAllSafe(faqs, 5000);
  return rows
    .map((row) => ({ ...row, isActive: toBoolean(row.isActive ?? row.is_active ?? 0), viewCount: toNumber(row.viewCount ?? row.view_count, 0) }))
    .sort((a, b) => toNumber(a.order, 0) - toNumber(b.order, 0) || toNumber(b.viewCount, 0) - toNumber(a.viewCount, 0));
}

async function updateFaqInternal(id: number, updates: any) {
  const db = await getOptionalDb();
  if (!db) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'قاعدة بيانات الأسئلة الشائعة غير متاحة.' });
  const payload: any = { ...updates };
  if ('isActive' in payload) payload.isActive = payload.isActive ? 1 : 0;
  await db.update(faqs).set(payload).where(eq(faqs.id, id));
  const rows = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  return rows[0] ? { ...rows[0], isActive: toBoolean((rows[0] as any).isActive) } : null;
}

async function getAdminDashboardStats() {
  const [totalUsers, totalConversations, totalMessages, totalFAQs, totalDocuments] = await Promise.all([
    countTable(users),
    countTable(conversations),
    countTable(messages),
    countTable(faqs),
    countTable(knowledgeDocuments),
  ]);
  const toolMetrics = await runtimeGetAiToolRunMetrics().catch(() => ({ total: 0, byRunStatus: {}, byApproval: {}, byTool: {} }));
  return {
    totalUsers,
    totalConversations,
    totalMessages,
    totalFAQs,
    totalDocuments,
    totalAiToolRuns: toolMetrics.total || 0,
    activeBackendRoutes: adminPageBackendActivationMatrix.length,
  };
}

async function getFaqDistribution() {
  const rows = await listFaqsInternal();
  const byCategory = new Map<string, number>();
  for (const row of rows) byCategory.set(row.category || 'general', (byCategory.get(row.category || 'general') || 0) + 1);
  return Array.from(byCategory.entries()).map(([category, count]) => ({ category, count }));
}

async function getAdminActivityLog(input: any = {}) {
  const limit = Math.min(Math.max(Number(input.limit || 50), 1), 100);
  const type = input.type || 'all';
  const activities: any[] = [];

  if (type === 'all' || type === 'conversations') {
    const rows = await selectAllSafe(conversations, limit);
    activities.push(...rows.map((row) => ({
      id: row.id,
      type: 'conversation',
      title: row.title || `محادثة #${row.id}`,
      userName: row.userId ? `مستخدم #${row.userId}` : null,
      createdAt: row.updatedAt || row.createdAt,
    })));
  }
  if (type === 'all' || type === 'messages') {
    const rows = await selectAllSafe(messages, limit);
    activities.push(...rows.map((row) => ({
      id: row.id,
      type: 'message',
      title: String(row.content || '').slice(0, 120) || `رسالة #${row.id}`,
      userName: null,
      createdAt: row.createdAt,
    })));
  }
  if (type === 'all' || type === 'faqs') {
    const rows = await listFaqsInternal();
    activities.push(...rows.slice(0, limit).map((row) => ({
      id: row.id,
      type: 'faq',
      title: row.question || `سؤال شائع #${row.id}`,
      userName: null,
      createdAt: row.updatedAt || row.createdAt,
    })));
  }

  if (activities.length === 0) {
    const runs = await runtimeListAiToolRuns({ limit }).catch(() => []);
    activities.push(...(runs || []).map((row: any) => ({
      id: row.id,
      type: 'ai_tool_run',
      title: row.title || `تشغيل أداة ${row.tool_key}`,
      userName: row.created_by_admin_user_id ? `إداري #${row.created_by_admin_user_id}` : null,
      createdAt: row.created_at,
    })));
  }

  return activities
    .sort((a, b) => runtimeDateTime(b.createdAt) - runtimeDateTime(a.createdAt))
    .slice(0, limit)
    .map((activity) => ({
      ...activity,
      createdAt: normalizeRuntimeDate(activity.createdAt),
    }));
}

async function getAnalyticsRatingStats() {
  const rows = await selectAllSafe(messageRatings, 10000);
  const positive = rows.filter((r) => String(r.rating) === 'helpful').length;
  const negative = rows.filter((r) => String(r.rating) === 'not_helpful').length;
  const total = positive + negative;
  const positivePercentage = total ? Math.round((positive / total) * 100) : 0;
  return { total, positive, negative, positivePercentage, negativePercentage: total ? 100 - positivePercentage : 0 };
}

async function getNegativeRatingAnalysis() {
  const ratingsRows = await selectAllSafe(messageRatings, 10000);
  const messageRows = await selectAllSafe(messages, 10000);
  const byMessageId = new Map(messageRows.map((m) => [Number(m.id), m]));
  const negatives = ratingsRows.filter((r) => String(r.rating) === 'not_helpful');
  let withoutSources = 0;
  let shortResponses = 0;
  for (const rating of negatives) {
    const msg = byMessageId.get(Number(rating.messageId ?? rating.message_id));
    if (!msg?.sources) withoutSources++;
    if (String(msg?.content || '').length < 160) shortResponses++;
  }
  const commonIssues = [] as string[];
  if (withoutSources > 0) commonIssues.push('نقص المصادر');
  if (shortResponses > 0) commonIssues.push('إجابات قصيرة');
  if (negatives.length > 0 && commonIssues.length === 0) commonIssues.push('تحتاج مراجعة نوعية');
  return { totalNegative: negatives.length, withoutSources, shortResponses, commonIssues };
}

async function getFrequentUserQuestions(limit = 10) {
  const rows = await selectAllSafe(messages, 10000);
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.role !== 'user') continue;
    const content = String(row.content || '').trim();
    if (!content) continue;
    const key = content.slice(0, 260);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([content, count]) => ({ content, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.min(Math.max(Number(limit) || 10, 1), 50));
}

async function getBestRatedAnswers(limit = 10) {
  const ratingsRows = await selectAllSafe(messageRatings, 10000);
  const messageRows = await selectAllSafe(messages, 10000);
  const byMessageId = new Map(messageRows.map((m) => [Number(m.id), m]));
  const counts = new Map<number, number>();
  for (const rating of ratingsRows) {
    if (String(rating.rating) !== 'helpful') continue;
    const messageId = Number(rating.messageId ?? rating.message_id);
    counts.set(messageId, (counts.get(messageId) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([messageId, positiveRatings]) => ({ messageId, positiveRatings, content: String(byMessageId.get(messageId)?.content || '').slice(0, 300) }))
    .sort((a, b) => b.positiveRatings - a.positiveRatings)
    .slice(0, Math.min(Math.max(Number(limit) || 10, 1), 50));
}

async function getOperationsSnapshot(kind: 'cache' | 'integrations' | 'webhooks' | 'backup') {
  const settings = await runtimeGetSystemSettings().catch(() => ({} as any));
  const toolMetrics = await runtimeGetAiToolRunMetrics().catch(() => ({ total: 0, byRunStatus: {}, byApproval: {}, byTool: {} }));
  const sourceStats = await runtimeGetKnowledgeSourcesStats().catch(() => ({ totalSources: 0, activeSources: 0, successRate: 0, lastFetchDate: null }));
  const cacheStats = await import('./cache').then((m) => m.getCacheStats()).catch(() => ({ totalCached: 0, totalHits: 0, avgRating: 0, topQuestions: [] }));
  const now = new Date().toISOString();

  if (kind === 'cache') {
    return {
      generatedAt: now,
      status: 'connected',
      title: 'إدارة Cache مفعلة للقراءة التشغيلية',
      metrics: {
        totalCached: cacheStats.totalCached || 0,
        totalHits: cacheStats.totalHits || 0,
        avgRating: cacheStats.avgRating || 0,
        aiToolRuns: toolMetrics.total || 0,
      },
      topQuestions: cacheStats.topQuestions || [],
      actions: [{ key: 'cleanExpired', label: 'تنظيف المنتهي', enabled: true, mode: 'safe' }],
    };
  }

  if (kind === 'integrations') {
    const envChecks = [
      { key: 'supabase', label: 'Supabase Assistant Runtime', configured: !!(process.env.PWF_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) },
      { key: 'llm', label: 'LLM Provider', configured: !!settings.llmEnabled && settings.llmProvider !== 'disabled' },
      { key: 'email', label: 'SMTP Email', configured: !!settings.emailEnabled },
      { key: 'fetching', label: 'Knowledge Fetchers', configured: (sourceStats.totalSources || 0) > 0 },
    ];
    return {
      generatedAt: now,
      status: 'connected',
      title: 'التكاملات مربوطة بقراءة إعدادات النظام والمصادر',
      metrics: { configured: envChecks.filter((x) => x.configured).length, total: envChecks.length, activeSources: sourceStats.activeSources || 0, successRate: sourceStats.successRate || 0 },
      integrations: envChecks,
    };
  }

  if (kind === 'webhooks') {
    const events = [
      { event: 'ai_tool_run.completed', source: 'assistant.ai_tool_runs', enabled: true, mode: 'internal_event' },
      { event: 'ai_tool_run.approved', source: 'assistant.ai_tool_run_events', enabled: true, mode: 'internal_event' },
      { event: 'knowledge_document.created', source: 'assistant.knowledge_documents', enabled: true, mode: 'internal_event' },
      { event: 'fetched_content.approved', source: 'assistant.fetched_content', enabled: true, mode: 'internal_event' },
    ];
    return {
      generatedAt: now,
      status: 'connected',
      title: 'Webhooks مفعلة كخريطة أحداث داخلية دون إرسال خارجي تلقائي',
      metrics: { totalEvents: events.length, externalDispatch: 0, internalEvents: events.length },
      events,
    };
  }

  return {
    generatedAt: now,
    status: 'connected',
    title: 'النسخ الاحتياطي مفعل كـ manifest حوكمي آمن',
    metrics: {
      knowledgeDocuments: await countTable(knowledgeDocuments),
      knowledgeSources: await countTable(knowledgeSources),
      fetchedContent: await countTable(fetchedContent),
      fetchLogs: await countTable(fetchLogs),
      aiToolRuns: toolMetrics.total || 0,
    },
    includedScopes: ['assistant.knowledge_documents', 'assistant.knowledge_sources', 'assistant.fetched_content', 'assistant.ai_tool_runs', 'runtime settings'],
  };
}


const adminRouter = router({
  backendActivationSnapshot: adminProcedure.query(async () => {
    const [stats, toolSnapshot] = await Promise.all([
      getAdminDashboardStats(),
      runtimeGetAiToolBackendActivationSnapshot().catch(() => null),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      stats,
      records: adminPageBackendActivationMatrix.map((record) => ({
        ...record,
        statusLabel: record.status === 'connected' ? 'مربوط فعليًا' : 'بانتظار الربط',
      })),
      aiTools: toolSnapshot,
    };
  }),
  systemStats: adminProcedure.query(async () => {
    return await getAdminDashboardStats();
  }),
  charts: router({
    userGrowth: adminProcedure
      .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => buildDailySeries(users, users.createdAt, input?.days || 30, 'users')),
    conversationActivity: adminProcedure
      .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => buildDailySeries(conversations, conversations.createdAt, input?.days || 7, 'count')),
    faqDistribution: adminProcedure.query(async () => getFaqDistribution()),
  }),
  activityLog: adminProcedure
    .input(z.object({ type: z.enum(['all','conversations','messages','faqs']).optional(), limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => getAdminActivityLog(input || {})),
  users: router({
    list: adminProcedure
      .input(z.object({
        search: z.string().optional(),
        role: z.enum(['admin','user']).optional(),
        createdAfter: z.string().optional(),
        createdBefore: z.string().optional(),
        lastSignedInAfter: z.string().optional(),
        lastSignedInBefore: z.string().optional(),
        page: z.number().min(1).optional(),
        limit: z.number().min(1).max(100).optional(),
      }).optional())
      .query(async ({ input }) => listAdminUsersInternal(input || {})),
    getActivity: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const conversationRows = (await selectAllSafe(conversations, 5000)).filter((row) => Number(row.userId) === input.userId);
        const conversationIds = new Set(conversationRows.map((row) => Number(row.id)));
        const messageRows = (await selectAllSafe(messages, 10000)).filter((row) => conversationIds.has(Number(row.conversationId)));
        return {
          conversationCount: conversationRows.length,
          messageCount: messageRows.length,
          averageRating: 0,
          lastActivity: [...conversationRows, ...messageRows].map((row) => row.updatedAt || row.createdAt).filter(Boolean).sort().reverse()[0] || null,
          items: [
            ...conversationRows.slice(0, 10).map((row) => ({ type: 'conversation', title: row.title || `محادثة #${row.id}`, createdAt: row.createdAt })),
            ...messageRows.slice(0, 10).map((row) => ({ type: 'message', title: String(row.content || '').slice(0, 120), createdAt: row.createdAt })),
          ].sort((a, b) => `${b.createdAt || ''}`.localeCompare(`${a.createdAt || ''}`)).slice(0, 15),
        };
      }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(['admin','user']) }))
      .mutation(async ({ input }) => updateAdminUserInternal(input.userId, { role: input.role })),
    toggleStatus: adminProcedure
      .input(z.object({ userId: z.number(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const current = (await listAdminUsersInternal({ limit: 5000 })).users.find((u: any) => u.id === input.userId);
        const next = input.isActive ?? !current?.isActive;
        return updateAdminUserInternal(input.userId, { isActive: next ? 1 : 0 });
      }),
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const updated = await updateAdminUserInternal(input.userId, { isActive: 0 });
        return { success: true, softDeleted: true, user: updated };
      }),
    bulkUpdateRole: adminProcedure
      .input(z.object({ userIds: z.array(z.number()), role: z.enum(['admin','user']) }))
      .mutation(async ({ input }) => {
        let count = 0;
        for (const userId of input.userIds) { await updateAdminUserInternal(userId, { role: input.role }); count++; }
        return { count };
      }),
    bulkToggleStatus: adminProcedure
      .input(z.object({ userIds: z.array(z.number()), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        let count = 0;
        for (const userId of input.userIds) { await updateAdminUserInternal(userId, { isActive: input.isActive ? 1 : 0 }); count++; }
        return { count };
      }),
    bulkDelete: adminProcedure
      .input(z.object({ userIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        let count = 0;
        for (const userId of input.userIds) { await updateAdminUserInternal(userId, { isActive: 0 }); count++; }
        return { count, softDeleted: true };
      }),
  }),
  content: router({
    faqs: router({
      list: adminProcedure.input(z.object({}).optional()).query(async () => listFaqsInternal()),
      update: adminProcedure
        .input(z.object({ id: z.number(), question: z.string().optional(), answer: z.string().optional(), category: z.enum(['general','conditions','types','management','legal','jurisprudence']).optional(), isActive: z.boolean().optional() }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          return updateFaqInternal(id, updates);
        }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await updateFaqInternal(input.id, { isActive: false });
        return { success: true, softDeleted: true };
      }),
    }),
    documents: router({
      list: adminProcedure.input(z.object({}).optional()).query(async () => {
        const rows = await runtimeGetKnowledgeDocuments({}).catch(() => []);
        return (rows || []).map((row: any) => ({ ...row, isActive: toBoolean(row.isActive ?? row.is_active ?? row.status === 'approved') }));
      }),
      update: adminProcedure
        .input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), category: z.enum(['law','jurisprudence','majalla','historical','administrative','reference']).optional(), source: z.string().optional(), isActive: z.boolean().optional() }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const payload: any = { ...updates };
          if ('isActive' in payload) payload.isActive = payload.isActive ? 1 : 0;
          return await runtimeUpdateKnowledgeDocument(id, payload);
        }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        return await runtimeUpdateKnowledgeDocument(input.id, { isActive: 0 } as any);
      }),
    }),
  }),
  operations: router({
    cacheSnapshot: adminProcedure.query(async () => getOperationsSnapshot('cache')),
    integrationsSnapshot: adminProcedure.query(async () => getOperationsSnapshot('integrations')),
    webhooksSnapshot: adminProcedure.query(async () => getOperationsSnapshot('webhooks')),
    backupSnapshot: adminProcedure.query(async () => getOperationsSnapshot('backup')),
    maintenanceSnapshot: adminProcedure.query(async () => {
      const [databaseHealth, llmHealth, cache, settings] = await Promise.all([
        checkDatabaseHealth(),
        checkLlmProviderHealth(),
        getOperationsSnapshot('cache'),
        runtimeGetSystemSettings().catch(() => ({})),
      ]);
      return {
        generatedAt: new Date().toISOString(),
        status: 'connected',
        server: { running: true, uptimeSeconds: Math.floor(process.uptime()), environment: process.env.NODE_ENV || 'development' },
        database: databaseHealth,
        llm: llmHealth,
        readiness: { ready: databaseHealth.available && llmHealth.available, blockers: [
          ...(databaseHealth.available ? [] : ['database_unavailable']),
          ...(llmHealth.available ? [] : ['llm_unavailable']),
        ] },
        cache,
        settings,
      };
    }),
    auditSnapshot: adminProcedure.query(async () => ({
      generatedAt: new Date().toISOString(),
      status: 'connected',
      activities: await getAdminActivityLog({ limit: 25, type: 'all' }),
      sources: ['conversations', 'messages', 'faqs', 'ai_tool_runs'],
    })),
    securitySnapshot: adminProcedure.query(async () => {
      const [databaseHealth, llmHealth, settings] = await Promise.all([
        checkDatabaseHealth(),
        checkLlmProviderHealth(),
        runtimeGetSystemSettings().catch(() => ({})),
      ]);
      return {
        generatedAt: new Date().toISOString(),
        status: 'connected',
        settings,
        counts: {
          users: await countTable(users),
          roles: await countTable(roles),
          permissions: await countTable(permissions),
          rolePermissions: await countTable(rolePermissions),
        },
        health: { database: databaseHealth, llm: llmHealth, ready: databaseHealth.available && llmHealth.available },
        guards: ['adminProcedure', 'protectedProcedure', 'role-aware local bootstrap', 'providerHealthGate', 'databaseHealthGate'],
      };
    }),
    apiKeysSnapshot: adminProcedure.query(async () => ({
      generatedAt: new Date().toISOString(),
      status: 'connected',
      exposedSecrets: 0,
      providers: [
        { key: 'supabase', configured: !!(process.env.PWF_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL), visible: false },
        { key: 'llm', configured: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OLLAMA_BASE_URL), visible: false },
        { key: 'smtp', configured: !!(process.env.SMTP_HOST || process.env.EMAIL_HOST), visible: false },
      ],
      mode: 'read_metadata_only_no_secret_values',
    })),
    createBackupManifest: adminProcedure.mutation(async ({ ctx }) => {
      const snapshot = await getOperationsSnapshot('backup');
      return {
        manifestId: `PWF-BACKUP-MANIFEST-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.platformUserId ?? ctx.user?.id ?? null,
        mode: 'manifest_only_no_dump',
        snapshot,
      };
    }),
    setMaintenanceMode: adminProcedure
      .input(z.object({ enabled: z.boolean(), message: z.string().optional() }))
      .mutation(async ({ input }) => {
        return await runtimeUpdateSystemSettings({ maintenanceMode: input.enabled, maintenanceMessage: input.message ?? '' });
      }),
  }),
});

const healthRouter = router({
  readiness: publicProcedure.query(async () => buildPublicReadinessHealth()),
  database: adminProcedure.query(async () => checkDatabaseHealth()),
  supabase: adminProcedure.query(async () => checkSupabaseHealth()),
  databaseConfig: adminProcedure.query(async () => {
    const config = resolveDatabaseConfig();
    return {
      configured: config.configured,
      source: config.source,
      provider: config.provider,
      dialect: config.dialect,
      runtimeCompatible: config.runtimeCompatible,
      redactedUrl: config.redactedUrl,
      reason: config.reason || null,
      acceptedKeys: [
        "PLATFORM_SUPABASE_URL + PLATFORM_SUPABASE_SERVICE_ROLE_KEY",
        "PLATFORM_SUPABASE_URL + PLATFORM_SUPABASE_ANON_KEY",
        "PWF_SUPABASE_URL + PWF_SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
        "VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY",
        "DATABASE_URL",
        "MYSQL_DATABASE_URL",
        "DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD",
        "MYSQL_HOST + MYSQL_PORT + MYSQL_DATABASE + MYSQL_USER + MYSQL_PASSWORD",
      ],
    };
  }),
  llm: publicProcedure.query(async () => checkLlmProviderHealth()),
});

const analyticsRouter = router({
  getRatingStats: adminProcedure.query(async () => getAnalyticsRatingStats()),
  analyzeNegativeRatings: adminProcedure.query(async () => getNegativeRatingAnalysis()),
  getFrequentQuestions: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ input }) => getFrequentUserQuestions(input?.limit || 10)),
  getBestAnswers: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ input }) => getBestRatedAnswers(input?.limit || 10)),
  getImprovementSuggestions: adminProcedure.query(async () => {
    const stats = await getAnalyticsRatingStats();
    const negative = await getNegativeRatingAnalysis();
    const suggestions = [] as string[];
    if (stats.total === 0) suggestions.push('ابدأ بجمع تقييمات المستخدمين من واجهة الشات قبل إصدار حكم جودة نهائي.');
    if (negative.withoutSources > 0) suggestions.push('إلزام الإجابات الحساسة بمصادر أو مراجع معرفة قبل عرضها للمستخدم.');
    if (negative.shortResponses > 0) suggestions.push('رفع الحد الأدنى لطول الإجابة في المسائل القانونية والوقفية المعقدة.');
    if (stats.negativePercentage > 25) suggestions.push('فتح مراجعة نوعية للتقييمات السلبية قبل توسيع الاعتماد.');
    if (suggestions.length === 0) suggestions.push('استمر بالمراجعة الدورية وربط النتائج المعتمدة بقاعدة المعرفة.');
    return { suggestions };
  }),
});


// ===== Mega Batch 27D — Remaining Backend Pending Closure helpers =====
const dbMutationUnavailableMessage = 'قاعدة البيانات التشغيلية غير متاحة؛ تم منع عملية الكتابة بدل تنفيذ إجراء وهمي.';

function normalizeDbDate(value: any) {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 19).replace('T', ' ');
  }
  return value;
}

function compactPayload(input: any) {
  const out: any = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (key === 'id' || key === 'data') continue;
    if (value === undefined || value === '') continue;
    if (value instanceof Date) out[key] = normalizeDbDate(value);
    else out[key] = value;
  }
  return out;
}

function inputPatch(input: any) {
  const raw = input?.data && typeof input.data === 'object' ? input.data : input;
  return compactPayload(raw);
}

function withActor(payload: any, ctx: any) {
  const createdBy = ctx?.user?.id ?? ctx?.user?.platformUserId ?? 1;
  return { ...payload, createdBy };
}

function asTrpcDbError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error || 'unknown error');
  if (/database not available|database connection failed/i.test(message)) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: dbMutationUnavailableMessage });
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
}

const safeDbReadFallbackWarnings = new Map<string, number>();

function getRuntimeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error || 'unknown runtime read error');
}

function isExpectedLocalDbUnavailable(error: unknown): boolean {
  return /database not available|database connection failed/i.test(getRuntimeErrorMessage(error));
}

function warnSafeDbReadFallback(error: unknown): void {
  const message = getRuntimeErrorMessage(error);
  const expectedLocalFallback = isExpectedLocalDbUnavailable(error);
  const key = `${expectedLocalFallback ? 'local-db-unavailable' : 'read-fallback'}:${message}`;
  const count = (safeDbReadFallbackWarnings.get(key) ?? 0) + 1;
  safeDbReadFallbackWarnings.set(key, count);

  if (count === 1) {
    const prefix = expectedLocalFallback
      ? '[MB27F] Local bootstrap DB read fallback'
      : '[MB27F] Runtime read fallback';
    console.warn(`${prefix}: ${message}. A safe fallback response was returned.`);
    return;
  }

  if (count === 5) {
    console.warn(`[MB27F] Repeated safe read fallback suppressed after ${count} occurrences: ${message}`);
  }
}

async function safeDbRead<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    warnSafeDbReadFallback(error);
    return fallback;
  }
}

async function safeDbWrite<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (error) { return asTrpcDbError(error); }
}

async function updateTableByIdSafe(table: any, id: number, patch: any) {
  const db = await getOptionalDb();
  if (!db) throw new Error('Database not available');
  await db.update(table).set(patch).where(eq(table.id, id));
  const rows = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return (rows as any[])?.[0] ?? null;
}

async function deleteTableByIdSafe(table: any, id: number, softField?: string) {
  const db = await getOptionalDb();
  if (!db) throw new Error('Database not available');
  if (softField) {
    await db.update(table).set({ [softField]: 0 }).where(eq(table.id, id));
    return { success: true, softDeleted: true };
  }
  await db.delete(table).where(eq(table.id, id));
  return { success: true };
}

const genericIdInput = z.object({ id: z.number() });
const genericUpdateInput = z.object({ id: z.number(), data: z.any().optional() }).passthrough();

const dashboardRouter = router({
  stats: adminProcedure.query(async () => getAdminDashboardStats()),
});

const searchRouter = router({
  query: publicProcedure.input(z.any().optional()).query(async ({ input }) => {
    const q = String(input?.query ?? input?.search ?? '').trim().toLowerCase();
    const docs = await runtimeGetKnowledgeDocuments({}).catch(() => []);
    const rows = (docs || []).filter((doc: any) => !q || `${doc.title || ''} ${doc.content || ''} ${doc.tags || ''}`.toLowerCase().includes(q));
    return rows.slice(0, Number(input?.limit || 20)).map((doc: any) => ({ ...doc, type: 'knowledge_document' }));
  }),
});

const advancedSearchRouter = router({
  advanced: publicProcedure.input(z.any().optional()).query(async ({ input }) => {
    const q = String(input?.query ?? input?.search ?? '').trim().toLowerCase();
    const category = input?.category && input.category !== 'all' ? String(input.category) : null;
    const docs = await runtimeGetKnowledgeDocuments({ category: category || undefined }).catch(() => []);
    const mapped = (docs || [])
      .filter((doc: any) => !q || `${doc.title || ''} ${doc.content || ''} ${doc.tags || ''} ${doc.source || ''}`.toLowerCase().includes(q))
      .slice(0, Number(input?.limit || 50))
      .map((doc: any) => ({
        id: doc.id,
        type: 'knowledge',
        title: doc.title,
        subtitle: doc.category || doc.source || '',
        description: String(doc.content || '').slice(0, 220),
        status: doc.status || (doc.isActive ? 'active' : undefined),
        createdAt: doc.createdAt || doc.created_at || new Date().toISOString(),
        url: `/knowledge/${doc.id}`,
        raw: doc,
      }));
    return { total: mapped.length, results: mapped };
  }),
});

const contactRouter = router({
  send: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    const db = await getOptionalDb();
    if (!db) return { success: true, stored: false, mode: 'local_no_db', message: 'تم استلام الرسالة محليًا دون حفظ قاعدة بيانات.' };
    const { contactMessages } = await import('../drizzle/schema');
    await db.insert(contactMessages).values({
      name: input?.name || 'زائر',
      email: input?.email || 'unknown@example.local',
      subject: input?.subject || 'رسالة تواصل',
      message: input?.message || input?.content || '',
      userId: null,
      status: 'new',
    } as any);
    return { success: true, stored: true };
  }),
});

const faqsRouter = router({
  list: publicProcedure.input(z.any().optional()).query(async ({ input }) => safeDbRead(() => dbOps.getFAQs({ category: input?.category, isActive: input?.isActive ?? 1 } as any), [])),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createFAQ(withActor({ ...compactPayload(input), category: input?.category || 'general', order: input?.order ?? 0, isActive: input?.isActive ?? 1 }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(() => dbOps.updateFAQ(input.id, inputPatch(input) as any))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteFAQ(input.id); return { success: true }; })),
  incrementView: publicProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbRead(async () => { await dbOps.incrementFAQViewCount(input.id); return { success: true, skipped: false }; }, { success: true, skipped: true })),
  generateFromFrequentQuestions: adminProcedure.input(z.any().optional()).mutation(async ({ input }) => {
    const questions = await import('./cache').then((m) => m.getMostFrequentQuestions(input?.limit || 12)).catch(() => []);
    return { generated: 0, candidates: questions, message: 'تم تجهيز مرشحات الأسئلة من Cache؛ الاعتماد النهائي يدوي.' };
  }),
});

const propertiesRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => safeDbRead(() => dbOps.getWaqfProperties(input), [])),
  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => safeDbRead(() => dbOps.getWaqfPropertyById(input.id), null as any)),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createWaqfProperty(withActor({ ...compactPayload(input), propertyType: input?.propertyType || input?.type || 'other', waqfType: input?.waqfType || 'charitable', status: input?.status || 'active', governorate: input?.governorate || 'غير محدد', city: input?.city || 'غير محدد' }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.updateWaqfProperty(input.id, inputPatch(input) as any); return await dbOps.getWaqfPropertyById(input.id); })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteWaqfProperty(input.id); return { success: true, softDeleted: true }; })),
});

const casesRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => safeDbRead(() => dbOps.getWaqfCases(input), [])),
  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => safeDbRead(() => dbOps.getWaqfCaseById(input.id), null as any)),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createWaqfCase(withActor({ ...compactPayload(input), description: input?.description || input?.summary || '', caseType: input?.caseType || 'other', status: input?.status || 'pending', filingDate: normalizeDbDate(input?.filingDate) }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.updateWaqfCase(input.id, inputPatch(input) as any); return await dbOps.getWaqfCaseById(input.id); })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteWaqfCase(input.id); return { success: true, softDeleted: true }; })),
});

const rulingsRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => safeDbRead(() => dbOps.getJudicialRulings(input), [])),
  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => safeDbRead(() => dbOps.getJudicialRulingById(input.id), null as any)),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createJudicialRuling(withActor({ ...compactPayload(input), rulingDate: normalizeDbDate(input?.rulingDate), rulingType: input?.rulingType || 'initial', subject: input?.subject || input?.title || 'غير محدد', summary: input?.summary || '' }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.updateJudicialRuling(input.id, inputPatch(input) as any); return await dbOps.getJudicialRulingById(input.id); })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteJudicialRuling(input.id); return { success: true }; })),
});

const deedsRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => safeDbRead(() => dbOps.getWaqfDeeds(input), [])),
  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => safeDbRead(() => dbOps.getWaqfDeedById(input.id), null as any)),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createWaqfDeed(withActor({ ...compactPayload(input), deedDate: normalizeDbDate(input?.deedDate), waqfType: input?.waqfType || 'charitable', beneficiaries: input?.beneficiaries || '', propertyDescription: input?.propertyDescription || '', propertyLocation: input?.propertyLocation || '' }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.updateWaqfDeed(input.id, inputPatch(input) as any); return await dbOps.getWaqfDeedById(input.id); })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteWaqfDeed(input.id); return { success: true }; })),
});

const instructionsRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => safeDbRead(() => dbOps.getMinisterialInstructions(input), [])),
  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => safeDbRead(() => dbOps.getMinisterialInstructionById(input.id), null as any)),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createMinisterialInstruction(withActor({ ...compactPayload(input), issueDate: normalizeDbDate(input?.issueDate), effectiveDate: normalizeDbDate(input?.effectiveDate), expiryDate: normalizeDbDate(input?.expiryDate), type: input?.type || 'instruction', category: input?.category || 'general' }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.updateMinisterialInstruction(input.id, inputPatch(input) as any); return await dbOps.getMinisterialInstructionById(input.id); })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteMinisterialInstruction(input.id); return { success: true, softDeleted: true }; })),
});

const waqfCategoriesRouter = router({
  list: publicProcedure.query(async () => safeDbRead(() => dbOps.getWaqfCategories(), [])),
  getPropertiesCount: adminProcedure.query(async () => safeDbRead(() => dbOps.getWaqfPropertiesCountByCategory(), [])),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createWaqfCategory(withActor({ ...compactPayload(input), name: input?.name || input?.nameAr || 'category', nameAr: input?.nameAr || input?.name || 'تصنيف', order: input?.order ?? 0, isActive: input?.isActive ?? 1 }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.updateWaqfCategory(input.id, inputPatch(input) as any); return await dbOps.getWaqfCategoryById(input.id); })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteWaqfCategory(input.id); return { success: true, softDeleted: true }; })),
});

const waqfAnalyticsRouter = router({
  getStatistics: adminProcedure.query(async () => safeDbRead(() => dbOps.getWaqfStatistics(), { totalWaqfs: 0, totalCategories: 0, waqfsByCategory: [], waqfsByType: [], waqfsByStatus: [], waqfsByGovernorate: [] } as any)),
});

const homeSectionsRouter = router({
  listPublished: publicProcedure.query(async () => safeDbRead(() => dbOps.getAllHomeSections(), [])),
  list: adminProcedure.query(async () => safeDbRead(() => dbOps.getAllHomeSectionsAdmin(), [])),
  create: adminProcedure.input(z.any()).mutation(async ({ input }) => safeDbWrite(() => dbOps.createHomeSection({ ...compactPayload(input), title: input?.title || 'قسم جديد', content: input?.content || '', type: input?.type || 'custom', displayOrder: input?.displayOrder ?? input?.order ?? 0, order: input?.order ?? input?.displayOrder ?? 0, isVisible: input?.isVisible ?? 1 } as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(() => dbOps.updateHomeSection(input.id, inputPatch(input) as any))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteHomeSection(input.id); return { success: true }; })),
  toggleVisibility: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => {
    const section = await dbOps.getHomeSectionById(input.id);
    return await dbOps.updateHomeSection(input.id, { isVisible: section?.isVisible ? 0 : 1 } as any);
  })),
  reorder: adminProcedure.input(z.object({ sections: z.array(z.object({ id: z.number(), displayOrder: z.number().optional(), order: z.number().optional() }).passthrough()) })).mutation(async ({ input }) => safeDbWrite(async () => {
    const updated: any[] = [];
    for (const section of input.sections) updated.push(await dbOps.updateHomeSection(section.id, { displayOrder: section.displayOrder ?? section.order ?? 0, order: section.order ?? section.displayOrder ?? 0 } as any));
    return { success: true, updated };
  })),
});

const contentTemplatesRouter = router({
  list: adminProcedure.query(async () => safeDbRead(() => dbOps.getAllContentTemplates(), [])),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(() => dbOps.createContentTemplate(withActor({ ...compactPayload(input), name: input?.name || 'template', nameAr: input?.nameAr || input?.name || 'قالب', type: input?.type || 'dashboard', sections: typeof input?.sections === 'string' ? input.sections : JSON.stringify(input?.sections || []), isActive: input?.isActive ?? 1 }, ctx) as any))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(() => dbOps.updateContentTemplate(input.id, inputPatch(input) as any))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteContentTemplate(input.id); return { success: true }; })),
  clone: adminProcedure.input(genericIdInput).mutation(async ({ input, ctx }) => safeDbWrite(async () => {
    const row = await dbOps.getContentTemplateById(input.id);
    if (!row) throw new Error('Template not found');
    const { id, createdAt, updatedAt, ...rest } = row as any;
    return await dbOps.createContentTemplate(withActor({ ...rest, name: `${rest.name || 'template'} copy`, nameAr: `${rest.nameAr || rest.name || 'قالب'} - نسخة` }, ctx) as any);
  })),
  incrementUsage: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.incrementContentTemplateUsage(input.id); return { success: true }; })),
});

const notificationsRouter = router({
  getAll: adminProcedure.query(async () => selectAllSafe(notifications, 500)),
  create: adminProcedure.input(z.any()).mutation(async ({ input, ctx }) => safeDbWrite(async () => {
    const db = await getOptionalDb();
    if (!db) throw new Error('Database not available');
    const typeMap: Record<string, string> = { info: 'announcement', success: 'update', warning: 'alert', error: 'system' };
    await db.insert(notifications).values({
      title: input?.title || 'إشعار',
      content: input?.message || input?.content || '',
      type: (typeMap[input?.type] || input?.type || 'announcement') as any,
      targetAudience: input?.targetUserIds?.length ? 'specific' : 'all',
      targetUserIds: input?.targetUserIds ? JSON.stringify(input.targetUserIds) : null,
      status: 'sent',
      sentCount: input?.targetUserIds?.length || 0,
      readCount: 0,
      createdBy: ctx.user?.id || 1,
      userId: input?.targetUserIds?.[0] || null,
    } as any);
    return { success: true };
  })),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(() => deleteTableByIdSafe(notifications, input.id))),
});

const commentsRouter = router({
  getAll: adminProcedure.query(async () => {
    const rows = await selectAllSafe(comments, 1000);
    return rows.map((row: any) => ({ ...row, status: row.isApproved ? 'approved' : 'pending', userName: row.userId ? `مستخدم #${row.userId}` : null }));
  }),
  approve: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(() => updateTableByIdSafe(comments, input.id, { isApproved: 1 }))),
  reject: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(() => updateTableByIdSafe(comments, input.id, { isApproved: 0 }))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(() => deleteTableByIdSafe(comments, input.id))),
});

const reportsRouter = router({
  summary: adminProcedure.query(async () => ({ generatedAt: new Date().toISOString(), dashboard: await getAdminDashboardStats(), waqf: await dbOps.getWaqfStatistics().catch(() => null) })),
});

const digitalLibraryRouter = router({
  list: publicProcedure.input(z.any().optional()).query(async ({ input }) => runtimeGetKnowledgeDocuments(input || {}).catch(() => [])),
});

const filesRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => {
    if (input?.documentId) return runtimeGetDocumentFiles(input.documentId).catch(() => []);
    return selectAllSafe(files, 1000);
  }),
  upload: adminProcedure.input(z.any()).mutation(async ({ input }) => safeDbWrite(async () => runtimeAddDocumentFile({ documentId: input?.documentId ?? 0, fileUrl: input?.fileUrl || input?.url || '', fileType: input?.fileType || 'other', fileName: input?.fileName || input?.name || 'file', fileSize: input?.fileSize || null, language: input?.language || null, extractedText: input?.extractedText || null } as any))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await runtimeDeleteDocumentFile(input.id); return { success: true }; })),
  linkToEntity: adminProcedure.input(z.any()).mutation(async ({ input }) => safeDbWrite(() => updateTableByIdSafe(files, input.id, { linkedEntityType: input.entityType || 'none', linkedEntityId: input.entityId || null }))),
  unlinkFromEntity: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(() => updateTableByIdSafe(files, input.id, { linkedEntityType: 'none', linkedEntityId: null }))),
});

const fetchLogsRouter = router({
  list: adminProcedure.input(z.any().optional()).query(async ({ input }) => runtimeGetFetchLogs(input || {}).catch(() => [])),
  getStats: adminProcedure.input(z.any().optional()).query(async () => {
    const logs = await runtimeGetFetchLogs({}).catch(() => []);
    const total = logs.length;
    return { total, success: logs.filter((l: any) => l.status === 'success').length, failed: logs.filter((l: any) => l.status === 'failed').length, running: logs.filter((l: any) => l.status === 'running').length };
  }),
});

const fetcherRouter = router({
  getStats: adminProcedure.query(async () => runtimeGetKnowledgeSourcesStats().catch(() => ({ totalSources: 0, activeSources: 0, totalItems: 0, successRate: 0 }))),
  getRecentLogs: adminProcedure.input(z.any().optional()).query(async ({ input }) => runtimeGetFetchLogs({ limit: input?.limit || 5 }).catch(() => [])),
  fetchAll: adminProcedure.mutation(async ({ ctx }) => safeDbWrite(async () => ({ success: true, mode: 'queued_placeholder', createdBy: ctx.user?.id ?? null, note: 'تم منع الجلب الشبكي التلقائي في 27D؛ استخدم مسار مصادر المعرفة المعتمد للتشغيل الفعلي.' }))),
  fetchWikipedia: adminProcedure.input(z.any().optional()).mutation(async ({ input }) => ({ success: true, mode: 'manual_required', source: 'wikipedia', input })),
  fetchNews: adminProcedure.input(z.any().optional()).mutation(async ({ input }) => ({ success: true, mode: 'manual_required', source: 'news', input })),
  fetchPDF: adminProcedure.input(z.any().optional()).mutation(async ({ input }) => ({ success: true, mode: 'manual_required', source: 'pdf', input })),
});

const knowledgeSearchRouter = router({
  search: adminProcedure.input(z.any()).mutation(async ({ input }) => {
    const q = String(input?.q || input?.query || input?.text || '').trim().toLowerCase();
    const category = input?.category && input.category !== '__all_categories__' ? String(input.category) : '';
    const sourceType = input?.sourceType && input.sourceType !== '__all_source_types__' ? String(input.sourceType) : '';
    const tagTerms = String(input?.tags || '')
      .split(',')
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean);
    const limit = Math.max(1, Math.min(Number(input?.limit || 20), 100));

    const docs = await runtimeGetKnowledgeDocuments({}).catch(() => []);
    const rows = (docs || []).filter((doc: any) => {
      const haystack = `${doc.title || ''} ${doc.content || ''} ${doc.summary || ''} ${doc.tags || ''} ${doc.source || ''}`.toLowerCase();
      const metadata = doc.metadataJson || doc.metadata_json || {};
      const docSourceType = String(doc.sourceType || doc.source_type || metadata.source_type || '').toLowerCase();
      const docCategory = String(doc.category || '').toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (category && docCategory !== category.toLowerCase()) return false;
      if (sourceType && docSourceType !== sourceType.toLowerCase()) return false;
      if (tagTerms.length > 0 && !tagTerms.every((term) => haystack.includes(term))) return false;
      return true;
    });

    const results = rows.slice(0, limit).map((doc: any) => {
      const citations = Array.isArray(doc.citations) ? doc.citations : [];
      const trust = applyTrustMetadata(doc).trust;
      return {
        ...doc,
        chunkText: doc.summary || String(doc.content || '').slice(0, 500),
        url: `/knowledge/${doc.id}`,
        status: doc.status || (doc.isActive ? 'approved' : 'draft'),
        isChatEligible: Boolean(doc.isChatEligible ?? doc.is_chat_eligible ?? doc.isActive),
        citationsCount: typeof doc.citationsCount === 'number' ? doc.citationsCount : citations.length,
        authorityLevel: trust.authorityLevel,
        citationVerificationStatus: trust.citationStatus,
        visibilityScope: trust.visibilityScope,
        contentStatus: trust.contentStatus,
        trustEligible: trust.allowForChat,
        trustReasons: trust.reasons,
      };
    });

    return {
      total: rows.length,
      returned: results.length,
      results,
      filters: { q, category: category || null, sourceType: sourceType || null, tags: tagTerms, limit },
      mode: 'assistant_knowledge_documents_runtime_search',
    };
  }),
  generateChunksApproved: adminProcedure.mutation(async () => ({
    success: true,
    created: 0,
    generated: 0,
    skipped: 0,
    mode: 'deferred_safe_no_destructive_chunk_generation',
  })),
});

const reviewActorId = (ctx: any) => {
  const value = ctx?.user?.authUserId || ctx?.user?.platformUserId || null;
  if (!value) throw new TRPCError({ code: 'FORBIDDEN', message: 'لا توجد هوية Supabase مهيأة للمراجع الحالي.' });
  return String(value);
};

type KnowledgeScopeRequirement = 'review' | 'publish';

async function getKnowledgeAccessSnapshot(ctx: any) {
  const actorId = ctx?.user?.authUserId || ctx?.user?.platformUserId || null;
  if (!actorId) {
    return {
      authUserId: null,
      canReview: false,
      canPublish: false,
      activeAssignments: [],
      reason: 'supabase_identity_missing',
      mode: 'assistant_knowledge_scope_server_guard_v1',
    };
  }
  return runtimeGetKnowledgeOperationAccess(String(actorId));
}

async function requireKnowledgeScope(ctx: any, requirement: KnowledgeScopeRequirement, operation: string): Promise<string> {
  const actorId = reviewActorId(ctx);
  try {
    await runtimeAssertKnowledgeOperationAccess(actorId, requirement);
    return actorId;
  } catch (error: any) {
    void runtimeRecordKnowledgeOperationDenied({
      authUserId: actorId,
      requirement,
      operation,
    });
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: requirement === 'publish'
        ? 'تم رفض الإجراء: تتطلب هذه العملية صلاحية assistant.publish.'
        : 'تم رفض الإجراء: تتطلب هذه العملية صلاحية assistant.review.',
      cause: error,
    });
  }
}

const knowledgeTrustRouter = router({
  /** Safe capability handshake: no sensitive review data is returned by this endpoint. */
  access: adminProcedure.query(async ({ ctx }) => ({
    ...(await getKnowledgeAccessSnapshot(ctx)),
    maturityPolicy: getAssistantMaturityPolicySnapshot(),
  })),
  snapshot: adminProcedure.query(async ({ ctx }) => {
    await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.snapshot');
    const docs = await runtimeGetKnowledgeDocuments({}).catch(() => []);
    const assessed = (docs || []).map((doc: any) => applyTrustMetadata(doc));
    return {
      metrics: getTrustMetrics(docs || []),
      records: assessed.map((doc: any) => ({
        id: doc.id,
        uuid: doc.uuid || null,
        title: doc.title,
        status: doc.status || null,
        isChatEligible: Boolean(doc.isChatEligible ?? doc.is_chat_eligible),
        authorityLevel: doc.trust?.authorityLevel || doc.authorityLevel || 'unverified',
        citationVerificationStatus: doc.trust?.citationStatus || 'missing',
        visibilityScope: doc.trust?.visibilityScope || 'public',
        contentStatus: doc.trust?.contentStatus || 'production',
        trustEligible: Boolean(doc.isTrustEligible),
        reasons: doc.trust?.reasons || [],
      })),
      mode: 'assistant_trust_foundation_v1_read_only_snapshot',
    };
  }),
  reviewQueue: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.reviewQueue');
      const docs = await runtimeGetKnowledgeDocuments({}).catch(() => []);
      const rows = (docs || [])
        .map((doc: any) => applyTrustMetadata(doc))
        .filter((doc: any) => !doc.isTrustEligible || doc.trust?.citationStatus !== 'verified')
        .slice(0, input?.limit || 100)
        .map((doc: any) => ({
          id: doc.id,
          uuid: doc.uuid || null,
          title: doc.title,
          authorityLevel: doc.trust?.authorityLevel || 'unverified',
          citationVerificationStatus: doc.trust?.citationStatus || 'missing',
          visibilityScope: doc.trust?.visibilityScope || 'public',
          contentStatus: doc.trust?.contentStatus || 'production',
          actionRequired: doc.trust?.reasons || [],
        }));
      return { total: rows.length, results: rows, mode: 'assistant_trust_review_queue_read_only' };
    }),
  operationsSnapshot: adminProcedure.query(async ({ ctx }) => {
    await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.operationsSnapshot');
    const [snapshot, runtimeReadDiagnostics] = await Promise.all([
      runtimeGetKnowledgeReviewOperationsSnapshot(),
      Promise.resolve(runtimeGetAssistantKnowledgeReadDiagnostics()),
    ]);
    return {
      ...snapshot,
      runtimeReadDiagnostics,
      maturityPolicy: getAssistantMaturityPolicySnapshot(),
    };
  }),
  contentClassificationReconciliation: adminProcedure.query(async ({ ctx }) => {
    await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.contentClassificationReconciliation');
    return runtimeGetContentClassificationReconciliation();
  }),
  reviewTasks: adminProcedure
    .input(z.object({ workflowStage: z.string().optional(), status: z.string().optional(), limit: z.number().min(1).max(500).optional(), offset: z.number().min(0).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.reviewTasks');
      return runtimeListKnowledgeReviewTasks(input);
    }),
  reviewTaskCase: adminProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.reviewTaskCase');
      return runtimeGetKnowledgeReviewTaskCase({ taskId: input.taskId, reviewerAuthUserId });
    }),
  claimReviewTask: adminProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.claimReviewTask');
      return runtimeClaimKnowledgeReviewTask({ taskId: input.taskId, reviewerAuthUserId });
    }),
  verifyOfficialSource: adminProcedure
    .input(z.object({ taskId: z.string().uuid(), referenceDocumentId: z.string().uuid(), canonicalSourceUrl: z.string().url(), issuerName: z.string().min(2).max(300), evidenceJson: z.record(z.string(), z.any()).optional() }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.verifyOfficialSource');
      await runtimeAssertKnowledgeReviewTaskClaim({ taskId: input.taskId, reviewerAuthUserId, workflowStage: 'source_verification', targetId: input.referenceDocumentId });
      const { taskId: _taskId, ...payload } = input;
      return runtimeVerifyReferenceSource({ ...payload, reviewerAuthUserId });
    }),
  verifyCitation: adminProcedure
    .input(z.object({ taskId: z.string().uuid(), knowledgeDocumentId: z.string().uuid(), citationId: z.string().uuid().optional(), locator: z.string().min(2).max(1000), excerpt: z.string().max(5000).optional(), evidenceJson: z.record(z.string(), z.any()).optional() }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.verifyCitation');
      await runtimeAssertKnowledgeReviewTaskClaim({ taskId: input.taskId, reviewerAuthUserId, workflowStage: 'citation_verification', targetId: input.knowledgeDocumentId });
      const { taskId: _taskId, ...payload } = input;
      return runtimeVerifyKnowledgeCitation({ ...payload, reviewerAuthUserId });
    }),
  resolveContentClassificationContainment: adminProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      decision: z.enum(['confirm_test', 'confirm_duplicate', 'confirm_quarantine', 'defer']),
      evidenceNote: z.string().min(20).max(5000),
      evidenceJson: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.resolveContentClassificationContainment');
      return runtimeResolveContentClassificationContainment({ ...input, reviewerAuthUserId });
    }),
  releaseOfficialDocument: adminProcedure
    .input(z.object({ knowledgeDocumentId: z.string().uuid(), releaseNotes: z.string().min(5).max(5000) }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('official_knowledge_release');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'publish', 'knowledgeTrust.releaseOfficialDocument');
      return runtimeReleaseOfficialKnowledgeDocument({ ...input, reviewerAuthUserId });
    }),
  mappingQueue: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional(), offset: z.number().min(0).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.mappingQueue');
      return runtimeListKb08bMappingQueue(input);
    }),
  resolveMapping: adminProcedure
    .input(z.object({
      legacyImportId: z.string().uuid(),
      action: z.enum(['map_existing', 'promote_review', 'defer', 'quarantine']),
      targetReferenceDocumentId: z.string().uuid().optional(),
      targetKnowledgeDocumentId: z.string().uuid().optional(),
      sourceId: z.string().uuid().optional(),
      category: z.enum(['law', 'jurisprudence', 'historical', 'administrative', 'reference']).optional(),
      domainScope: z.enum(['waqf_law', 'fiqh', 'administrative', 'historical', 'public_info', 'internal_procedure', 'other']).optional(),
      notes: z.string().max(5000).optional(),
      evidenceJson: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('kb08b_mapping_mutation');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.resolveMapping');
      return runtimeResolveKb08bMapping({ ...input, reviewerAuthUserId });
    }),
  pageBindings: adminProcedure.query(async ({ ctx }) => {
    await requireKnowledgeScope(ctx, 'review', 'knowledgeTrust.pageBindings');
    return runtimeListPageOperationBindings();
  }),
  setPageBinding: adminProcedure
    .input(z.object({ pageKey: z.enum(['faq', 'knowledge_base', 'search', 'files', 'templates', 'settings']), bindingStatus: z.enum(['prepared', 'active', 'blocked']), readContract: z.string().max(200).optional(), writeContract: z.string().max(200).optional(), notes: z.string().max(5000).optional() }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('page_binding_mutation');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'publish', 'knowledgeTrust.setPageBinding');
      return runtimeSetPageOperationBinding({ ...input, reviewerAuthUserId });
    }),
});


const knowledgeActivationRouter = router({
  snapshot: adminProcedure.query(async ({ ctx }) => {
    await requireKnowledgeScope(ctx, 'review', 'knowledgeActivation.snapshot');
    return runtimeGetKnowledgeActivationSnapshot();
  }),
  items: adminProcedure
    .input(z.object({ runId: z.string().uuid().optional(), bucket: z.string().optional(), limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'knowledgeActivation.items');
      return runtimeListKnowledgeActivationItems(input);
    }),
  runFullAudit: adminProcedure
    .input(z.object({ note: z.string().max(1000).optional() }).optional())
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'knowledgeActivation.runFullAudit');
      return runtimeRunKnowledgeActivationAudit({ reviewerAuthUserId, note: input?.note });
    }),
  releaseCandidate: adminProcedure
    .input(z.object({ knowledgeDocumentId: z.string().uuid(), releaseNotes: z.string().min(5).max(5000) }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('official_knowledge_release');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'publish', 'knowledgeActivation.releaseCandidate');
      return runtimeReleaseOfficialKnowledgeDocument({ ...input, reviewerAuthUserId });
    }),
});


const legacyProvenanceRouter = router({
  snapshot: adminProcedure.query(async ({ ctx }) => {
    await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.snapshot');
    return runtimeGetLegacyProvenanceSnapshotV11();
  }),
  groups: adminProcedure
    .input(z.object({ runId: z.string().uuid().optional(), limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.groups');
      return runtimeListLegacyProvenanceGroupsV11(input);
    }),
  items: adminProcedure
    .input(z.object({ runId: z.string().uuid().optional(), state: z.string().optional(), limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.items');
      return runtimeListLegacyProvenanceItemsV11(input);
    }),
  duplicateCitationTasks: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input, ctx }) => {
      await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.duplicateCitationTasks');
      return runtimeListDuplicateCitationReviewTasksV11(input);
    }),
  runReconstruction: adminProcedure
    .input(z.object({ activationRunId: z.string().uuid().optional(), note: z.string().max(1000).optional() }).optional())
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.runReconstruction');
      return runtimeRunLegacyProvenanceReconstructionV11({ reviewerAuthUserId, activationRunId: input?.activationRunId || null, note: input?.note });
    }),
  recordDecision: adminProcedure
    .input(z.object({ itemId: z.string().uuid(), taskId: z.string().uuid(), decisionCode: z.enum(['official_source_candidate_confirmed','institutional_source_candidate_confirmed','metadata_insufficient','not_authoritative','needs_external_research','duplicate_or_contained']), evidenceReference: z.string().min(5).max(2000), candidateUrl: z.string().url().optional(), issuerName: z.string().max(500).optional(), notes: z.string().max(2800).optional() }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.recordDecision');
      const provenanceItem = await runtimeGetLegacyProvenanceDecisionContextV11({ itemId: input.itemId });
      if (provenanceItem.provenanceState === 'test_artifact_excluded') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'أثر الاختبار مستبعد ولا يقبل قرار منشأ.' });
      }
      if (!provenanceItem.referenceDocumentId) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'لا يملك عنصر المنشأ reference_document صالحًا لربط مهمة التحقق.' });
      }
      await runtimeAssertKnowledgeReviewTaskClaim({
        taskId: input.taskId,
        reviewerAuthUserId,
        workflowStage: 'source_verification',
        targetId: provenanceItem.referenceDocumentId,
      });
      const { taskId, notes, ...decisionInput } = input;
      const linkedNotes = [`[source_verification_task:${taskId}]`, notes?.trim()].filter(Boolean).join('\n');
      return runtimeRecordLegacyProvenanceDecisionV11({ ...decisionInput, notes: linkedNotes, reviewerAuthUserId });
    }),
  reconcileDuplicateCitationTask: adminProcedure
    .input(z.object({ keepTaskId: z.string().uuid(), cancelTaskId: z.string().uuid(), rationale: z.string().min(8).max(3000) }))
    .mutation(async ({ input, ctx }) => {
      requireAssistantMaturityOperation('controlled_review');
      const reviewerAuthUserId = await requireKnowledgeScope(ctx, 'review', 'legacyProvenance.reconcileDuplicateCitationTask');
      return runtimeReconcileDuplicateCitationReviewTaskV11({ ...input, reviewerAuthUserId });
    }),
});

const rolesRouter = router({
  list: adminProcedure.query(async () => safeDbRead(() => dbOps.getAllRoles(), [])),
  create: adminProcedure.input(z.any()).mutation(async ({ input }) => safeDbWrite(() => dbOps.createRole({ ...compactPayload(input), name: input?.name || 'role', nameAr: input?.nameAr || input?.name || 'دور' }))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(() => dbOps.updateRole(input.id, inputPatch(input)))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deleteRole(input.id); return { success: true }; })),
  getPermissions: adminProcedure.input(z.object({ roleId: z.number() })).query(async ({ input }) => safeDbRead(() => dbOps.getRolePermissions(input.roleId), [])),
  assignPermission: adminProcedure.input(z.object({ roleId: z.number(), permissionId: z.number() })).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.assignPermissionToRole(input.roleId, input.permissionId); return { success: true }; })),
  removePermission: adminProcedure.input(z.object({ roleId: z.number(), permissionId: z.number() })).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.removePermissionFromRole(input.roleId, input.permissionId); return { success: true }; })),
});

const permissionsRouter = router({
  list: adminProcedure.query(async () => safeDbRead(() => dbOps.getAllPermissions(), [])),
  create: adminProcedure.input(z.any()).mutation(async ({ input }) => safeDbWrite(() => dbOps.createPermission({ ...compactPayload(input), name: input?.name || `${input?.resource || 'resource'}.${input?.action || 'read'}`, nameAr: input?.nameAr || input?.name || 'صلاحية', resource: input?.resource || 'general', action: input?.action || 'read' }))),
  update: adminProcedure.input(genericUpdateInput).mutation(async ({ input }) => safeDbWrite(() => dbOps.updatePermission(input.id, inputPatch(input)))),
  delete: adminProcedure.input(genericIdInput).mutation(async ({ input }) => safeDbWrite(async () => { await dbOps.deletePermission(input.id); return { success: true }; })),
});

const pageSettingsRouter = router({
  get: adminProcedure.input(z.object({ pageName: z.string() })).query(async ({ input }) => safeDbRead(() => dbOps.getPageSettings(input.pageName), null as any)),
  update: adminProcedure.input(z.object({ pageName: z.string(), data: z.any().optional() }).passthrough()).mutation(async ({ input }) => safeDbWrite(() => dbOps.updatePageSettings(input.pageName, inputPatch(input) as any))),
});

const aiRouter = router({
  chat: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    const prompt = String(input?.message || input?.prompt || input?.query || '');
    return { answer: prompt ? `تم استلام الطلب: ${prompt.slice(0, 120)}` : 'تم استلام الطلب.', sources: [], mode: 'local_stub_connected' };
  }),
});

const aiToolsRouter = router({
  getRunMetrics: adminProcedure.query(async () => {
    return await runtimeGetAiToolRunMetrics();
  }),
  getBackendActivationSnapshot: adminProcedure.query(async () => {
    return await runtimeGetAiToolBackendActivationSnapshot();
  }),
  listRuns: adminProcedure
    .input(z.object({
      toolKey: z.enum(['extract','summarize','classify','compare','precedents','predict']).optional(),
      approvalStatus: z.enum(['pending','approved','rejected']).optional(),
      runStatus: z.enum(['draft','completed','failed','archived']).optional(),
      searchText: z.string().optional(),
      limit: z.number().min(1).max(200).optional(),
    }).optional())
    .query(async ({ input }) => {
      return await runtimeListAiToolRuns(input || {});
    }),
  getRunDetails: adminProcedure
    .input(z.object({ toolRunId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await runtimeGetAiToolRunDetails(input.toolRunId);
    }),
  reviewRun: adminProcedure
    .input(z.object({
      toolRunId: z.string().uuid(),
      approvalStatus: z.enum(['approved','rejected']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await runtimeUpdateAiToolRunReview({
        toolRunId: input.toolRunId,
        approvalStatus: input.approvalStatus,
        notes: input.notes ?? null,
        approvedByAdminUserId: ctx.user?.platformUserId ?? null,
      });
    }),
  reopenRun: adminProcedure
    .input(z.object({
      toolRunId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await runtimeReopenAiToolRun({
        toolRunId: input.toolRunId,
        notes: input.notes ?? null,
        createdByAdminUserId: ctx.user?.platformUserId ?? null,
      });
    }),
  classify: protectedProcedure
    .input(z.object({ text: z.string().min(10), title: z.string().optional(), type: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const createdByAdminUserId = ctx.user?.platformUserId ?? null;
      try {
        const result = await classifyDocument(input.text, input.title);
        const mappedCategory = mapAiCategory(result.category);
        const shapedResult = {
          documentType: input.type === 'case' ? 'قضية' : 'وثيقة',
          category: mappedCategory,
          rawCategory: result.category,
          subcategory: Array.isArray(result.subcategories) ? result.subcategories.join('، ') : '',
          confidence: result.confidence,
          tags: Array.isArray(result.keywords) ? result.keywords : [],
          reasoning: result.summary || (Array.isArray(result.subcategories) ? result.subcategories.join('، ') : ''),
          relevanceScore: result.relevanceScore,
          raw: result,
        };

        const toolRun = await runtimeCreateAiToolRun({
          toolKey: 'classify',
          runStatus: 'completed',
          approvalStatus: 'pending',
          title: input.title || 'تصنيف ذكي',
          inputText: input.text,
          inputJson: { title: input.title ?? null, type: input.type ?? null },
          outputText: [shapedResult.category, shapedResult.subcategory, shapedResult.reasoning].filter(Boolean).join("\n"),
          outputJson: shapedResult,
          sourceContextJson: {
            entrypoint: '/admin/tools/classify',
            userSource: ctx.user?.source ?? null,
          },
          createdByAdminUserId,
          notes: 'Classify tool run persisted to assistant.ai_tool_runs',
        });

        return {
          ...shapedResult,
          toolRunId: toolRun.id,
        };
      } catch (error) {
        try {
          await runtimeCreateAiToolRun({
            toolKey: 'classify',
            runStatus: 'failed',
            approvalStatus: 'pending',
            title: input.title || 'تصنيف ذكي',
            inputText: input.text,
            inputJson: { title: input.title ?? null, type: input.type ?? null },
            errorMessage: error instanceof Error ? error.message : 'Unknown classify error',
            sourceContextJson: {
              entrypoint: '/admin/tools/classify',
              userSource: ctx.user?.source ?? null,
            },
            createdByAdminUserId,
            notes: 'Classify tool run failed and was persisted to assistant.ai_tool_runs',
          });
        } catch (persistError) {
          console.error('Failed to persist failed classify tool run', persistError);
        }
        throw error;
      }
    }),
  extract: protectedProcedure
    .input(z.object({ text: z.string().min(10), title: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const createdByAdminUserId = ctx.user?.platformUserId ?? null;
      try {
        const result = await extractInformation(input.text);
        const shapedResult = {
          entities: {
            الأشخاص: result.entities?.persons || [],
            الأماكن: result.entities?.locations || [],
            التواريخ: result.entities?.dates || [],
            المبالغ: result.entities?.amounts || [],
            العقارات: result.entities?.properties || [],
          },
          keyPoints: result.keyPoints || [],
          legalTopics: result.legalReferences || [],
          citations: result.legalReferences || [],
          raw: result,
        };

        const outputText = [
          ...(Array.isArray(shapedResult.keyPoints) ? shapedResult.keyPoints : []),
          ...(Array.isArray(shapedResult.legalTopics) ? shapedResult.legalTopics : []),
        ].filter(Boolean).join("\n");

        const toolRun = await runtimeCreateAiToolRun({
          toolKey: 'extract',
          runStatus: 'completed',
          approvalStatus: 'pending',
          title: input.title || 'استخراج معلومات',
          inputText: input.text,
          inputJson: { title: input.title ?? null },
          outputText,
          outputJson: shapedResult,
          sourceContextJson: {
            entrypoint: '/admin/tools/extract',
            userSource: ctx.user?.source ?? null,
          },
          createdByAdminUserId,
          notes: 'Extract tool run persisted to assistant.ai_tool_runs',
        });

        return {
          ...shapedResult,
          toolRunId: toolRun.id,
        };
      } catch (error) {
        try {
          await runtimeCreateAiToolRun({
            toolKey: 'extract',
            runStatus: 'failed',
            approvalStatus: 'pending',
            title: input.title || 'استخراج معلومات',
            inputText: input.text,
            inputJson: { title: input.title ?? null },
            errorMessage: error instanceof Error ? error.message : 'Unknown extract error',
            sourceContextJson: {
              entrypoint: '/admin/tools/extract',
              userSource: ctx.user?.source ?? null,
            },
            createdByAdminUserId,
            notes: 'Extract tool run failed and was persisted to assistant.ai_tool_runs',
          });
        } catch (persistError) {
          console.error('Failed to persist failed extract tool run', persistError);
        }
        throw error;
      }
    }),
  summarize: protectedProcedure
    .input(z.object({ text: z.string().min(10), title: z.string().optional(), maxLength: z.enum(['short','medium','long']).optional() }))
    .mutation(async ({ input, ctx }) => {
      const createdByAdminUserId = ctx.user?.platformUserId ?? null;
      try {
        const result = await summarizeText(input.text, input.maxLength || 'medium');
        const shapedResult = {
          summary: result.detailedSummary,
          shortSummary: result.shortSummary,
          keyPoints: result.mainPoints || [],
          recommendations: result.conclusion ? [result.conclusion] : [],
          raw: result,
        };

        const toolRun = await runtimeCreateAiToolRun({
          toolKey: 'summarize',
          runStatus: 'completed',
          approvalStatus: 'pending',
          title: input.title || 'تلخيص ذكي',
          inputText: input.text,
          inputJson: { title: input.title ?? null, maxLength: input.maxLength ?? 'medium' },
          outputText: [shapedResult.summary, shapedResult.shortSummary, ...(shapedResult.recommendations || [])].filter(Boolean).join("\n"),
          outputJson: shapedResult,
          sourceContextJson: {
            entrypoint: '/admin/tools/summarize',
            userSource: ctx.user?.source ?? null,
          },
          createdByAdminUserId,
          notes: 'Summarize tool run persisted to assistant.ai_tool_runs',
        });

        return {
          ...shapedResult,
          toolRunId: toolRun.id,
        };
      } catch (error) {
        try {
          await runtimeCreateAiToolRun({
            toolKey: 'summarize',
            runStatus: 'failed',
            approvalStatus: 'pending',
            title: input.title || 'تلخيص ذكي',
            inputText: input.text,
            inputJson: { title: input.title ?? null, maxLength: input.maxLength ?? 'medium' },
            errorMessage: error instanceof Error ? error.message : 'Unknown summarize error',
            sourceContextJson: {
              entrypoint: '/admin/tools/summarize',
              userSource: ctx.user?.source ?? null,
            },
            createdByAdminUserId,
            notes: 'Summarize tool run failed and was persisted to assistant.ai_tool_runs',
          });
        } catch (persistError) {
          console.error('Failed to persist failed summarize tool run', persistError);
        }
        throw error;
      }
    }),
  saveAsKnowledgeDraft: adminProcedure
    .input(z.object({
      tool: z.enum(['extract','classify','summarize','compare','precedents','predict']),
      text: z.string().min(1),
      title: z.string().optional(),
      result: z.any(),
      category: z.string().optional(),
      toolRunId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payload = buildKnowledgeDraftPayloadFromTool({
        tool: input.tool,
        text: input.text,
        title: input.title,
        result: input.result,
        category: input.category,
      });
      return await runtimeCreateKnowledgeDocumentFromTool({
        tool: input.tool,
        title: payload.title,
        content: payload.content,
        category: payload.category,
        tags: payload.tags,
        sourceText: input.text,
        createdByAdminUserId: ctx.user?.platformUserId ?? null,
        metadata: payload.metadata,
        toolRunId: input.toolRunId ?? null,
      });
    }),
});

// Alerts router
const alertsRouter = router({
  watchlists: router({
    list: protectedProcedure.query(async () => {
      return await listWatchlists();
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          query: z.string(),
          categories: z.string().optional(),
          sourceTypes: z.string().optional(),
          statuses: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createWatchlist({
          name: input.name,
          query: input.query,
          categories: input.categories,
          sourceTypes: input.sourceTypes,
          statuses: input.statuses,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          query: z.string().optional(),
          categories: z.string().optional(),
          sourceTypes: z.string().optional(),
          statuses: z.string().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateWatchlist(input.id, {
          name: input.name,
          query: input.query,
          categories: input.categories,
          sourceTypes: input.sourceTypes,
          statuses: input.statuses,
          isActive: input.isActive,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteWatchlist(input.id);
      }),
  }),
  run: protectedProcedure
    .input(z.object({ limitItems: z.number().optional() }))
    .mutation(async ({ input }) => {
      return await runWatchlists(input.limitItems || 50);
    }),
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        watchlistId: z.number().optional(),
        q: z.string().optional(),
        minScore: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        offset: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listAlerts({
        status: input.status,
        watchlistId: input.watchlistId,
        q: input.q,
        minScore: input.minScore,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        offset: input.offset || 0,
        limit: input.limit || 50,
      });
    }),
  markSeen: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return markAlertSeen(input.id);
    }),
  markDone: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return markAlertDone(input.id);
    }),
  bulkMarkSeen: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return markAlertsSeen(input.ids);
    }),
  bulkMarkDone: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return markAlertsDone(input.ids);
    }),
  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return deleteAlerts(input.ids);
    }),
  getStats: protectedProcedure.query(async () => {
    const { getAlertsStats } = await import("./db");
    return await getAlertsStats();
  }),
  get7DayTrend: protectedProcedure.query(async () => {
    const { get7DayTrend } = await import("./db");
    return await get7DayTrend();
  }),
  templates: {
    list: protectedProcedure.query(async ({ ctx }) => {
      const { listWatchlistTemplates } = await import("./db");
      return await listWatchlistTemplates(ctx.user?.id?.toString());
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        query: z.string(),
        categories: z.string().optional(),
        sourceTypes: z.string().optional(),
        statuses: z.string().default("pending,approved"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createWatchlistTemplate } = await import("./db");
        return await createWatchlistTemplate(
          input.name,
          input.description,
          input.query,
          input.categories,
          input.sourceTypes,
          input.statuses,
          ctx.user?.id?.toString() || "unknown"
        );
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteWatchlistTemplate } = await import("./db");
        return await deleteWatchlistTemplate(input.id);
      }),
    getPublic: publicProcedure.query(async () => {
      const { listWatchlistTemplates } = await import("./db");
      const allTemplates = await listWatchlistTemplates();
      return (allTemplates || []).filter((t: any) => t.isPublic === 1);
    }),
  },
  // runScheduled: alertsRunScheduled, // Not available
});

const pdfExtractionRouter = router({
  extractOne: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const item = await runtimeGetFetchedContentById(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على المحتوى المطلوب" });
      }

      let extractionSourceText = (item.content || "").trim();
      let sourceError: string | null = null;

      if (item.pdfUrl) {
        try {
          const response = await fetch(item.pdfUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = response.headers.get("content-type") || "application/pdf";
          const extracted = await extractTextFromFile(buffer, mimeType);
          if (extracted && extracted.trim().length > extractionSourceText.length) {
            extractionSourceText = extracted.trim();
          }
        } catch (error) {
          sourceError = error instanceof Error ? error.message : "فشل استخراج النص من ملف PDF";
        }
      }

      if (!extractionSourceText) {
        const emptyFields = {
          docType: null,
          docDate: null,
          docNumber: null,
          issuer: null,
          language: null,
          pageCount: null,
          intakeRoute: "review_only" as const,
          intakeReason: "تعذر الوصول إلى نص قابل للاستخراج من الملف أو من المحتوى المخزن، وتحتاج الوثيقة إلى مراجعة بشرية.",
          intakeConfidence: 0.2,
          extractedAt: new Date().toISOString().slice(0, 19),
          extractionVersion: "pdf-rules-v2",
          extractionError: sourceError || "لا يوجد نص متاح للاستخراج",
        };

        await runtimeUpdateFetchedContentExtraction(input.id, {
          docDate: null,
          docNumber: null,
          issuer: null,
          docType: null,
          language: null,
          pageCount: null,
          extractedAt: emptyFields.extractedAt,
          extractionVersion: emptyFields.extractionVersion,
          extractionError: emptyFields.extractionError,
        });
        await runtimeCreateFetchedContentReviewEvent({
          fetchedContentId: input.id,
          eventType: 'extraction',
          eventSource: 'system',
          route: emptyFields.intakeRoute,
          confidence: String(emptyFields.intakeConfidence),
          notes: emptyFields.intakeReason,
          payload: JSON.stringify(emptyFields),
        } as any).catch(() => null);

        return { fields: emptyFields };
      }

      const fields = extractPdfFields(extractionSourceText, item.title || undefined);
      const finalFields = sourceError && !fields.extractionError
        ? { ...fields, extractionError: sourceError }
        : fields;

      await runtimeUpdateFetchedContentExtraction(input.id, {
        docDate: finalFields.docDate,
        docNumber: finalFields.docNumber,
        issuer: finalFields.issuer,
        docType: finalFields.docType,
        language: finalFields.language,
        pageCount: finalFields.pageCount,
        extractedAt: finalFields.extractedAt,
        extractionVersion: finalFields.extractionVersion,
        extractionError: finalFields.extractionError,
      });
      await runtimeCreateFetchedContentReviewEvent({
        fetchedContentId: input.id,
        eventType: 'route',
        eventSource: 'system',
        route: finalFields.intakeRoute,
        confidence: typeof finalFields.intakeConfidence === 'number' ? String(finalFields.intakeConfidence) : undefined,
        notes: finalFields.intakeReason,
        payload: JSON.stringify(finalFields),
      } as any).catch(() => null);

      return { fields: finalFields };
    }),
});



const governedAgenticRagPilotRouter = router({
  status: adminProcedure.query(async () => {
    return await getGovernedAgenticRagPilotStatus();
  }),
  candidates: adminProcedure.query(async () => {
    return await getGovernedAgenticRagPilotCandidates();
  }),
  runSingleFlowReadinessCycle: adminProcedure
    .input(z.object({ maxUrls: z.number().int().min(1).max(32).default(32) }).optional())
    .mutation(async ({ input }) => {
      return await runGovernedAgenticRagPilotSingleFlowReadinessCycle({ maxUrls: input?.maxUrls || 32 });
    }),
  prepareSessionAuthority: adminProcedure
    .input(z.object({
      binding: z.object({
        clusterKey: z.string().trim().min(1).max(240),
        documentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(120)]),
        evidenceTier: z.enum(['T3_CONTROLLED_INTERNAL_EVIDENCE', 'T4_VERIFIED_CITATION_EVIDENCE']),
        internalUseApprovalRef: z.string().trim().min(3).max(240),
      }),
      rightsApprovalRef: z.string().trim().min(3).max(240),
      reviewRationale: z.string().trim().min(12).max(1000),
      reviewDecision: z.literal('APPROVE_EPHEMERAL_INTERNAL_SESSION_PREP'),
      acknowledgeInternalOnly: z.literal(true),
      acknowledgeNoRightsGrant: z.literal(true),
      acknowledgeModelBoundary: z.literal(true),
    }))
    .mutation(async ({ input, ctx }) => {
      return await prepareGovernedAgenticRagPilotSessionAuthority({
        ...input,
        operatorId: ctx.user!.id,
      });
    }),
  authorityPreparation: adminProcedure
    .input(z.object({ authorityPreparationId: z.string().trim().min(8).max(160) }))
    .query(({ input, ctx }) => {
      return getGovernedAgenticRagPilotAuthorityPreparation(input.authorityPreparationId, ctx.user!.id);
    }),
  revokeAuthorityPreparation: adminProcedure
    .input(z.object({ authorityPreparationId: z.string().trim().min(8).max(160) }))
    .mutation(({ input, ctx }) => {
      return revokeGovernedAgenticRagPilotAuthorityPreparation(input.authorityPreparationId, ctx.user!.id);
    }),
  startSession: adminProcedure
    .input(z.object({
      authorityPreparationId: z.string().trim().min(8).max(160),
      sessionStartDecision: z.literal('AUTHORIZE_ONE_EPHEMERAL_EVIDENCE_ONLY_UAT_SESSION'),
      uatReference: z.string().trim().min(3).max(240),
      acknowledgeEvidenceOnly: z.literal(true),
      acknowledgeOneQuestionLimit: z.literal(true),
      acknowledgeRollbackRequired: z.literal(true),
    }))
    .mutation(async ({ input, ctx }) => {
      return await startGovernedAgenticRagPilotSession({
        ...input,
        operatorId: ctx.user!.id,
      });
    }),
  ask: adminProcedure
    .input(z.object({
      sessionId: z.string().min(8).max(120),
      question: z.string().min(2).max(1600),
    }))
    .mutation(async ({ input, ctx }) => {
      return await runGovernedAgenticRagPilotQuestion({
        ...input,
        operatorId: ctx.user!.id,
      });
    }),
  events: adminProcedure
    .input(z.object({ sessionId: z.string().min(8).max(120) }))
    .query(async ({ input, ctx }) => {
      return getGovernedAgenticRagPilotEvents(input.sessionId, ctx.user!.id);
    }),
  rollbackSession: adminProcedure
    .input(z.object({ sessionId: z.string().min(8).max(120) }))
    .mutation(async ({ input, ctx }) => {
      return rollbackGovernedAgenticRagPilotSession(input.sessionId, ctx.user!.id);
    }),
});


const sourceProvenanceRouter = router({
  registry: adminProcedure.query(async () => {
    return await getSourceProvenanceRegistry();
  }),
  legacyManusReconciliation: adminProcedure.query(async () => {
    return await getLegacyManusProvenanceReconciliation();
  }),
  autonomousAudit: adminProcedure.query(async () => {
    return await getAutonomousProvenanceAudit();
  }),
  externalVerification: adminProcedure
    .input(z.object({ maxUrls: z.number().int().min(1).max(32).default(32) }))
    .query(async ({ input }) => {
      return await getAutonomousExternalSourceVerification(input);
    }),
  controlledRegistryDesign: adminProcedure.query(async () => {
    return await getControlledSourceRegistryDesign();
  }),
  controlledReleasePlan: adminProcedure.query(async () => {
    return await getVerifiedSourceSelectionAndControlledReleasePlan();
  }),
  access: adminProcedure.query(async ({ ctx }) => {
    return await getSourceProvenanceAccess(ctx.user);
  }),
  upsert: adminProcedure
    .input(z.object({
      sourceId: z.string().uuid().nullable().optional(),
      name: z.string().trim().min(2).max(300),
      baseUrl: z.string().trim().url().max(2000),
      description: z.string().trim().max(4000).nullable().optional(),
      authorityLevel: z.enum(['official', 'semi_official', 'reference', 'unverified']).optional(),
      isActive: z.boolean().optional(),
      changeReason: z.string().trim().min(3).max(2000).nullable().optional(),
      rights: z.object({
        rightsStatus: z.enum(['unknown', 'review_required', 'licensed', 'permission_recorded', 'public_domain', 'official_publication', 'restricted', 'prohibited', 'removed']).default('review_required'),
        licenseType: z.string().trim().max(300).nullable().optional(),
        licenseUrl: z.string().trim().url().max(2000).nullable().optional(),
        publisherName: z.string().trim().max(500).nullable().optional(),
        rightsHolderName: z.string().trim().max(500).nullable().optional(),
        attributionText: z.string().trim().max(2000).nullable().optional(),
        permissionReference: z.string().trim().max(1000).nullable().optional(),
        termsUrl: z.string().trim().url().max(2000).nullable().optional(),
        allowedUseScope: z.string().trim().max(500).nullable().optional(),
        fullTextRetentionAllowed: z.boolean().nullable().optional(),
        ragEligibility: z.enum(['review_only', 'internal_only', 'eligible_after_review', 'blocked']).default('review_only'),
        publicDisplayEligibility: z.enum(['metadata_only', 'excerpt_only', 'full_text_permitted', 'blocked']).default('metadata_only'),
        notes: z.string().trim().max(4000).nullable().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const actor = resolveSourceProvenanceActor(ctx.user);
        return await upsertSourceProvenance({
          actorAuthUserId: actor.authUserId,
          actorIsSuperAdmin: actor.isSuperAdmin,
          sourceId: input.sourceId || null,
          name: input.name,
          baseUrl: input.baseUrl,
          description: input.description || null,
          authorityLevel: input.authorityLevel || 'unverified',
          isActive: input.isActive ?? true,
          changeReason: input.changeReason || null,
          rights: {
            rights_status: input.rights.rightsStatus,
            license_type: input.rights.licenseType || null,
            license_url: input.rights.licenseUrl || null,
            publisher_name: input.rights.publisherName || null,
            rights_holder_name: input.rights.rightsHolderName || null,
            attribution_text: input.rights.attributionText || null,
            permission_reference: input.rights.permissionReference || null,
            terms_url: input.rights.termsUrl || null,
            allowed_use_scope: input.rights.allowedUseScope || null,
            full_text_retention_allowed: input.rights.fullTextRetentionAllowed ?? null,
            rag_eligibility: input.rights.ragEligibility,
            public_display_eligibility: input.rights.publicDisplayEligibility,
            notes: input.rights.notes || null,
          },
        });
      } catch (error: any) {
        throw new TRPCError({ code: 'FORBIDDEN', message: error?.message || 'تعذر حفظ سجل المصدر والحقوق.' });
      }
    }),
  reviewRights: adminProcedure
    .input(z.object({
      sourceId: z.string().uuid(),
      decision: z.enum(['verified', 'rejected']),
      reviewNotes: z.string().trim().min(8).max(4000),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const actor = resolveSourceProvenanceActor(ctx.user);
        return await reviewSourceRightsProfile({
          actorAuthUserId: actor.authUserId,
          actorIsSuperAdmin: actor.isSuperAdmin,
          sourceId: input.sourceId,
          decision: input.decision,
          reviewNotes: input.reviewNotes,
        });
      } catch (error: any) {
        throw new TRPCError({ code: 'FORBIDDEN', message: error?.message || 'تعذر حفظ قرار المراجعة البشرية للحقوق.' });
      }
    }),
  archive: adminProcedure
    .input(z.object({ sourceId: z.string().uuid(), reason: z.string().trim().min(3).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const actor = resolveSourceProvenanceActor(ctx.user);
        return await archiveSourceProvenance({
          actorAuthUserId: actor.authUserId,
          actorIsSuperAdmin: actor.isSuperAdmin,
          sourceId: input.sourceId,
          reason: input.reason,
        });
      } catch (error: any) {
        throw new TRPCError({ code: 'FORBIDDEN', message: error?.message || 'تعذر أرشفة المصدر.' });
      }
    }),
});

const platformBridgeRouter = router({
  status: adminProcedure.query(async () => {
    return getPlatformBridgeStatus();
  }),
  connectivity: adminProcedure.query(async () => {
    return await checkPlatformBridgeConnectivity();
  }),
  sourceOfTruthMatrix: adminProcedure.query(async () => {
    return getPlatformSourceOfTruthMatrix();
  }),
  previewSourceOfTruth: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(10).optional() }).optional())
    .query(async ({ input }) => {
      return await previewPlatformSourceOfTruth(input?.limit ?? 3);
    }),
  previewMappedSourceOfTruth: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(10).optional() }).optional())
    .query(async ({ input }) => {
      return await previewMappedPlatformSourceOfTruth(input?.limit ?? 3);
    }),
  adminUsers: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => {
      return await listPlatformAdminUsers({ search: input?.search ?? null, limit: input?.limit ?? 20 });
    }),
  orgUnits: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => {
      return await listPlatformOrgUnits({ search: input?.search ?? null, limit: input?.limit ?? 20 });
    }),
  waqfAssets: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => {
      return await listPlatformWaqfAssets({ search: input?.search ?? null, limit: input?.limit ?? 20 });
    }),
  endowments: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().min(1).max(100).optional() }).optional())
    .query(async ({ input }) => {
      return await listPlatformEndowments({ search: input?.search ?? null, limit: input?.limit ?? 20 });
    }),
});

// Auth Router
const authRouter = router({
  me: protectedProcedure
    .query(({ ctx }) => ctx.user),
  
  logout: protectedProcedure
    .mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
      return { success: true };
    }),
});

export const appRouter = router({
  admin: adminRouter,
  analytics: analyticsRouter,
  health: healthRouter,
  auth: authRouter,
  ai: aiRouter,
  advancedSearch: advancedSearchRouter,
  cache: cacheRouter,
  interactionStats: interactionStatsRouter,
  interaction: interactionStatsRouter,
  bookmarks: bookmarksRouter,
  favorites: favoritesRouter,
  export: exportRouter,
  dashboard: dashboardRouter,
  search: searchRouter,
  contact: contactRouter,
  faqs: faqsRouter,
  properties: propertiesRouter,
  cases: casesRouter,
  rulings: rulingsRouter,
  deeds: deedsRouter,
  instructions: instructionsRouter,
  waqfCategories: waqfCategoriesRouter,
  waqfAnalytics: waqfAnalyticsRouter,
  homeSections: homeSectionsRouter,
  contentTemplates: contentTemplatesRouter,
  notifications: notificationsRouter,
  comments: commentsRouter,
  reports: reportsRouter,
  digitalLibrary: digitalLibraryRouter,
  files: filesRouter,
  fetchLogs: fetchLogsRouter,
  fetcher: fetcherRouter,
  knowledgeSearch: knowledgeSearchRouter,
  knowledgeTrust: knowledgeTrustRouter,
  knowledgeActivation: knowledgeActivationRouter,
  legacyProvenance: legacyProvenanceRouter,
  roles: rolesRouter,
  permissions: permissionsRouter,
  pageSettings: pageSettingsRouter,
  conversations: conversationsRouter,
  chat: chatRouter,
  knowledge: knowledgeRouter,
  knowledgeSources: knowledgeSourcesRouter,
  sourceProvenance: sourceProvenanceRouter,
  agenticRagPilot: governedAgenticRagPilotRouter,
  references: referencesRouter,
  fetchedContent: fetchedContentRouter,
  smartProcessing: smartProcessingRouter,
  legalAnalysis: legalAnalysisRouter,
  aiTools: aiToolsRouter,
  ratings: ratingsRouter,
  file: fileRouter,
  alerts: alertsRouter,
  pdfExtraction: pdfExtractionRouter,
  platformBridge: platformBridgeRouter,
  system: systemRouter,
  systemSettings: systemSettingsRouter,
  siteSettings: siteSettingsRouter,
});

export type AppRouter = typeof appRouter;
