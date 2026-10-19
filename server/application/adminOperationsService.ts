import {
  conversations,
  faqs,
  fetchLogs,
  fetchedContent,
  knowledgeDocuments,
  knowledgeSources,
  messageRatings,
  messages,
  users,
  roles,
  permissions,
  rolePermissions,
  contactMessages,
  notifications,
  comments,
  files,
} from "../../drizzle/schema";
import {
  countTable,
  deleteTableByIdSafe,
  getOptionalAdminDb,
  insertTableSafe,
  selectAllSafe,
  updateTableByIdSafe,
} from "../infrastructure/db/adminRepository";
import {
  runtimeGetAiToolRunMetrics,
  runtimeGetKnowledgeSourcesStats,
  runtimeGetSystemSettings,
  runtimeListAiToolRuns,
} from "../runtimeRepository";

export function toBoolean(value: any) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return !["0", "false", "no", "off", "inactive"].includes(value.toLowerCase());
  }
  return false;
}

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeDate(value: any) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)
    ? raw.replace(/\s+/, "T")
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

export async function buildDailySeries(
  table: any,
  _dateField: any,
  days = 30,
  label = "count",
) {
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
    const d = safeDate(
      row?.createdAt ?? row?.created_at ?? row?.updatedAt ?? row?.updated_at,
    );
    if (!d || d < min) continue;
    const key = d.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    [label]: count,
  }));
}

function normalizeAdminUserRow(row: any, conversationCount = 0) {
  return {
    id: row.id,
    openId: row.openId ?? row.open_id ?? null,
    name: row.name || row.email || `مستخدم #${row.id}`,
    email: row.email || "",
    loginMethod: row.loginMethod ?? row.login_method ?? null,
    role: row.role || "user",
    isActive: toBoolean(row.isActive ?? row.is_active ?? 1),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    lastSignedIn:
      row.lastSignedIn ??
      row.last_signed_in ??
      row.createdAt ??
      row.created_at ??
      null,
    conversationCount,
  };
}

export async function listAdminUsers(input: any = {}) {
  const userRows = await selectAllSafe(users, 5000);
  const conversationRows = await selectAllSafe(conversations, 10000);
  const conversationCounts = new Map<number, number>();
  for (const conversation of conversationRows) {
    const userId = Number(conversation.userId ?? conversation.user_id ?? 0);
    if (!userId) continue;
    conversationCounts.set(userId, (conversationCounts.get(userId) || 0) + 1);
  }

  const search = String(input.search || "").trim().toLowerCase();
  const normalized = userRows
    .map((row) =>
      normalizeAdminUserRow(
        row,
        conversationCounts.get(Number(row.id)) || 0,
      ),
    )
    .filter((row) => !input.role || row.role === input.role)
    .filter(
      (row) =>
        !search ||
        `${row.name} ${row.email} ${row.openId}`
          .toLowerCase()
          .includes(search),
    )
    .filter((row) =>
      inDateRange(row.createdAt, input.createdAfter, input.createdBefore),
    )
    .filter((row) =>
      inDateRange(
        row.lastSignedIn,
        input.lastSignedInAfter,
        input.lastSignedInBefore,
      ),
    )
    .sort((a, b) =>
      `${b.createdAt || ""}`.localeCompare(`${a.createdAt || ""}`),
    );

  const result = paginate(normalized, input.page, input.limit);
  return {
    users: result.rows,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function updateAdminUser(userId: number, updates: any) {
  const row = await updateTableByIdSafe(users, userId, updates);
  return row ? normalizeAdminUserRow(row) : null;
}

export async function listAdminFaqs() {
  const rows = await selectAllSafe(faqs, 5000);
  return rows
    .map((row) => ({
      ...row,
      isActive: toBoolean(row.isActive ?? row.is_active ?? 0),
      viewCount: toNumber(row.viewCount ?? row.view_count, 0),
    }))
    .sort(
      (a, b) =>
        toNumber(a.order, 0) - toNumber(b.order, 0) ||
        toNumber(b.viewCount, 0) - toNumber(a.viewCount, 0),
    );
}

export async function updateAdminFaq(id: number, updates: any) {
  const payload: any = { ...updates };
  if ("isActive" in payload) payload.isActive = payload.isActive ? 1 : 0;
  const row = await updateTableByIdSafe(faqs, id, payload);
  return row
    ? { ...row, isActive: toBoolean((row as any).isActive) }
    : null;
}

// Compatibility aliases kept only for the router migration window.
// New application consumers should use the shorter service names.
export const listAdminUsersInternal = listAdminUsers;
export const updateAdminUserInternal = updateAdminUser;
export const listFaqsInternal = listAdminFaqs;
export const updateFaqInternal = updateAdminFaq;

export async function getAdminDashboardStats(activeBackendRoutes = 0) {
  const [
    totalUsers,
    totalConversations,
    totalMessages,
    totalFAQs,
    totalDocuments,
  ] = await Promise.all([
    countTable(users),
    countTable(conversations),
    countTable(messages),
    countTable(faqs),
    countTable(knowledgeDocuments),
  ]);
  const toolMetrics = await runtimeGetAiToolRunMetrics().catch(() => ({
    total: 0,
    byRunStatus: {},
    byApproval: {},
    byTool: {},
  }));
  return {
    totalUsers,
    totalConversations,
    totalMessages,
    totalFAQs,
    totalDocuments,
    totalAiToolRuns: toolMetrics.total || 0,
    activeBackendRoutes,
  };
}

export async function getFaqDistribution() {
  const rows = await listAdminFaqs();
  const byCategory = new Map<string, number>();
  for (const row of rows) {
    byCategory.set(
      row.category || "general",
      (byCategory.get(row.category || "general") || 0) + 1,
    );
  }
  return Array.from(byCategory.entries()).map(([category, count]) => ({
    category,
    count,
  }));
}

export async function getAdminActivityLog(input: any = {}) {
  const limit = Math.min(Math.max(Number(input.limit || 50), 1), 100);
  const type = input.type || "all";
  const activities: any[] = [];

  if (type === "all" || type === "conversations") {
    const rows = await selectAllSafe(conversations, limit);
    activities.push(
      ...rows.map((row) => ({
        id: row.id,
        type: "conversation",
        title: row.title || `محادثة #${row.id}`,
        userName: row.userId ? `مستخدم #${row.userId}` : null,
        createdAt: row.updatedAt || row.createdAt,
      })),
    );
  }
  if (type === "all" || type === "messages") {
    const rows = await selectAllSafe(messages, limit);
    activities.push(
      ...rows.map((row) => ({
        id: row.id,
        type: "message",
        title: String(row.content || "").slice(0, 120) || `رسالة #${row.id}`,
        userName: null,
        createdAt: row.createdAt,
      })),
    );
  }
  if (type === "all" || type === "faqs") {
    const rows = await listAdminFaqs();
    activities.push(
      ...rows.slice(0, limit).map((row) => ({
        id: row.id,
        type: "faq",
        title: row.question || `سؤال شائع #${row.id}`,
        userName: null,
        createdAt: row.updatedAt || row.createdAt,
      })),
    );
  }

  if (activities.length === 0) {
    const runs = await runtimeListAiToolRuns({ limit }).catch(() => []);
    activities.push(
      ...(runs || []).map((row: any) => ({
        id: row.id,
        type: "ai_tool_run",
        title: row.title || `تشغيل أداة ${row.tool_key}`,
        userName: row.created_by_admin_user_id
          ? `إداري #${row.created_by_admin_user_id}`
          : null,
        createdAt: row.created_at,
      })),
    );
  }

  return activities
    .sort((a, b) => runtimeDateTime(b.createdAt) - runtimeDateTime(a.createdAt))
    .slice(0, limit)
    .map((activity) => ({
      ...activity,
      createdAt: normalizeRuntimeDate(activity.createdAt),
    }));
}

export async function getAnalyticsRatingStats() {
  const rows = await selectAllSafe(messageRatings, 10000);
  const positive = rows.filter((r) => String(r.rating) === "helpful").length;
  const negative = rows.filter((r) => String(r.rating) === "not_helpful").length;
  const total = positive + negative;
  const positivePercentage = total
    ? Math.round((positive / total) * 100)
    : 0;
  return {
    total,
    positive,
    negative,
    positivePercentage,
    negativePercentage: total ? 100 - positivePercentage : 0,
  };
}

export async function getNegativeRatingAnalysis() {
  const ratingsRows = await selectAllSafe(messageRatings, 10000);
  const messageRows = await selectAllSafe(messages, 10000);
  const byMessageId = new Map(messageRows.map((m) => [Number(m.id), m]));
  const negatives = ratingsRows.filter(
    (r) => String(r.rating) === "not_helpful",
  );
  let withoutSources = 0;
  let shortResponses = 0;
  for (const rating of negatives) {
    const msg = byMessageId.get(
      Number(rating.messageId ?? rating.message_id),
    );
    if (!msg?.sources) withoutSources++;
    if (String(msg?.content || "").length < 160) shortResponses++;
  }
  const commonIssues: string[] = [];
  if (withoutSources > 0) commonIssues.push("نقص المصادر");
  if (shortResponses > 0) commonIssues.push("إجابات قصيرة");
  if (negatives.length > 0 && commonIssues.length === 0) {
    commonIssues.push("تحتاج مراجعة نوعية");
  }
  return {
    totalNegative: negatives.length,
    withoutSources,
    shortResponses,
    commonIssues,
  };
}

export async function getFrequentUserQuestions(limit = 10) {
  const rows = await selectAllSafe(messages, 10000);
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.role !== "user") continue;
    const value = String(row.content || "").trim();
    if (!value) continue;
    const key = value.slice(0, 260);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ content: value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.min(Math.max(Number(limit) || 10, 1), 50));
}

export async function getBestRatedAnswers(limit = 10) {
  const ratingsRows = await selectAllSafe(messageRatings, 10000);
  const messageRows = await selectAllSafe(messages, 10000);
  const byMessageId = new Map(messageRows.map((m) => [Number(m.id), m]));
  const counts = new Map<number, number>();
  for (const rating of ratingsRows) {
    if (String(rating.rating) !== "helpful") continue;
    const messageId = Number(rating.messageId ?? rating.message_id);
    counts.set(messageId, (counts.get(messageId) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([messageId, positiveRatings]) => ({
      messageId,
      positiveRatings,
      content: String(byMessageId.get(messageId)?.content || "").slice(0, 300),
    }))
    .sort((a, b) => b.positiveRatings - a.positiveRatings)
    .slice(0, Math.min(Math.max(Number(limit) || 10, 1), 50));
}

export async function getOperationsSnapshot(
  kind: "cache" | "integrations" | "webhooks" | "backup",
) {
  const settings = await runtimeGetSystemSettings().catch(() => ({} as any));
  const toolMetrics = await runtimeGetAiToolRunMetrics().catch(() => ({
    total: 0,
    byRunStatus: {},
    byApproval: {},
    byTool: {},
  }));
  const sourceStats = await runtimeGetKnowledgeSourcesStats().catch(() => ({
    totalSources: 0,
    activeSources: 0,
    successRate: 0,
    lastFetchDate: null,
  }));
  const cacheStats = await import("../cache")
    .then((m) => m.getCacheStats())
    .catch(() => ({
      totalCached: 0,
      totalHits: 0,
      avgRating: 0,
      topQuestions: [],
    }));
  const now = new Date().toISOString();

  if (kind === "cache") {
    return {
      generatedAt: now,
      status: "connected",
      title: "إدارة Cache مفعلة للقراءة التشغيلية",
      metrics: {
        totalCached: cacheStats.totalCached || 0,
        totalHits: cacheStats.totalHits || 0,
        avgRating: cacheStats.avgRating || 0,
        aiToolRuns: toolMetrics.total || 0,
      },
      topQuestions: cacheStats.topQuestions || [],
      actions: [
        {
          key: "cleanExpired",
          label: "تنظيف المنتهي",
          enabled: true,
          mode: "safe",
        },
      ],
    };
  }

  if (kind === "integrations") {
    const envChecks = [
      {
        key: "supabase",
        label: "Supabase Assistant Runtime",
        configured: Boolean(
          process.env.PWF_SUPABASE_URL ||
            process.env.SUPABASE_URL ||
            process.env.VITE_SUPABASE_URL,
        ),
      },
      {
        key: "llm",
        label: "LLM Provider",
        configured:
          Boolean(settings.llmEnabled) && settings.llmProvider !== "disabled",
      },
      {
        key: "email",
        label: "SMTP Email",
        configured: Boolean(settings.emailEnabled),
      },
      {
        key: "fetching",
        label: "Knowledge Fetchers",
        configured: (sourceStats.totalSources || 0) > 0,
      },
    ];
    return {
      generatedAt: now,
      status: "connected",
      title: "التكاملات مربوطة بقراءة إعدادات النظام والمصادر",
      metrics: {
        configured: envChecks.filter((item) => item.configured).length,
        total: envChecks.length,
        activeSources: sourceStats.activeSources || 0,
        successRate: sourceStats.successRate || 0,
      },
      integrations: envChecks,
    };
  }

  if (kind === "webhooks") {
    const events = [
      {
        event: "ai_tool_run.completed",
        source: "assistant.ai_tool_runs",
        enabled: true,
        mode: "internal_event",
      },
      {
        event: "ai_tool_run.approved",
        source: "assistant.ai_tool_run_events",
        enabled: true,
        mode: "internal_event",
      },
      {
        event: "knowledge_document.created",
        source: "assistant.knowledge_documents",
        enabled: true,
        mode: "internal_event",
      },
      {
        event: "fetched_content.approved",
        source: "assistant.fetched_content",
        enabled: true,
        mode: "internal_event",
      },
    ];
    return {
      generatedAt: now,
      status: "connected",
      title: "Webhooks مفعلة كخريطة أحداث داخلية دون إرسال خارجي تلقائي",
      metrics: {
        totalEvents: events.length,
        externalDispatch: 0,
        internalEvents: events.length,
      },
      events,
    };
  }

  return {
    generatedAt: now,
    status: "connected",
    title: "النسخ الاحتياطي مفعل كـ manifest حوكمي آمن",
    metrics: {
      knowledgeDocuments: await countTable(knowledgeDocuments),
      knowledgeSources: await countTable(knowledgeSources),
      fetchedContent: await countTable(fetchedContent),
      fetchLogs: await countTable(fetchLogs),
      aiToolRuns: toolMetrics.total || 0,
    },
    includedScopes: [
      "assistant.knowledge_documents",
      "assistant.knowledge_sources",
      "assistant.fetched_content",
      "assistant.ai_tool_runs",
      "runtime settings",
    ],
  };
}


export async function isAdminDatabaseAvailable() {
  return Boolean(await getOptionalAdminDb());
}

export async function getAdminUserActivity(userId: number) {
  const conversationRows = (await selectAllSafe(conversations, 5000)).filter(
    (row) => Number(row.userId ?? row.user_id) === userId,
  );
  const conversationIds = new Set(conversationRows.map((row) => Number(row.id)));
  const messageRows = (await selectAllSafe(messages, 10000)).filter((row) =>
    conversationIds.has(Number(row.conversationId ?? row.conversation_id)),
  );

  const items = [
    ...conversationRows.slice(0, 10).map((row) => ({
      type: "conversation",
      title: row.title || `محادثة #${row.id}`,
      createdAt: row.createdAt ?? row.created_at,
    })),
    ...messageRows.slice(0, 10).map((row) => ({
      type: "message",
      title: String(row.content || "").slice(0, 120),
      createdAt: row.createdAt ?? row.created_at,
    })),
  ]
    .sort((a, b) => `${b.createdAt || ""}`.localeCompare(`${a.createdAt || ""}`))
    .slice(0, 15);

  const lastActivity = [...conversationRows, ...messageRows]
    .map((row) => row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at)
    .filter(Boolean)
    .sort()
    .reverse()[0] || null;

  return {
    conversationCount: conversationRows.length,
    messageCount: messageRows.length,
    averageRating: 0,
    lastActivity,
    items,
  };
}

export async function getAdminSecurityCounts() {
  const [userCount, roleCount, permissionCount, rolePermissionCount] = await Promise.all([
    countTable(users),
    countTable(roles),
    countTable(permissions),
    countTable(rolePermissions),
  ]);
  return {
    users: userCount,
    roles: roleCount,
    permissions: permissionCount,
    rolePermissions: rolePermissionCount,
  };
}

export async function storeContactMessage(input: any) {
  if (!(await isAdminDatabaseAvailable())) {
    return {
      success: true,
      stored: false,
      mode: "local_no_db",
      message: "تم استلام الرسالة محليًا دون حفظ قاعدة بيانات.",
    };
  }
  await insertTableSafe(contactMessages, {
    name: input?.name || "زائر",
    email: input?.email || "unknown@example.local",
    subject: input?.subject || "رسالة تواصل",
    message: input?.message || input?.content || "",
    userId: null,
    status: "new",
  } as any);
  return { success: true, stored: true };
}

export async function listAdminNotifications() {
  return selectAllSafe(notifications, 500);
}

export async function createAdminNotification(input: any, createdBy: number | null | undefined) {
  const typeMap: Record<string, string> = {
    info: "announcement",
    success: "update",
    warning: "alert",
    error: "system",
  };
  await insertTableSafe(notifications, {
    title: input?.title || "إشعار",
    content: input?.message || input?.content || "",
    type: (typeMap[input?.type] || input?.type || "announcement") as any,
    targetAudience: input?.targetUserIds?.length ? "specific" : "all",
    targetUserIds: input?.targetUserIds?.length ? JSON.stringify(input.targetUserIds) : null,
    status: "sent",
    sentCount: input?.targetUserIds?.length || 0,
    readCount: 0,
    createdBy: createdBy || 1,
    userId: input?.targetUserIds?.[0] || null,
  } as any);
  return { success: true };
}

export async function deleteAdminNotification(id: number) {
  return deleteTableByIdSafe(notifications, id);
}

export async function listAdminComments() {
  const rows = await selectAllSafe(comments, 1000);
  return rows.map((row: any) => ({
    ...row,
    status: row.isApproved ? "approved" : "pending",
    userName: row.userId ? `مستخدم #${row.userId}` : null,
  }));
}

export async function setAdminCommentApproval(id: number, approved: boolean) {
  return updateTableByIdSafe(comments, id, { isApproved: approved ? 1 : 0 });
}

export async function deleteAdminComment(id: number) {
  return deleteTableByIdSafe(comments, id);
}

export async function listAdminFiles() {
  return selectAllSafe(files, 1000);
}

export async function linkAdminFileToEntity(
  id: number,
  entityType: string | null | undefined,
  entityId: number | null | undefined,
) {
  return updateTableByIdSafe(files, id, {
    linkedEntityType: entityType || "none",
    linkedEntityId: entityId || null,
  });
}

export async function unlinkAdminFileFromEntity(id: number) {
  return updateTableByIdSafe(files, id, {
    linkedEntityType: "none",
    linkedEntityId: null,
  });
}
