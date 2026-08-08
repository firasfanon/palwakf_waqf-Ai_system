import fs from 'node:fs/promises';
import path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), '.palwakf/runtime/local_runtime_store.json');

type Category = 'law' | 'jurisprudence' | 'majalla' | 'historical' | 'administrative' | 'reference';
type SourceType = 'wikipedia' | 'rss' | 'scraper' | 'pdf_url' | 'api';
type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'processing';
type KnowledgeReviewStatus = 'draft' | 'review_only' | 'approved' | 'rejected';

type AssistantProfile = {
  id: string;
  name: string;
  description: string;
  llmEnabled: boolean;
  llmProvider: 'ollama' | 'openai_compatible' | 'disabled';
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmTimeoutSeconds: number;
  isEnabled: boolean;
  isDefault: boolean;
};

type LocalStore = {
  meta: {
    nextKnowledgeDocumentId: number;
    nextConversationId: number;
    nextMessageId: number;
    nextKnowledgeSourceId: number;
    nextFetchedContentId: number;
    nextFetchLogId: number;
    nextClassificationRatingId: number;
    nextFetchedContentReviewEventId: number;
    nextDocumentFileId: number;
  };
  systemSettings: any;
  knowledgeDocuments: any[];
  documentFiles: any[];
  conversations: any[];
  messages: any[];
  knowledgeSources: any[];
  fetchedContent: any[];
  fetchLogs: any[];
  classificationRatings: any[];
  fetchedContentReviewEvents: any[];
};



function defaultAssistantProfile(seed?: Partial<AssistantProfile>): AssistantProfile {
  return {
    id: seed?.id || 'assistant_default',
    name: typeof seed?.name === 'string' && seed.name.trim() ? seed.name.trim() : 'المساعد الافتراضي',
    description: typeof seed?.description === 'string' && seed.description.trim() ? seed.description.trim() : 'المساعد المحلي الأساسي المستخدم افتراضيًا.',
    llmEnabled: normalizeBoolean(seed?.llmEnabled, true),
    llmProvider: normalizeProvider(seed?.llmProvider),
    llmBaseUrl: normalizeString(seed?.llmBaseUrl, 'http://127.0.0.1:11434'),
    llmApiKey: normalizeString(seed?.llmApiKey, 'ollama') || 'ollama',
    llmModel: normalizeString(seed?.llmModel, 'qwen2.5:3b') || 'qwen2.5:3b',
    llmTimeoutSeconds: normalizeNumber(seed?.llmTimeoutSeconds, 180, 5, 300),
    isEnabled: normalizeBoolean(seed?.isEnabled, true),
    isDefault: normalizeBoolean(seed?.isDefault, false),
  };
}

function sanitizeAssistantProfiles(profiles: any, fallback: any) {
  const source = Array.isArray(profiles) && profiles.length ? profiles : [fallback];
  const normalized = source.map((profile: any, index: number) => defaultAssistantProfile({
    ...fallback,
    ...(profile || {}),
    id: normalizeString(profile?.id, `assistant_${index + 1}`) || `assistant_${index + 1}`,
    isDefault: profile?.isDefault ?? index === 0,
  }));
  if (!normalized.some((profile: AssistantProfile) => profile.isDefault)) {
    normalized[0].isDefault = true;
  }
  return normalized;
}

function resolveActiveAssistantProfile(profiles: AssistantProfile[], activeId: any) {
  const requestedId = normalizeString(activeId, '');
  return profiles.find((profile) => profile.id === requestedId)
    || profiles.find((profile) => profile.isDefault)
    || profiles[0];
}

const defaultSystemSettings = () => {
  const assistantProfile = defaultAssistantProfile({ id: "assistant_default", isDefault: true });
  return ({
  registrationEnabled: true,
  dailyQuestionLimit: 50,
  requireEmailVerification: false,
  welcomeMessageEnabled: true,
  welcomeMessageTitle: 'مرحباً بك في نظام الأوقاف الإسلامية',
  welcomeMessageContent: '',
  emailEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  emailFromAddress: '',
  emailFromName: '',
  maintenanceMode: false,
  maintenanceMessage: '',
  llmEnabled: true,
  llmProvider: 'ollama',
  llmBaseUrl: 'http://127.0.0.1:11434',
  llmApiKey: 'ollama',
  llmModel: 'qwen2.5:3b',
  llmTimeoutSeconds: 180,
  llmLastTestStatus: 'untested',
  llmLastTestMessage: '',
  llmLastTestAt: null,
  assistantProfiles: [assistantProfile],
  activeAssistantProfileId: assistantProfile.id,
});
};

function normalizeBoolean(value: any, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeNumber(value: any, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeString(value: any, fallback: string) {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function normalizeProvider(value: any): 'ollama' | 'openai_compatible' | 'disabled' {
  const normalized = normalizeString(value, 'ollama');
  if (normalized === 'openai_compatible' || normalized === 'disabled' || normalized === 'ollama') return normalized;
  return 'ollama';
}

function sanitizeSystemSettings(value: any) {
  const defaults = defaultSystemSettings();
  const merged = { ...defaults, ...(value || {}) };
  const fallbackProfile = defaultAssistantProfile({
    id: 'assistant_default',
    name: 'المساعد الافتراضي',
    description: 'المساعد المحلي الأساسي المستخدم افتراضيًا.',
    llmEnabled: normalizeBoolean(merged.llmEnabled, true),
    llmProvider: normalizeProvider(merged.llmProvider),
    llmBaseUrl: normalizeString(merged.llmBaseUrl, 'http://127.0.0.1:11434'),
    llmApiKey: normalizeString(merged.llmApiKey, 'ollama') || 'ollama',
    llmModel: normalizeString(merged.llmModel, 'qwen2.5:3b') || 'qwen2.5:3b',
    llmTimeoutSeconds: normalizeNumber(merged.llmTimeoutSeconds, 180, 5, 300),
    isEnabled: true,
    isDefault: true,
  });

  const assistantProfiles = sanitizeAssistantProfiles(merged.assistantProfiles, fallbackProfile);
  const activeAssistantProfile = resolveActiveAssistantProfile(assistantProfiles, merged.activeAssistantProfileId) || fallbackProfile;

  return {
    registrationEnabled: normalizeBoolean(merged.registrationEnabled, true),
    dailyQuestionLimit: normalizeNumber(merged.dailyQuestionLimit, 50, 1, 10000),
    requireEmailVerification: normalizeBoolean(merged.requireEmailVerification, false),
    welcomeMessageEnabled: normalizeBoolean(merged.welcomeMessageEnabled, true),
    welcomeMessageTitle: normalizeString(merged.welcomeMessageTitle, defaults.welcomeMessageTitle),
    welcomeMessageContent: normalizeString(merged.welcomeMessageContent, ''),
    emailEnabled: normalizeBoolean(merged.emailEnabled, false),
    smtpHost: normalizeString(merged.smtpHost, ''),
    smtpPort: normalizeNumber(merged.smtpPort, 587, 1, 65535),
    smtpUser: normalizeString(merged.smtpUser, ''),
    smtpPassword: normalizeString(merged.smtpPassword, ''),
    emailFromAddress: normalizeString(merged.emailFromAddress, ''),
    emailFromName: normalizeString(merged.emailFromName, ''),
    maintenanceMode: normalizeBoolean(merged.maintenanceMode, false),
    maintenanceMessage: normalizeString(merged.maintenanceMessage, ''),
    llmEnabled: activeAssistantProfile.llmEnabled,
    llmProvider: activeAssistantProfile.llmProvider,
    llmBaseUrl: activeAssistantProfile.llmBaseUrl,
    llmApiKey: activeAssistantProfile.llmApiKey,
    llmModel: activeAssistantProfile.llmModel,
    llmTimeoutSeconds: activeAssistantProfile.llmTimeoutSeconds,
    llmLastTestStatus: merged.llmLastTestStatus === 'ok' || merged.llmLastTestStatus === 'failed' ? merged.llmLastTestStatus : 'untested',
    llmLastTestMessage: normalizeString(merged.llmLastTestMessage, ''),
    llmLastTestAt: merged.llmLastTestAt ?? null,
    assistantProfiles,
    activeAssistantProfileId: activeAssistantProfile.id,
  };
}

let cache: LocalStore | null = null;

export function nowString() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function inferCategory(filePath: string, content: string): Category {
  const lower = `${filePath}\n${content}`.toLowerCase();
  if (lower.includes('fiqh') || lower.includes('فقه') || lower.includes('شرعي')) return 'jurisprudence';
  if (lower.includes('ottoman') || lower.includes('عثمان') || lower.includes('مجلة')) return 'majalla';
  if (lower.includes('historical') || lower.includes('تاريخ')) return 'historical';
  if (lower.includes('administrative') || lower.includes('إدار') || lower.includes('تعليمات')) return 'administrative';
  if (lower.includes('law') || lower.includes('قانون') || lower.includes('تشريع')) return 'law';
  return 'reference';
}

async function bootstrapStore(): Promise<LocalStore> {
  const store: LocalStore = {
    meta: {
      nextKnowledgeDocumentId: 1,
      nextConversationId: 1,
      nextMessageId: 1,
      nextKnowledgeSourceId: 1,
      nextFetchedContentId: 1,
      nextFetchLogId: 1,
      nextClassificationRatingId: 1,
      nextFetchedContentReviewEventId: 1,
      nextDocumentFileId: 1,
    },
    systemSettings: defaultSystemSettings(),
    knowledgeDocuments: [],
    documentFiles: [],
    conversations: [],
    messages: [],
    knowledgeSources: [],
    fetchedContent: [],
    fetchLogs: [],
    classificationRatings: [],
    fetchedContentReviewEvents: [],
  };

  const seedFiles = [
    'knowledge_data/knowledge_base.md',
    'knowledge_data/sources_and_references.md',
    'research_data/administrative_regulations.md',
    'research_data/fiqh_references.md',
    'research_data/historical_waqf_info.md',
    'research_data/ottoman_land_law_1858.md',
    'research_data/palestinian_waqf_law_1966.md',
    'collected_data/law_2023_02.txt',
  ];

  for (const filePath of seedFiles) {
    try {
      const content = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf8');
      const createdAt = nowString();
      const sourceId = store.meta.nextKnowledgeSourceId++;
      store.knowledgeSources.push({
        id: sourceId,
        name: path.basename(filePath),
        type: 'pdf_url' as SourceType,
        url: `local://${filePath}`,
        config: JSON.stringify({ seed: true, filePath }),
        isActive: 1,
        fetchFrequency: 'manual',
        lastFetchAt: null,
        itemsCount: 1,
        successCount: 1,
        errorCount: 0,
        createdBy: null,
        createdAt,
        updatedAt: createdAt,
      });
      store.knowledgeDocuments.push({
        id: store.meta.nextKnowledgeDocumentId++,
        title: content.split('\n').find((line) => line.trim())?.replace(/^#\s*/, '') || path.basename(filePath),
        content,
        category: inferCategory(filePath, content),
        source: path.basename(filePath),
        sourceUrl: `local://${filePath}`,
        tags: 'محلي,seed,base',
        isActive: 1,
        createdBy: null,
        createdAt,
        updatedAt: createdAt,
        pdfUrl: null,
        embedding: null,
      });
    } catch {}
  }

  return store;
}

async function save(store: LocalStore) {
  cache = store;
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function getStore(): Promise<LocalStore> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as LocalStore;
    cache.systemSettings = sanitizeSystemSettings(cache.systemSettings || {});
  } catch {
    cache = await bootstrapStore();
    await save(cache);
  }
  return cache;
}

async function mutate<T>(fn: (store: LocalStore) => T | Promise<T>): Promise<T> {
  const store = await getStore();
  const result = await fn(store);
  await save(store);
  return result;
}


// System settings
export async function getSystemSettings() {
  const store = await getStore();
  return sanitizeSystemSettings(store.systemSettings || {});
}

export async function updateSystemSettings(updates: any) {
  return mutate((store) => {
    const current = sanitizeSystemSettings(store.systemSettings || {});
    const merged = {
      ...current,
      ...updates,
      llmLastTestStatus: updates.llmLastTestStatus ?? current.llmLastTestStatus ?? 'untested',
      llmLastTestMessage: updates.llmLastTestMessage ?? current.llmLastTestMessage ?? '',
      llmLastTestAt: updates.llmLastTestAt ?? current.llmLastTestAt ?? null,
    };

    const profiles = sanitizeAssistantProfiles(merged.assistantProfiles, {
      id: current.activeAssistantProfileId || 'assistant_default',
      name: current.assistantProfiles?.find((profile: AssistantProfile) => profile.id === current.activeAssistantProfileId)?.name || 'المساعد الافتراضي',
      description: current.assistantProfiles?.find((profile: AssistantProfile) => profile.id === current.activeAssistantProfileId)?.description || 'المساعد المحلي الأساسي المستخدم افتراضيًا.',
      llmEnabled: merged.llmEnabled,
      llmProvider: merged.llmProvider,
      llmBaseUrl: merged.llmBaseUrl,
      llmApiKey: merged.llmApiKey,
      llmModel: merged.llmModel,
      llmTimeoutSeconds: merged.llmTimeoutSeconds,
      isEnabled: true,
      isDefault: true,
    });

    const activeId = normalizeString(merged.activeAssistantProfileId, '') || current.activeAssistantProfileId || profiles[0]?.id;
    const syncedProfiles = profiles.map((profile: AssistantProfile) => {
      if (profile.id !== activeId) return profile;
      return defaultAssistantProfile({
        ...profile,
        llmEnabled: normalizeBoolean(merged.llmEnabled, profile.llmEnabled),
        llmProvider: normalizeProvider(merged.llmProvider),
        llmBaseUrl: normalizeString(merged.llmBaseUrl, profile.llmBaseUrl),
        llmApiKey: normalizeString(merged.llmApiKey, profile.llmApiKey),
        llmModel: normalizeString(merged.llmModel, profile.llmModel),
        llmTimeoutSeconds: normalizeNumber(merged.llmTimeoutSeconds, profile.llmTimeoutSeconds, 5, 300),
      });
    });

    const next = sanitizeSystemSettings({
      ...merged,
      assistantProfiles: syncedProfiles,
      activeAssistantProfileId: activeId,
    });
    store.systemSettings = next;
    return next;
  });
}


function normalizeKnowledgeReviewStatus(value: any): KnowledgeReviewStatus {
  if (value === 'approved' || value === 'rejected' || value === 'review_only' || value === 'draft') return value;
  return 'draft';
}

function buildKnowledgeReviewTraceEntry(input: {
  eventType: string;
  status: KnowledgeReviewStatus;
  decision?: string | null;
  notes?: string | null;
  actorUserId?: number | null;
  source?: string | null;
}) {
  return {
    eventType: input.eventType,
    status: input.status,
    decision: input.decision ?? null,
    notes: input.notes ?? null,
    actorUserId: input.actorUserId ?? null,
    source: input.source ?? null,
    at: nowString(),
  };
}

function ensureKnowledgeDocumentDefaults(doc: any) {
  const status = normalizeKnowledgeReviewStatus(doc?.status);
  const isApproved = status === 'approved';
  const approvalVersion = typeof doc?.approvalVersion === 'number' ? doc.approvalVersion : (isApproved ? 1 : 0);
  const reviewTrace = Array.isArray(doc?.reviewTrace) ? doc.reviewTrace : [];
  return {
    status,
    reviewDecision: doc?.reviewDecision ?? (isApproved ? 'approve' : status === 'rejected' ? 'reject' : status === 'review_only' ? 'review_only' : null),
    reviewNotes: doc?.reviewNotes ?? null,
    reviewedAt: doc?.reviewedAt ?? null,
    reviewedBy: doc?.reviewedBy ?? null,
    approvalVersion,
    isChatEligible: doc?.isChatEligible ?? (isApproved ? 1 : 0),
    reviewTrace,
  };
}

// Knowledge docs
export async function listKnowledgeDocuments(filters?: { category?: string; isActive?: number; search?: string }) {
  const store = await getStore();
  const search = filters?.search?.trim().toLowerCase();
  return [...store.knowledgeDocuments]
    .map((d) => ({ ...d, ...ensureKnowledgeDocumentDefaults(d) }))
    .filter((d) => (filters?.category ? d.category === filters.category : true))
    .filter((d) => (filters?.isActive !== undefined ? d.isActive === filters.isActive : true))
    .filter((d) => (search ? `${d.title} ${d.content}`.toLowerCase().includes(search) : true))
    .sort((a, b) => `${b.updatedAt || b.createdAt}`.localeCompare(`${a.updatedAt || a.createdAt}`));
}
export async function getKnowledgeDocument(id: number) { const store = await getStore(); const doc = store.knowledgeDocuments.find((d) => d.id === id); return doc ? { ...doc, ...ensureKnowledgeDocumentDefaults(doc) } : undefined; }
export async function createKnowledgeDocument(doc: any) {
  return mutate((store) => {
    const createdAt = nowString();
    const status = normalizeKnowledgeReviewStatus(doc?.status);
    const defaults = ensureKnowledgeDocumentDefaults({ ...doc, status });
    const record = {
      id: store.meta.nextKnowledgeDocumentId++,
      isActive: doc?.isActive ?? (status === 'approved' ? 1 : 0),
      createdAt,
      updatedAt: createdAt,
      embedding: null,
      pdfUrl: null,
      ...defaults,
      ...doc,
      status,
      reviewTrace: [
        buildKnowledgeReviewTraceEntry({
          eventType: 'created',
          status,
          notes: doc?.reviewNotes || 'تم إنشاء الوثيقة في مسار المراجعة.',
          actorUserId: doc?.createdBy ?? null,
          source: 'knowledge_document',
        }),
        ...defaults.reviewTrace,
      ],
    };
    store.knowledgeDocuments.push(record);
    return record;
  });
}
export async function updateKnowledgeDocument(id: number, updates: any) {
  return mutate((store) => {
    const i = store.knowledgeDocuments.findIndex((d) => d.id === id);
    if (i === -1) return undefined;
    const current = store.knowledgeDocuments[i];
    const trackedFields = ['title', 'content', 'category', 'source', 'sourceUrl', 'tags', 'pdfUrl'];
    const changedFields = trackedFields.filter((field) => Object.prototype.hasOwnProperty.call(updates || {}, field) && `${current?.[field] ?? ''}` !== `${updates?.[field] ?? ''}`);
    const merged = { ...current, ...updates, updatedAt: nowString() };
    const defaults = ensureKnowledgeDocumentDefaults(merged);
    const nextTrace = Array.isArray(current?.reviewTrace) ? [...current.reviewTrace] : [];
    if (changedFields.length > 0) {
      nextTrace.unshift(
        buildKnowledgeReviewTraceEntry({
          eventType: 'updated',
          status: defaults.status,
          notes: `تم تعديل الحقول التالية: ${changedFields.join('، ')}`,
          actorUserId: updates?.updatedBy ?? updates?.createdBy ?? current?.createdBy ?? null,
          source: updates?.source || 'knowledge_edit',
        })
      );
    }
    store.knowledgeDocuments[i] = { ...merged, ...defaults, reviewTrace: nextTrace };
    return store.knowledgeDocuments[i];
  });
}

export async function createKnowledgeDocumentFromTool(input: {
  tool: 'extract' | 'classify' | 'summarize' | string;
  title: string;
  content: string;
  category?: Category;
  tags?: string | null;
  sourceText?: string | null;
  createdBy?: number | null;
  metadata?: any;
}) {
  const toolLabelMap: Record<string, string> = {
    extract: 'أداة الاستخراج',
    classify: 'أداة التصنيف',
    summarize: 'أداة التلخيص',
  };
  const toolLabel = toolLabelMap[input.tool] || `أداة ${input.tool}`;
  return createKnowledgeDocument({
    title: input.title,
    content: input.content,
    category: input.category || 'reference',
    source: toolLabel,
    sourceUrl: null,
    tags: input.tags || null,
    createdBy: input.createdBy ?? null,
    status: 'review_only',
    reviewDecision: 'review_only',
    reviewNotes: `تم إنشاء هذه الوثيقة آليًا من ${toolLabel} وتحتاج إلى مراجعة واعتماد قبل استخدامها في الشات.`,
    reviewedAt: null,
    reviewedBy: null,
    approvalVersion: 0,
    isChatEligible: 0,
    isActive: 0,
    toolOrigin: input.tool,
    sourceText: input.sourceText || null,
    toolMetadata: input.metadata || null,
    reviewTrace: [
      buildKnowledgeReviewTraceEntry({
        eventType: 'tool_generated',
        status: 'review_only',
        decision: 'review_only',
        notes: `تم توليد الوثيقة عبر ${toolLabel} وإرسالها إلى مسار المراجعة.`,
        actorUserId: input.createdBy ?? null,
        source: `smart_tool:${input.tool}`,
      }),
    ],
  });
}

export async function reviewKnowledgeDocument(id: number, input: { status: KnowledgeReviewStatus; notes?: string | null; reviewedBy?: number | null; }) {
  return mutate((store) => {
    const i = store.knowledgeDocuments.findIndex((d) => d.id === id);
    if (i === -1) return undefined;
    const current = ensureKnowledgeDocumentDefaults(store.knowledgeDocuments[i]);
    const nextStatus = normalizeKnowledgeReviewStatus(input.status);
    const isApproved = nextStatus === 'approved';
    const nextTrace = [
      buildKnowledgeReviewTraceEntry({
        eventType: 'review_status_changed',
        status: nextStatus,
        decision: isApproved ? 'approve' : nextStatus === 'rejected' ? 'reject' : nextStatus === 'review_only' ? 'review_only' : 'draft',
        notes: input.notes || null,
        actorUserId: input.reviewedBy ?? null,
        source: 'manual_review',
      }),
      ...(Array.isArray(current.reviewTrace) ? current.reviewTrace : []),
    ];
    const approvalVersion = isApproved ? (current.approvalVersion || 0) + 1 : (current.approvalVersion || 0);
    store.knowledgeDocuments[i] = {
      ...store.knowledgeDocuments[i],
      status: nextStatus,
      reviewDecision: isApproved ? 'approve' : nextStatus === 'rejected' ? 'reject' : nextStatus === 'review_only' ? 'review_only' : null,
      reviewNotes: input.notes || null,
      reviewedAt: nowString(),
      reviewedBy: input.reviewedBy ?? null,
      approvalVersion,
      isChatEligible: isApproved ? 1 : 0,
      isActive: isApproved ? 1 : 0,
      reviewTrace: nextTrace,
      updatedAt: nowString(),
    };
    return store.knowledgeDocuments[i];
  });
}
export async function getKnowledgeReviewTrace(id: number) {
  const doc = await getKnowledgeDocument(id);
  return Array.isArray(doc?.reviewTrace) ? doc.reviewTrace : [];
}
export async function deleteKnowledgeDocument(id: number) { return mutate((store) => { store.knowledgeDocuments = store.knowledgeDocuments.filter((d) => d.id !== id); }); }

export async function listDocumentFiles(documentId: number) {
  const store = await getStore();
  return [...store.documentFiles]
    .filter((f) => f.documentId === documentId)
    .sort((a, b) => `${b.createdAt || ''}`.localeCompare(`${a.createdAt || ''}`));
}
export async function addDocumentFile(file: any) {
  return mutate((store) => {
    const createdAt = nowString();
    const record = {
      id: store.meta.nextDocumentFileId++,
      createdAt,
      updatedAt: createdAt,
      isOcr: file.isOcr ?? 1,
      ...file,
    };
    store.documentFiles.push(record);
    return record;
  });
}
export async function deleteDocumentFile(id: number) {
  return mutate((store) => {
    store.documentFiles = store.documentFiles.filter((f) => f.id !== id);
  });
}

// Chat
export async function createConversation(conv: any) {
  return mutate((store) => {
    const createdAt = nowString();
    const record = { id: store.meta.nextConversationId++, category: 'general', isActive: 1, createdAt, updatedAt: createdAt, ...conv };
    store.conversations.push(record);
    return record;
  });
}
export async function listUserConversations(userId: number) {
  const store = await getStore();
  return [...store.conversations].filter((c) => c.userId === userId && c.isActive === 1).sort((a, b) => `${b.updatedAt}`.localeCompare(`${a.updatedAt}`));
}
export async function getConversation(id: number) { const store = await getStore(); return store.conversations.find((c) => c.id === id); }
export async function updateConversation(id: number, updates: any) {
  return mutate((store) => {
    const i = store.conversations.findIndex((c) => c.id === id);
    if (i === -1) return undefined;
    store.conversations[i] = { ...store.conversations[i], ...updates, updatedAt: updates.updatedAt || nowString() };
    return store.conversations[i];
  });
}
export async function createMessage(msg: any) {
  return mutate((store) => {
    const createdAt = nowString();
    const record = { id: store.meta.nextMessageId++, createdAt, sources: null, ...msg };
    store.messages.push(record);
    const conv = store.conversations.find((c) => c.id === msg.conversationId);
    if (conv) conv.updatedAt = createdAt;
    return record;
  });
}
export async function listConversationMessages(conversationId: number) {
  const store = await getStore();
  return [...store.messages].filter((m) => m.conversationId === conversationId).sort((a, b) => `${a.createdAt}`.localeCompare(`${b.createdAt}`));
}

// Sources / fetched content / logs
export async function listKnowledgeSources(filters?: { type?: string; isActive?: number }) {
  const store = await getStore();
  return [...store.knowledgeSources]
    .filter((s) => (filters?.type ? s.type === filters.type : true))
    .filter((s) => (filters?.isActive !== undefined ? s.isActive === filters.isActive : true))
    .sort((a, b) => `${b.createdAt}`.localeCompare(`${a.createdAt}`));
}
export async function getKnowledgeSource(id: number) { const store = await getStore(); return store.knowledgeSources.find((s) => s.id === id); }
export async function createKnowledgeSource(source: any) { return mutate((store) => { const createdAt = nowString(); const record = { id: store.meta.nextKnowledgeSourceId++, type: 'rss' as SourceType, isActive: 1, fetchFrequency: 'manual', lastFetchAt: null, itemsCount: 0, successCount: 0, errorCount: 0, createdAt, updatedAt: createdAt, ...source }; store.knowledgeSources.push(record); return record; }); }
export async function updateKnowledgeSource(id: number, updates: any) { return mutate((store) => { const i = store.knowledgeSources.findIndex((s) => s.id === id); if (i === -1) return undefined; store.knowledgeSources[i] = { ...store.knowledgeSources[i], ...updates, updatedAt: nowString() }; return store.knowledgeSources[i]; }); }
export async function deleteKnowledgeSource(id: number) { return mutate((store) => { store.knowledgeSources = store.knowledgeSources.filter((s) => s.id !== id); }); }
export async function getKnowledgeSourcesStats() {
  const sources = await listKnowledgeSources();
  const logs = await listFetchLogs();
  const totalSources = sources.length;
  const activeSources = sources.filter((s) => s.isActive === 1).length;
  const totalItems = sources.reduce((sum, s) => sum + (s.itemsCount || 0), 0);
  const totalSuccess = sources.reduce((sum, s) => sum + (s.successCount || 0), 0);
  const totalErrors = sources.reduce((sum, s) => sum + (s.errorCount || 0), 0);
  const typeMap = new Map<string, number>();
  for (const s of sources) typeMap.set(s.type, (typeMap.get(s.type) || 0) + 1);
  return {
    totalSources,
    activeSources,
    inactiveSources: totalSources - activeSources,
    totalItems,
    successRate: totalSuccess + totalErrors > 0 ? Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100) : 100,
    totalSuccess,
    totalErrors,
    recentFetches: logs.filter((l) => l.startedAt && (Date.now() - new Date(l.startedAt).getTime()) <= 24 * 60 * 60 * 1000).length,
    sourcesByType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
    lastFetchDate: sources.map((s) => s.lastFetchAt).filter(Boolean).sort().reverse()[0] || null,
  };
}
export async function getTopActiveKnowledgeSources(limit = 5) { return (await listKnowledgeSources({ isActive: 1 })).sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0) || (b.successCount || 0) - (a.successCount || 0)).slice(0, limit).map(({ id, name, type, itemsCount, successCount, errorCount, lastFetchAt }) => ({ id, name, type, itemsCount, successCount, errorCount, lastFetchAt })); }
export async function getFetchActivityLast7Days() {
  const logs = await listFetchLogs();
  const buckets = new Map<string, { success: number; failed: number; total: number }>();
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i); buckets.set(d.toISOString().slice(0,10), { success: 0, failed: 0, total: 0 }); }
  for (const log of logs) { const key = log.startedAt ? new Date(log.startedAt).toISOString().slice(0,10) : null; if (!key || !buckets.has(key)) continue; const bucket = buckets.get(key)!; bucket.total += 1; if (log.status === 'success' || log.status === 'partial') bucket.success += 1; if (log.status === 'failed') bucket.failed += 1; }
  return Array.from(buckets.entries()).map(([date, stats]) => ({ date, ...stats }));
}

export async function createFetchedContent(item: any) { return mutate((store) => { const record = { id: store.meta.nextFetchedContentId++, status: 'pending' as ReviewStatus, fetchedAt: nowString(), versionNo: 1, isDuplicate: 0, ...item }; store.fetchedContent.push(record); return record; }); }
export async function listFetchedContent(filters?: { status?: string; sourceId?: number; category?: string; search?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) {
  const store = await getStore();
  const search = filters?.search?.trim().toLowerCase();
  let items = [...store.fetchedContent]
    .filter((i) => (filters?.status ? i.status === filters.status : true))
    .filter((i) => (filters?.sourceId ? i.sourceId === filters.sourceId : true))
    .filter((i) => (filters?.category ? i.category === filters.category : true))
    .filter((i) => (search ? `${i.title} ${i.content}`.toLowerCase().includes(search) : true));
  if (filters?.dateFrom) items = items.filter((i) => `${i.fetchedAt}` >= `${filters.dateFrom}`);
  if (filters?.dateTo) items = items.filter((i) => `${i.fetchedAt}` <= `${filters.dateTo} 23:59:59`);
  items = items.sort((a,b) => `${b.fetchedAt}`.localeCompare(`${a.fetchedAt}`));
  const offset = filters?.offset || 0; const limit = filters?.limit || 50;
  return items.slice(offset, offset + limit);
}
export async function countFetchedContent(filters?: { status?: string; sourceId?: number; category?: string; search?: string; dateFrom?: string; dateTo?: string }) { return (await listFetchedContent({ ...filters, limit: Number.MAX_SAFE_INTEGER, offset: 0 })).length; }
export async function getFetchedContent(id: number) { const store = await getStore(); return store.fetchedContent.find((i) => i.id === id); }
export async function updateFetchedContent(id: number, updates: any) { return mutate((store) => { const i = store.fetchedContent.findIndex((item) => item.id === id); if (i === -1) return undefined; store.fetchedContent[i] = { ...store.fetchedContent[i], ...updates }; return store.fetchedContent[i]; }); }
export async function deleteFetchedContent(id: number) { return mutate((store) => { store.fetchedContent = store.fetchedContent.filter((i) => i.id !== id); }); }
export async function listPendingUnprocessedFetchedContent(limit = 20) { return (await listFetchedContent({ status: 'pending', limit: Number.MAX_SAFE_INTEGER, offset: 0 })).filter((i) => !i.processedAt).slice(0, limit); }

export async function createFetchLog(log: any) { return mutate((store) => { const record = { id: store.meta.nextFetchLogId++, itemsFetched: 0, itemsApproved: 0, itemsRejected: 0, errors: null, startedAt: nowString(), completedAt: null, ...log }; store.fetchLogs.push(record); return record; }); }
export async function listFetchLogs(filters?: { sourceId?: number; status?: string }) { const store = await getStore(); return [...store.fetchLogs].filter((l) => (filters?.sourceId ? l.sourceId === filters.sourceId : true)).filter((l) => (filters?.status ? l.status === filters.status : true)).sort((a,b) => `${b.startedAt}`.localeCompare(`${a.startedAt}`)); }
export async function updateFetchLog(id: number, updates: any) { return mutate((store) => { const i = store.fetchLogs.findIndex((l) => l.id === id); if (i === -1) return undefined; store.fetchLogs[i] = { ...store.fetchLogs[i], ...updates }; return store.fetchLogs[i]; }); }

export async function createClassificationRating(rating: any) { return mutate((store) => { const record = { id: store.meta.nextClassificationRatingId++, createdAt: nowString(), ...rating }; store.classificationRatings.push(record); return record; }); }
export async function getClassificationRatingsStats() { const store = await getStore(); const total = store.classificationRatings.length; const positive = store.classificationRatings.filter((r) => r.rating === 'positive').length; return { total, positive, negative: total - positive, accuracyRate: total > 0 ? (positive / total) * 100 : 0 }; }
export async function createFetchedContentReviewEvent(event: any) { return mutate((store) => { const record = { id: store.meta.nextFetchedContentReviewEventId++, createdAt: nowString(), ...event }; store.fetchedContentReviewEvents.push(record); return record; }); }
export async function listFetchedContentReviewEvents(fetchedContentId: number) { const store = await getStore(); return [...store.fetchedContentReviewEvents].filter((e) => e.fetchedContentId === fetchedContentId).sort((a,b) => `${b.createdAt}`.localeCompare(`${a.createdAt}`)); }
