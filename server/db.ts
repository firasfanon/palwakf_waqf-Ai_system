import { eq, desc, and, like, or, count, sql, gte, lte, lt, avg, asc, isNull, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  knowledgeDocuments,
  InsertKnowledgeDocument,
  KnowledgeDocument,
  conversations,
  InsertConversation,
  Conversation,
  messages,
  InsertMessage,
  Message,
  faqs,
  InsertFAQ,
  FAQ,
  searchLogs,
  InsertSearchLog,
  waqfProperties,
  InsertWaqfProperty,
  WaqfProperty,
  waqfCases,
  InsertWaqfCase,
  WaqfCase,
  ministerialInstructions,
  InsertMinisterialInstruction,
  MinisterialInstruction,
  feedback,
  InsertFeedback,
  alertRuns,
  schedulerLocks,
  documentFiles,
  InsertDocumentFile,
  DocumentFile,
  Feedback,
  learningLog,
  InsertLearningLog,
  LearningLog,
  judicialRulings,
  InsertJudicialRuling,
  JudicialRuling,
  waqfDeeds,
  InsertWaqfDeed,
  WaqfDeed,
  ottomanLandLaw,
  InsertOttomanLandLawArticle,
  OttomanLandLawArticle,
  legalPrecedents,
  InsertLegalPrecedent,
  LegalPrecedent,
  bookmarks,
  contactMessages,
  InsertBookmark,
  Bookmark,
  siteSettings,
  SiteSetting,
  InsertSiteSetting,
  knowledgeSources,
  fetchedContent,
  fetchLogs,
  InsertKnowledgeSource,
  KnowledgeSource,
  InsertFetchedContent,
  FetchedContent,
  InsertFetchLog,
  FetchLog,
  classificationRatings,
  InsertClassificationRating,
  ClassificationRating,
  fetchedContentReviewEvents,
  InsertFetchedContentReviewEvent,
  FetchedContentReviewEvent,
  notifications,
  comments,
  Comment,
  InsertComment,
  ratings,
  Rating,
  InsertRating,
  homeSections,
  HomeSection,
  InsertHomeSection,
  landReferences,
  LandReference,
  InsertLandReference,
  waqfCategories,
  WaqfCategory,
  InsertWaqfCategory,
  SectionTemplate,
  InsertSectionTemplate,
  pageSettings,
  knowledgeChunks,
  sectionTemplates,
  watchlistTemplates,
  watchlists,
  alerts,
  Watchlist,
  InsertWatchlist,
  Alert,
  InsertAlert,
  AlertRun,
  InsertAlertRun,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getEffectiveDatabaseUrl, resolveDatabaseConfig } from "./config/databaseConfig";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const config = resolveDatabaseConfig();
  const rawUrl = getEffectiveDatabaseUrl();

  if (!rawUrl) {
    if (config.configured && !config.runtimeCompatible) {
      console.warn(`[Database] Configured database is not compatible with the current MySQL runtime: ${config.reason}`);
    }
    return null;
  }

  if (!_db) {
    try {
      _db = drizzle(rawUrl as string);
    } catch (error) {
      console.warn("[Database] Failed to initialize connection:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString().slice(0, 19).replace("T", " ");
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString().slice(0, 19).replace("T", " ");
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Knowledge Documents Functions ============

export async function createKnowledgeDocument(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(knowledgeDocuments).values(doc);
  const allDocs = await db.select().from(knowledgeDocuments).orderBy(desc(knowledgeDocuments.id)).limit(1);
  
  if (!allDocs[0]) throw new Error("Failed to create document");
  return allDocs[0];
}

export async function createKnowledgeDocument_OLD(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeDocuments).values(doc);
  const insertId = (result as any).insertId;
  const inserted = await db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.id, Number(insertId || 0)))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to create document");
  return inserted[0];
}

// Helper function to extract text snippet around search term
function extractSnippet(text: string, searchTerm: string, maxLength: number = 200): string {
  if (!searchTerm || !text) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerSearch);
  
  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
  
  const start = Math.max(0, index - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

export async function getKnowledgeDocuments(filters?: {
  category?: string;
  isActive?: number;
  search?: string;
}): Promise<KnowledgeDocument[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];

  if (filters?.category) {
    conditions.push(eq(knowledgeDocuments.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(knowledgeDocuments.isActive, filters.isActive));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(knowledgeDocuments.title, `%${filters.search}%`),
        like(knowledgeDocuments.content, `%${filters.search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(knowledgeDocuments)
    .where(whereClause)
    .orderBy(desc(knowledgeDocuments.createdAt));
}

export async function getKnowledgeDocumentById(id: number): Promise<KnowledgeDocument | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id)).limit(1);
  return result[0];
}

export async function updateKnowledgeDocument(
  id: number,
  updates: Partial<InsertKnowledgeDocument>
): Promise<KnowledgeDocument | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(knowledgeDocuments).set(updates).where(eq(knowledgeDocuments.id, id));

  return await getKnowledgeDocumentById(id);
}

export async function deleteKnowledgeDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
}

// ============ Conversations Functions ============

export async function createConversation(conv: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(conversations).values(conv);
  const allConvs = await db.select().from(conversations).orderBy(desc(conversations.id)).limit(1);
  
  if (!allConvs[0]) throw new Error("Failed to create conversation");
  return allConvs[0];
}

export async function createConversation_OLD(conv: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(conv);
  const insertId = (result as any).insertId;
  const inserted = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, Number(insertId || 0)))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to create conversation");
  return inserted[0];
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.isActive, 1)))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(id: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function updateConversation(
  id: number,
  updates: Partial<InsertConversation>
): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(conversations).set(updates).where(eq(conversations.id, id));

  return await getConversationById(id);
}

// ============ Messages Functions ============

export async function createMessage(msg: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(messages).values(msg);
  const allMsgs = await db.select().from(messages).orderBy(desc(messages.id)).limit(1);
  
  if (!allMsgs[0]) throw new Error("Failed to create message");
  return allMsgs[0];
}

export async function createMessage_OLD(msg: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(msg);
  const insertId = (result as any).insertId;
  const inserted = await db
    .select()
    .from(messages)
    .where(eq(messages.id, Number(insertId || 0)))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to create message");
  return inserted[0];
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ============ FAQs Functions ============

export async function createFAQ(faq: InsertFAQ): Promise<FAQ> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(faqs).values(faq);
  const allFaqs = await db.select().from(faqs).orderBy(desc(faqs.id)).limit(1);
  
  if (!allFaqs[0]) throw new Error("Failed to create FAQ");
  return allFaqs[0];
}

export async function createFAQ_OLD(faq: InsertFAQ): Promise<FAQ> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(faqs).values(faq);
  const insertId = (result as any).insertId;
  const inserted = await db.select().from(faqs).where(eq(faqs.id, Number(insertId || 0))).limit(1);

  if (!inserted[0]) throw new Error("Failed to create FAQ");
  return inserted[0];
}

export async function getFAQs(filters?: { category?: string; isActive?: number }): Promise<FAQ[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];

  if (filters?.category) {
    conditions.push(eq(faqs.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(faqs.isActive, filters.isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db.select().from(faqs).where(whereClause).orderBy(faqs.order, desc(faqs.viewCount));
}

export async function getFAQById(id: number): Promise<FAQ | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  return result[0];
}

export async function updateFAQ(id: number, updates: Partial<InsertFAQ>): Promise<FAQ | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(faqs).set(updates).where(eq(faqs.id, id));

  return await getFAQById(id);
}

export async function incrementFAQViewCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const faq = await getFAQById(id);
  if (faq) {
    await db
      .update(faqs)
      .set({ viewCount: faq.viewCount + 1 })
      .where(eq(faqs.id, id));
  }
}

export async function deleteFAQ(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(faqs).where(eq(faqs.id, id));
}

// ============ Search Logs Functions ============

export async function createSearchLog(log: InsertSearchLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(searchLogs).values(log);
}

export async function getSearchAnalytics(userId?: number) {
  const db = await getDb();
  if (!db) return { totalSearches: 0, topQueries: [] };

  let conditions: any[] = [];
  if (userId) {
    conditions.push(eq(searchLogs.userId, userId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db.select().from(searchLogs).where(whereClause);

  return {
    totalSearches: logs.length,
    topQueries: logs.slice(0, 10),
  };
}


// ============ Waqf Properties Functions ============

export async function createWaqfProperty(property: InsertWaqfProperty): Promise<WaqfProperty> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfProperties).values(property);
  const allProps = await db.select().from(waqfProperties).orderBy(desc(waqfProperties.id)).limit(1);
  
  if (!allProps[0]) throw new Error("Failed to create waqf property");
  return allProps[0];
}

export async function getWaqfProperties(filters?: {
  governorate?: string;
  propertyType?: string;
  status?: string;
  search?: string;
}): Promise<WaqfProperty[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(waqfProperties.isActive, 1)];

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(waqfProperties.name, searchTerm),
        like(waqfProperties.nationalKey, searchTerm),
        like(waqfProperties.address, searchTerm)
      ) as any
    );
  }

  const results = await db.select().from(waqfProperties).where(and(...conditions)).orderBy(desc(waqfProperties.createdAt));
  return results;
}

export async function getWaqfPropertyById(id: number): Promise<WaqfProperty | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waqfProperties).where(eq(waqfProperties.id, id)).limit(1);
  return result[0];
}

export async function getWaqfPropertyByNationalKey(nationalKey: string): Promise<WaqfProperty | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waqfProperties).where(eq(waqfProperties.nationalKey, nationalKey)).limit(1);
  return result[0];
}

export async function updateWaqfProperty(id: number, updates: Partial<InsertWaqfProperty>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfProperties).set(updates).where(eq(waqfProperties.id, id));
}

export async function deleteWaqfProperty(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfProperties).set({ isActive: 0 }).where(eq(waqfProperties.id, id));
}

// ============ Waqf Cases Functions ============

export async function createWaqfCase(waqfCase: InsertWaqfCase): Promise<WaqfCase> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfCases).values(waqfCase);
  const allCases = await db.select().from(waqfCases).orderBy(desc(waqfCases.id)).limit(1);
  
  if (!allCases[0]) throw new Error("Failed to create waqf case");
  return allCases[0];
}

export async function getWaqfCases(filters?: {
  propertyId?: number;
  status?: string;
  caseType?: string;
  search?: string;
}): Promise<WaqfCase[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(waqfCases.isActive, 1)];

  if (filters?.propertyId) {
    conditions.push(eq(waqfCases.propertyId, filters.propertyId));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(waqfCases.caseNumber, searchTerm),
        like(waqfCases.title, searchTerm),
        like(waqfCases.description, searchTerm)
      ) as any
    );
  }

  const results = await db.select().from(waqfCases).where(and(...conditions)).orderBy(desc(waqfCases.createdAt));
  return results;
}

export async function getWaqfCaseById(id: number): Promise<WaqfCase | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waqfCases).where(eq(waqfCases.id, id)).limit(1);
  return result[0];
}

export async function updateWaqfCase(id: number, updates: Partial<InsertWaqfCase>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfCases).set(updates).where(eq(waqfCases.id, id));
}

export async function deleteWaqfCase(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfCases).set({ isActive: 0 }).where(eq(waqfCases.id, id));
}

// ============ Ministerial Instructions Functions ============

export async function createMinisterialInstruction(instruction: InsertMinisterialInstruction): Promise<MinisterialInstruction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(ministerialInstructions).values(instruction);
  const allInstructions = await db.select().from(ministerialInstructions).orderBy(desc(ministerialInstructions.id)).limit(1);
  
  if (!allInstructions[0]) throw new Error("Failed to create ministerial instruction");
  return allInstructions[0];
}

export async function getMinisterialInstructions(filters?: {
  type?: string;
  category?: string;
  search?: string;
}): Promise<MinisterialInstruction[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(ministerialInstructions.isActive, 1)];

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(ministerialInstructions.instructionNumber, searchTerm),
        like(ministerialInstructions.title, searchTerm),
        like(ministerialInstructions.content, searchTerm)
      ) as any
    );
  }

  const results = await db.select().from(ministerialInstructions).where(and(...conditions)).orderBy(desc(ministerialInstructions.issueDate));
  return results;
}

export async function getMinisterialInstructionById(id: number): Promise<MinisterialInstruction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(ministerialInstructions).where(eq(ministerialInstructions.id, id)).limit(1);
  return result[0];
}

export async function updateMinisterialInstruction(id: number, updates: Partial<InsertMinisterialInstruction>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ministerialInstructions).set(updates).where(eq(ministerialInstructions.id, id));
}

export async function deleteMinisterialInstruction(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ministerialInstructions).set({ isActive: 0 }).where(eq(ministerialInstructions.id, id));
}

// ============ Feedback Functions ============

export async function createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(feedback).values(feedbackData);
  const allFeedback = await db.select().from(feedback).orderBy(desc(feedback.id)).limit(1);
  
  if (!allFeedback[0]) throw new Error("Failed to create feedback");
  return allFeedback[0];
}

export async function getFeedback(filters?: {
  messageId?: number;
  rating?: string;
  isReviewed?: boolean;
}): Promise<Feedback[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];
  
  if (filters?.messageId) {
    conditions.push(eq(feedback.messageId, filters.messageId));
  }
  
  if (filters?.isReviewed !== undefined) {
    conditions.push(eq(feedback.isReviewed, filters.isReviewed ? 1 : 0));
  }

  const query = conditions.length > 0 
    ? db.select().from(feedback).where(and(...conditions))
    : db.select().from(feedback);

  const results = await query.orderBy(desc(feedback.createdAt));
  return results;
}

export async function updateFeedback(id: number, updates: Partial<InsertFeedback>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(feedback).set(updates).where(eq(feedback.id, id));
}

// ============ Learning Log Functions ============

export async function createLearningLog(log: InsertLearningLog): Promise<LearningLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(learningLog).values(log);
  const allLogs = await db.select().from(learningLog).orderBy(desc(learningLog.id)).limit(1);
  
  if (!allLogs[0]) throw new Error("Failed to create learning log");
  return allLogs[0];
}

export async function getLearningLogs(filters?: {
  category?: string;
  isApplied?: boolean;
}): Promise<LearningLog[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];
  
  if (filters?.category) {
    conditions.push(eq(learningLog.category, filters.category));
  }
  
  if (filters?.isApplied !== undefined) {
    conditions.push(eq(learningLog.isApplied, filters.isApplied ? 1 : 0));
  }

  const query = conditions.length > 0 
    ? db.select().from(learningLog).where(and(...conditions))
    : db.select().from(learningLog);

  const results = await query.orderBy(desc(learningLog.createdAt));
  return results;
}

export async function updateLearningLog(id: number, updates: Partial<InsertLearningLog>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(learningLog).set(updates).where(eq(learningLog.id, id));
}

// ============ Judicial Rulings Functions ============

export async function getJudicialRulings(filters?: {
  court?: string;
  rulingType?: string;
  status?: string;
  search?: string;
}): Promise<JudicialRuling[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];
  
  if (filters?.court) {
    conditions.push(like(judicialRulings.court, `%${filters.court}%`));
  }
  
  if (filters?.rulingType) {
    conditions.push(eq(judicialRulings.rulingType, filters.rulingType as any));
  }
  
  if (filters?.status) {
    conditions.push(eq(judicialRulings.status, filters.status as any));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(judicialRulings.title, `%${filters.search}%`),
        like(judicialRulings.caseNumber, `%${filters.search}%`),
        like(judicialRulings.subject, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(judicialRulings).where(and(...conditions))
    : db.select().from(judicialRulings);

  const results = await query.orderBy(desc(judicialRulings.rulingDate));
  return results;
}

export async function getJudicialRulingById(id: number): Promise<JudicialRuling | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(judicialRulings).where(eq(judicialRulings.id, id)).limit(1);
  return results[0];
}

export async function createJudicialRuling(ruling: InsertJudicialRuling): Promise<JudicialRuling> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(judicialRulings).values(ruling);
  const allRulings = await db.select().from(judicialRulings).orderBy(desc(judicialRulings.id)).limit(1);
  
  if (!allRulings[0]) throw new Error("Failed to create judicial ruling");
  return allRulings[0];
}

export async function updateJudicialRuling(id: number, updates: Partial<InsertJudicialRuling>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(judicialRulings).set(updates).where(eq(judicialRulings.id, id));
}

export async function deleteJudicialRuling(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(judicialRulings).where(eq(judicialRulings.id, id));
}

// ============ Waqf Deeds Functions ============

export async function getWaqfDeeds(filters?: {
  waqfType?: string;
  status?: string;
  court?: string;
  search?: string;
}): Promise<WaqfDeed[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];
  
  if (filters?.waqfType) {
    conditions.push(eq(waqfDeeds.waqfType, filters.waqfType as any));
  }
  
  if (filters?.status) {
    conditions.push(eq(waqfDeeds.status, filters.status as any));
  }
  
  if (filters?.court) {
    conditions.push(like(waqfDeeds.court, `%${filters.court}%`));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(waqfDeeds.deedNumber, `%${filters.search}%`),
        like(waqfDeeds.waqifName, `%${filters.search}%`),
        like(waqfDeeds.propertyLocation, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(waqfDeeds).where(and(...conditions))
    : db.select().from(waqfDeeds);

  const results = await query.orderBy(desc(waqfDeeds.deedDate));
  return results;
}

export async function getWaqfDeedById(id: number): Promise<WaqfDeed | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(waqfDeeds).where(eq(waqfDeeds.id, id)).limit(1);
  return results[0];
}

export async function createWaqfDeed(deed: InsertWaqfDeed): Promise<WaqfDeed> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfDeeds).values(deed);
  const allDeeds = await db.select().from(waqfDeeds).orderBy(desc(waqfDeeds.id)).limit(1);
  
  if (!allDeeds[0]) throw new Error("Failed to create waqf deed");
  return allDeeds[0];
}

export async function updateWaqfDeed(id: number, updates: Partial<InsertWaqfDeed>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfDeeds).set(updates).where(eq(waqfDeeds.id, id));
}

export async function deleteWaqfDeed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(waqfDeeds).where(eq(waqfDeeds.id, id));
}

// ============ Ottoman Land Law Functions ============

export async function getOttomanLandLawArticles(filters?: {
  category?: string;
  isActive?: number;
  search?: string;
}): Promise<OttomanLandLawArticle[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];
  
  if (filters?.category) {
    conditions.push(eq(ottomanLandLaw.category, filters.category as any));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(ottomanLandLaw.isActive, filters.isActive));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(ottomanLandLaw.title, `%${filters.search}%`),
        like(ottomanLandLaw.arabicText, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(ottomanLandLaw).where(and(...conditions))
    : db.select().from(ottomanLandLaw);

  const results = await query.orderBy(ottomanLandLaw.articleNumber);
  return results;
}

export async function getOttomanLandLawArticleById(id: number): Promise<OttomanLandLawArticle | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(ottomanLandLaw).where(eq(ottomanLandLaw.id, id)).limit(1);
  return results[0];
}

export async function createOttomanLandLawArticle(article: InsertOttomanLandLawArticle): Promise<OttomanLandLawArticle> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(ottomanLandLaw).values(article);
  const allArticles = await db.select().from(ottomanLandLaw).orderBy(desc(ottomanLandLaw.id)).limit(1);
  
  if (!allArticles[0]) throw new Error("Failed to create Ottoman land law article");
  return allArticles[0];
}

export async function updateOttomanLandLawArticle(id: number, updates: Partial<InsertOttomanLandLawArticle>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ottomanLandLaw).set(updates).where(eq(ottomanLandLaw.id, id));
}

export async function deleteOttomanLandLawArticle(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(ottomanLandLaw).where(eq(ottomanLandLaw.id, id));
}

// ============ Legal Precedents Functions ============

export async function getLegalPrecedents(filters?: {
  category?: string;
  isActive?: number;
  search?: string;
}): Promise<LegalPrecedent[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];
  
  if (filters?.category) {
    conditions.push(eq(legalPrecedents.category, filters.category as any));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(legalPrecedents.isActive, filters.isActive));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(legalPrecedents.title, `%${filters.search}%`),
        like(legalPrecedents.principle, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(legalPrecedents).where(and(...conditions))
    : db.select().from(legalPrecedents);

  const results = await query.orderBy(desc(legalPrecedents.createdAt));
  return results;
}

export async function getLegalPrecedentById(id: number): Promise<LegalPrecedent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(legalPrecedents).where(eq(legalPrecedents.id, id)).limit(1);
  return results[0];
}

export async function createLegalPrecedent(precedent: InsertLegalPrecedent): Promise<LegalPrecedent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(legalPrecedents).values(precedent);
  const allPrecedents = await db.select().from(legalPrecedents).orderBy(desc(legalPrecedents.id)).limit(1);
  
  if (!allPrecedents[0]) throw new Error("Failed to create legal precedent");
  return allPrecedents[0];
}

export async function updateLegalPrecedent(id: number, updates: Partial<InsertLegalPrecedent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(legalPrecedents).set(updates).where(eq(legalPrecedents.id, id));
}

export async function deleteLegalPrecedent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(legalPrecedents).where(eq(legalPrecedents.id, id));
}


// ============================================
// Bookmarks Functions
// ============================================

/**
 * إضافة مرجع إلى المفضلة
 */
export async function addBookmark(params: {
  userId: number;
  documentId: number;
  collectionName?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const [result] = await db
    .insert(bookmarks)
    .values(params);
  
  return result;
}

/**
 * إزالة مرجع من المفضلة
 */
export async function removeBookmark(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.documentId, documentId)
      )
    );
  
  return { success: true };
}

/**
 * الحصول على قائمة المراجع المفضلة للمستخدم
 */
export async function getUserBookmarks(userId: number, collectionName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  let conditions = [eq(bookmarks.userId, userId)];
  
  if (collectionName) {
    conditions.push(eq(bookmarks.collectionName, collectionName));
  }

  const results = await db
    .select({
      bookmark: bookmarks,
      document: knowledgeDocuments,
    })
    .from(bookmarks)
    .innerJoin(knowledgeDocuments, eq(bookmarks.documentId, knowledgeDocuments.id))
    .where(and(...conditions))
    .orderBy(desc(bookmarks.createdAt));

  return results;
}

/**
 * التحقق إذا كان مرجع في المفضلة
 */
export async function checkBookmark(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const [result] = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.documentId, documentId)
      )
    );

  return !!result;
}

/**
 * الحصول على قائمة المجموعات
 */
export async function getUserCollections(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const results = await db
    .select({
      collectionName: bookmarks.collectionName,
      count: count(),
    })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        sql`${bookmarks.collectionName} IS NOT NULL`
      )
    )
    .groupBy(bookmarks.collectionName);

  return results;
}

// Contact Messages
export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.insert(contactMessages).values(data);
  return result;
}

export async function getAllContactMessages() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function getContactMessageById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
  return message;
}

export async function updateContactMessageStatus(id: number, status: "new" | "read" | "replied") {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
}

// ============================================
// Document Files Functions
// ============================================

/**
 * إضافة ملف PDF لمرجع
 */
export async function addDocumentFile(data: InsertDocumentFile): Promise<DocumentFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [file] = await db.insert(documentFiles).values(data);
  const created = await getDocumentFileById(file.insertId);
  if (!created) throw new Error("Failed to create document file");
  return created;
}

/**
 * الحصول على ملف بواسطة ID
 */
export async function getDocumentFileById(id: number): Promise<DocumentFile | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [file] = await db.select().from(documentFiles).where(eq(documentFiles.id, id)).limit(1);
  return file || null;
}

/**
 * الحصول على جميع ملفات مرجع
 */
export async function getDocumentFiles(documentId: number): Promise<DocumentFile[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(documentFiles).where(eq(documentFiles.documentId, documentId));
}

/**
 * حذف ملف
 */
export async function deleteDocumentFile(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documentFiles).where(eq(documentFiles.id, id));
}


// ============================================
// Site Settings Functions
// ============================================

/**
 * Get site settings (returns the first/only row)
 */
export async function getSiteSettings(): Promise<SiteSetting | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.select().from(siteSettings).limit(1);
  return results[0] || null;
}

/**
 * Update site settings
 */
export async function updateSiteSettings(updates: Partial<InsertSiteSetting>): Promise<SiteSetting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if settings exist
  const existing = await getSiteSettings();
  
  if (existing) {
    // Update existing settings
    await db.update(siteSettings).set(updates).where(eq(siteSettings.id, existing.id));
    const updated = await getSiteSettings();
    if (!updated) throw new Error("Failed to update settings");
    return updated;
  } else {
    // Create new settings row
    const [result] = await db.insert(siteSettings).values(updates as InsertSiteSetting);
    const created = await getSiteSettings();
    if (!created) throw new Error("Failed to create settings");
    return created;
  }
}

/**
 * Initialize default site settings if none exist
 */
export async function initializeSiteSettings(): Promise<SiteSetting> {
  const existing = await getSiteSettings();
  if (existing) return existing;

  const defaultSettings: InsertSiteSetting = {
    siteName: "نموذج الذكاء الصناعي للأوقاف",
    siteDescription: "نموذج ذكاء صناعي شامل يستند إلى القوانين الفلسطينية، مجلة الأحكام العدلية، والمراجع الشرعية والتاريخية لتقديم استشارات دقيقة حول الأوقاف الإسلامية",
    siteLanguage: "ar",
    primaryColor: "#2563eb",
    secondaryColor: "#10b981",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    accentColor: "#f59e0b",
    headingFont: "'Cairo', sans-serif",
    bodyFont: "'Tajawal', sans-serif",
    baseFontSize: 16,
    theme: "light",
    showSocialLinks: 1,
    menuItems: JSON.stringify([
      { label: "الرئيسية", href: "/" },
      { label: "المحادثة", href: "/chat" },
      { label: "قاعدة المعرفة", href: "/knowledge" },
      { label: "من نحن", href: "/about" },
      { label: "الأسئلة الشائعة", href: "/faqs" },
      { label: "اتصل بنا", href: "/contact" },
    ]),
  };

  return await updateSiteSettings(defaultSettings);
}


// ============ Knowledge Sources Functions ============

/**
 * Create a new knowledge source
 */
export async function createKnowledgeSource(source: InsertKnowledgeSource): Promise<KnowledgeSource> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(knowledgeSources).values(source);
  const created = await getKnowledgeSourceById(result.insertId);
  if (!created) throw new Error("Failed to create knowledge source");
  return created;
}

/**
 * Get all knowledge sources
 */
export async function getKnowledgeSources(filters?: {
  type?: string;
  isActive?: number;
}): Promise<KnowledgeSource[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (filters?.type) {
    conditions.push(eq(knowledgeSources.type, filters.type as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(knowledgeSources.isActive, filters.isActive));
  }

  const query = conditions.length > 0
    ? db.select().from(knowledgeSources).where(and(...conditions))
    : db.select().from(knowledgeSources);

  return await query.orderBy(desc(knowledgeSources.createdAt));
}

/**
 * Get knowledge source by ID
 */
export async function getKnowledgeSourceById(id: number): Promise<KnowledgeSource | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [source] = await db.select().from(knowledgeSources).where(eq(knowledgeSources.id, id)).limit(1);
  return source;
}

/**
 * Update knowledge source
 */
export async function updateKnowledgeSource(
  id: number,
  updates: Partial<InsertKnowledgeSource>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(knowledgeSources).set(updates).where(eq(knowledgeSources.id, id));
}

/**
 * Delete knowledge source
 */
export async function deleteKnowledgeSource(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(knowledgeSources).where(eq(knowledgeSources.id, id));
}

/**
 * Update source stats after fetch
 */
export async function updateKnowledgeSourceStats(
  id: number,
  stats: {
    itemsCount?: number;
    successCount?: number;
    errorCount?: number;
    lastFetchAt?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(knowledgeSources).set(stats).where(eq(knowledgeSources.id, id));
}

export async function getKnowledgeSourcesStats(): Promise<{
  totalSources: number;
  activeSources: number;
  inactiveSources: number;
  totalItems: number;
  successRate: number;
  totalSuccess: number;
  totalErrors: number;
  recentFetches: number;
  sourcesByType: Array<{ type: string; count: number }>;
  lastFetchDate: string | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalSources: 0,
      activeSources: 0,
      inactiveSources: 0,
      totalItems: 0,
      successRate: 0,
      totalSuccess: 0,
      totalErrors: 0,
      recentFetches: 0,
      sourcesByType: [],
      lastFetchDate: null,
    };
  }

  const sources = await db.select().from(knowledgeSources);
  const logs = await db.select().from(fetchLogs);

  const totalSources = sources.length;
  const activeSources = sources.filter((s) => s.isActive === 1).length;
  const inactiveSources = totalSources - activeSources;
  const totalItems = sources.reduce((sum, s) => sum + (s.itemsCount || 0), 0);
  const totalSuccess = sources.reduce((sum, s) => sum + (s.successCount || 0), 0);
  const totalErrors = sources.reduce((sum, s) => sum + (s.errorCount || 0), 0);
  const successRate = totalSuccess + totalErrors > 0 ? Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100) : 100;
  const now = Date.now();
  const recentFetches = logs.filter((log) => {
    if (!log.startedAt) return false;
    const started = new Date(log.startedAt).getTime();
    return now - started <= 24 * 60 * 60 * 1000;
  }).length;
  const typeMap = new Map<string, number>();
  for (const source of sources) {
    typeMap.set(source.type, (typeMap.get(source.type) || 0) + 1);
  }
  const sourcesByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));
  const lastFetchDate = sources
    .map((s) => s.lastFetchAt)
    .filter(Boolean)
    .sort()
    .reverse()[0] || null;

  return {
    totalSources,
    activeSources,
    inactiveSources,
    totalItems,
    successRate,
    totalSuccess,
    totalErrors,
    recentFetches,
    sourcesByType,
    lastFetchDate,
  };
}

export async function getTopActiveKnowledgeSources(limit: number = 5): Promise<Array<{
  id: number;
  name: string;
  type: typeof knowledgeSources.$inferSelect["type"];
  itemsCount: number;
  successCount: number;
  errorCount: number;
  lastFetchAt: string | null;
}>> {
  const db = await getDb();
  if (!db) return [];

  const sources = await db.select().from(knowledgeSources).where(eq(knowledgeSources.isActive, 1));

  return sources
    .sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0) || (b.successCount || 0) - (a.successCount || 0))
    .slice(0, limit)
    .map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      itemsCount: source.itemsCount || 0,
      successCount: source.successCount || 0,
      errorCount: source.errorCount || 0,
      lastFetchAt: source.lastFetchAt || null,
    }));
}

export async function getFetchActivityLast7Days(): Promise<Array<{
  date: string;
  success: number;
  failed: number;
  total: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const logs = await db.select().from(fetchLogs);
  const buckets = new Map<string, { success: number; failed: number; total: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { success: 0, failed: 0, total: 0 });
  }

  for (const log of logs) {
    if (!log.startedAt) continue;
    const key = new Date(log.startedAt).toISOString().slice(0, 10);
    if (!buckets.has(key)) continue;
    const bucket = buckets.get(key)!;
    bucket.total += 1;
    if (log.status === 'success' || log.status === 'partial') bucket.success += 1;
    if (log.status === 'failed') bucket.failed += 1;
  }

  return Array.from(buckets.entries()).map(([date, stats]) => ({ date, ...stats }));
}

// ============ Fetched Content Functions ============

/**
 * Create fetched content
 */
export async function createFetchedContent(content: InsertFetchedContent): Promise<FetchedContent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(fetchedContent).values(content);
  const created = await getFetchedContentById(result.insertId);
  if (!created) throw new Error("Failed to create fetched content");
  return created;
}

/**
 * Get all fetched content
 */
export async function getFetchedContent(filters?: {
  sourceId?: number;
  status?: string;
  minRelevanceScore?: number;
}): Promise<FetchedContent[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (filters?.sourceId) {
    conditions.push(eq(fetchedContent.sourceId, filters.sourceId));
  }
  if (filters?.status) {
    conditions.push(eq(fetchedContent.status, filters.status as any));
  }
  if (filters?.minRelevanceScore) {
    conditions.push(gte(fetchedContent.relevanceScore, filters.minRelevanceScore));
  }

  const query = conditions.length > 0
    ? db.select().from(fetchedContent).where(and(...conditions))
    : db.select().from(fetchedContent);

  return await query.orderBy(desc(fetchedContent.fetchedAt));
}

/**
 * Get fetched content by ID
 */
export async function getFetchedContentById(id: number): Promise<FetchedContent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [content] = await db.select().from(fetchedContent).where(eq(fetchedContent.id, id)).limit(1);
  return content;
}

/**
 * Update fetched content status
 */
export async function updateFetchedContentStatus(
  id: number,
  status: "pending" | "approved" | "rejected" | "processing",
  reviewedBy?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(fetchedContent).set({
    status,
    reviewedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    reviewedBy,
  }).where(eq(fetchedContent.id, id));
}

/**
 * Approve fetched content and add to knowledge base
 */
export async function approveFetchedContent(id: number, reviewedBy: number): Promise<KnowledgeDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get fetched content
  const content = await getFetchedContentById(id);
  if (!content) throw new Error("Fetched content not found");

  // Create knowledge document
  const knowledgeDoc = await createKnowledgeDocument({
    title: content.title,
    content: content.content,
    category: content.category || "reference",
    source: content.author || undefined,
    sourceUrl: content.url || undefined,
    pdfUrl: content.pdfUrl || undefined,
    tags: content.tags,
    createdBy: reviewedBy,
  });

  // Update fetched content status
  await updateFetchedContentStatus(id, "approved", reviewedBy);

  return knowledgeDoc;
}

/**
 * Bulk approve fetched content
 */
export async function bulkApproveFetchedContent(ids: number[], reviewedBy: number): Promise<number> {
  let approvedCount = 0;

  for (const id of ids) {
    try {
      await approveFetchedContent(id, reviewedBy);
      approvedCount++;
    } catch (error) {
      console.error(`Failed to approve content ${id}:`, error);
    }
  }

  return approvedCount;
}

/**
 * Reject fetched content
 */
export async function rejectFetchedContent(id: number, reviewedBy: number): Promise<void> {
  await updateFetchedContentStatus(id, "rejected", reviewedBy);
}

export async function bulkRejectFetchedContent(ids: number[], reviewedBy: number): Promise<number> {
  let rejectedCount = 0;
  for (const id of ids) {
    try {
      await rejectFetchedContent(id, reviewedBy);
      rejectedCount++;
    } catch (error) {
      console.error(`Failed to reject content ${id}:`, error);
    }
  }
  return rejectedCount;
}

/**
 * Delete fetched content
 */
export async function deleteFetchedContent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(fetchedContent).where(eq(fetchedContent.id, id));
}

// ============ Fetch Logs Functions ============

/**
 * Create fetch log
 */
export async function createFetchLog(log: InsertFetchLog): Promise<FetchLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(fetchLogs).values(log);
  const created = await getFetchLogById(result.insertId);
  if (!created) throw new Error("Failed to create fetch log");
  return created;
}

/**
 * Get all fetch logs
 */
export async function getFetchLogs(filters?: {
  sourceId?: number;
  status?: string;
}): Promise<FetchLog[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (filters?.sourceId) {
    conditions.push(eq(fetchLogs.sourceId, filters.sourceId));
  }
  if (filters?.status) {
    conditions.push(eq(fetchLogs.status, filters.status as any));
  }

  const query = conditions.length > 0
    ? db.select().from(fetchLogs).where(and(...conditions))
    : db.select().from(fetchLogs);

  return await query.orderBy(desc(fetchLogs.startedAt));
}

/**
 * Get fetch log by ID
 */
export async function getFetchLogById(id: number): Promise<FetchLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [log] = await db.select().from(fetchLogs).where(eq(fetchLogs.id, id)).limit(1);
  return log;
}

/**
 * Update fetch log
 */
export async function updateFetchLog(
  id: number,
  updates: Partial<InsertFetchLog>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(fetchLogs).set(updates).where(eq(fetchLogs.id, id));
}

/**
 * Get fetch logs statistics
 */
export async function getFetchLogsStats(sourceId?: number) {
  const db = await getDb();
  if (!db) return {
    totalFetches: 0,
    successfulFetches: 0,
    failedFetches: 0,
    totalItemsFetched: 0,
    totalItemsApproved: 0,
  };

  const logs = sourceId
    ? await db.select().from(fetchLogs).where(eq(fetchLogs.sourceId, sourceId))
    : await db.select().from(fetchLogs);

  return {
    totalFetches: logs.length,
    successfulFetches: logs.filter(l => l.status === "success").length,
    failedFetches: logs.filter(l => l.status === "failed").length,
    totalItemsFetched: logs.reduce((sum, l) => sum + (l.itemsFetched || 0), 0),
    totalItemsApproved: logs.reduce((sum, l) => sum + (l.itemsApproved || 0), 0),
  };
}

/**
 * List fetched content with filtering and pagination
 */
export async function listFetchedContent(filters?: {
  status?: "pending" | "approved" | "rejected" | "processing";
  sourceId?: number;
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<FetchedContent[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  
  if (filters?.status) {
    conditions.push(eq(fetchedContent.status, filters.status));
  }
  if (filters?.sourceId) {
    conditions.push(eq(fetchedContent.sourceId, filters.sourceId));
  }
  if (filters?.category) {
    conditions.push(eq(fetchedContent.category, filters.category as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(fetchedContent.title, `%${filters.search}%`),
        like(fetchedContent.content, `%${filters.search}%`)
      )
    );
  }
  if (filters?.dateFrom) {
    conditions.push(gte(fetchedContent.fetchedAt, new Date(filters.dateFrom).toISOString().slice(0, 19).replace("T", " ")));
  }
  if (filters?.dateTo) {
    const endDate = new Date(filters.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lt(fetchedContent.fetchedAt, endDate.toISOString().slice(0, 19).replace("T", " ")));
  }

  const query = conditions.length > 0
    ? db.select().from(fetchedContent).where(and(...conditions))
    : db.select().from(fetchedContent);

  return await query
    .orderBy(desc(fetchedContent.fetchedAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
}

/**
 * Count fetched content with filtering
 */
export async function countFetchedContent(filters?: {
  status?: "pending" | "approved" | "rejected" | "processing";
  sourceId?: number;
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const conditions: any[] = [];
  
  if (filters?.status) {
    conditions.push(eq(fetchedContent.status, filters.status));
  }
  if (filters?.sourceId) {
    conditions.push(eq(fetchedContent.sourceId, filters.sourceId));
  }
  if (filters?.category) {
    conditions.push(eq(fetchedContent.category, filters.category as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(fetchedContent.title, `%${filters.search}%`),
        like(fetchedContent.content, `%${filters.search}%`)
      )
    );
  }
  if (filters?.dateFrom) {
    conditions.push(gte(fetchedContent.fetchedAt, new Date(filters.dateFrom).toISOString().slice(0, 19).replace("T", " ")));
  }
  if (filters?.dateTo) {
    const endDate = new Date(filters.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lt(fetchedContent.fetchedAt, endDate.toISOString().slice(0, 19).replace("T", " ")));
  }

  const query = conditions.length > 0
    ? db.select({ count: sql<number>`count(*)` }).from(fetchedContent).where(and(...conditions))
    : db.select({ count: sql<number>`count(*)` }).from(fetchedContent);

  const [result] = await query;
  return result?.count || 0;
}

// ============ Classification Ratings Functions ============

/**
 * Create a classification rating
 */
export async function createClassificationRating(
  rating: InsertClassificationRating
): Promise<ClassificationRating> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(classificationRatings).values(rating);
  const created = await getClassificationRatingById(result.insertId);
  if (!created) throw new Error("Failed to create classification rating");
  return created;
}

/**
 * Get classification rating by ID
 */
export async function getClassificationRatingById(id: number): Promise<ClassificationRating | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [rating] = await db
    .select()
    .from(classificationRatings)
    .where(eq(classificationRatings.id, id))
    .limit(1);
  return rating;
}

/**
 * Get classification rating by fetched content ID
 */
export async function getClassificationRatingByContentId(
  fetchedContentId: number
): Promise<ClassificationRating | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [rating] = await db
    .select()
    .from(classificationRatings)
    .where(eq(classificationRatings.fetchedContentId, fetchedContentId))
    .orderBy(desc(classificationRatings.createdAt))
    .limit(1);
  return rating;
}

/**
 * Get classification ratings statistics
 */
export async function getClassificationRatingsStats(): Promise<{
  total: number;
  positive: number;
  negative: number;
  accuracyRate: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, positive: 0, negative: 0, accuracyRate: 0 };

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(classificationRatings);

  const [positiveResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(classificationRatings)
    .where(eq(classificationRatings.rating, "positive"));

  const total = totalResult?.count || 0;
  const positive = positiveResult?.count || 0;
  const negative = total - positive;
  const accuracyRate = total > 0 ? (positive / total) * 100 : 0;

  return { total, positive, negative, accuracyRate };
}

/**
 * Get all classification ratings
 */
export async function getAllClassificationRatings(): Promise<ClassificationRating[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(classificationRatings)
    .orderBy(desc(classificationRatings.createdAt));
}

/**
 * Delete classification rating
 */
export async function deleteClassificationRating(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(classificationRatings).where(eq(classificationRatings.id, id));
}


// ============================================================
// NOTIFICATIONS
// ============================================================

/**
 * Create a new notification for a specific user
 */
export async function createNotification(data: {
  userId: number;
  type: "announcement" | "update" | "maintenance" | "alert" | "reply" | "comment" | "approval" | "system";
  title: string;
  content: string;
  relatedId?: number;
  relatedType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content,
    relatedId: data.relatedId,
    relatedType: data.relatedType,
    isRead: 0,
    targetAudience: "specific",
    status: "sent",
    createdBy: data.userId,
    sentCount: 1,
    readCount: 0,
  });
  
  // Get the inserted notification
  const insertedId = result[0]?.insertId;
  if (!insertedId) throw new Error("Failed to create notification");
  
  const [notification] = await db.select().from(notifications).where(eq(notifications.id, insertedId)).limit(1);
  return notification;
}

/**
 * Get all notifications for a specific user
 */
export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, 0)
    ));
  
  return result[0]?.count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, 0)
    ));
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(notifications)
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

// ============================================================
// COMMENTS
// ============================================================

/**
 * Create a new comment
 */
export async function createComment(data: {
  userId: number;
  entityType: string;
  entityId: number;
  content: string;
  parentId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(comments).values({
    userId: data.userId,
    entityType: data.entityType,
    entityId: data.entityId,
    content: data.content,
    parentId: data.parentId,
    isApproved: 0, // Requires admin approval by default
  });
  
  // Get the inserted comment
  const insertedId = result[0]?.insertId;
  if (!insertedId) throw new Error("Failed to create comment");
  
  const [comment] = await db.select().from(comments).where(eq(comments.id, insertedId)).limit(1);
  return comment;
}

/**
 * Get comments for a specific entity
 */
export async function getCommentsByEntity(entityType: string, entityId: number, includeUnapproved = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(comments.entityType, entityType),
    eq(comments.entityId, entityId),
  ];
  
  if (!includeUnapproved) {
    conditions.push(eq(comments.isApproved, 1));
  }
  
  const commentsData = await db
    .select({
      comment: comments,
      user: {
        id: users.id,
        name: users.name,
      },
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(comments.createdAt));
  
  return commentsData;
}

/**
 * Get all pending comments (for admin approval)
 */
export async function getPendingComments() {
  const db = await getDb();
  if (!db) return [];
  
  const commentsData = await db
    .select({
      comment: comments,
      user: {
        id: users.id,
        name: users.name,
      },
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.isApproved, 0))
    .orderBy(desc(comments.createdAt));
  
  return commentsData;
}

/**
 * Approve a comment
 */
export async function approveComment(commentId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(comments)
    .set({ isApproved: 1 })
    .where(eq(comments.id, commentId));
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: number, userId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  
  const conditions = [eq(comments.id, commentId)];
  
  // Non-admins can only delete their own comments
  if (!isAdmin) {
    conditions.push(eq(comments.userId, userId));
  }
  
  await db
    .delete(comments)
    .where(and(...conditions));
}

/**
 * Update a comment
 */
export async function updateComment(commentId: number, userId: number, content: string, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  
  const conditions = [eq(comments.id, commentId)];
  
  // Non-admins can only update their own comments
  if (!isAdmin) {
    conditions.push(eq(comments.userId, userId));
  }
  
  await db
    .update(comments)
    .set({ 
      content,
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    })
    .where(and(...conditions));
}

// ============================================================
// RATINGS
// ============================================================

/**
 * Add or update a rating
 */
export async function rateEntity(data: {
  userId: number;
  entityType: string;
  entityId: number;
  rating: number; // 1-5
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already rated this entity
  const existingRating = await db
    .select()
    .from(ratings)
    .where(and(
      eq(ratings.userId, data.userId),
      eq(ratings.entityType, data.entityType),
      eq(ratings.entityId, data.entityId)
    ))
    .limit(1);
  
  if (existingRating.length > 0) {
    // Update existing rating
    await db
      .update(ratings)
      .set({ 
        rating: data.rating,
        updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      })
      .where(eq(ratings.id, existingRating[0].id));
    
    return existingRating[0];
  } else {
    // Create new rating
    const result = await db.insert(ratings).values({
      userId: data.userId,
      entityType: data.entityType,
      entityId: data.entityId,
      rating: data.rating,
    });
    
    // Get the inserted rating
    const insertedId = result[0]?.insertId;
    if (!insertedId) throw new Error("Failed to create rating");
    
    const [newRating] = await db.select().from(ratings).where(eq(ratings.id, insertedId)).limit(1);
    return newRating;
  }
}

/**
 * Get average rating for an entity
 */
export async function getAverageRating(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return { avgRating: 0, totalRatings: 0 };
  
  const result = await db
    .select({
      avgRating: avg(ratings.rating),
      totalRatings: count(),
    })
    .from(ratings)
    .where(and(
      eq(ratings.entityType, entityType),
      eq(ratings.entityId, entityId)
    ));
  
  return {
    avgRating: result[0]?.avgRating ? parseFloat(result[0].avgRating) : 0,
    totalRatings: result[0]?.totalRatings || 0,
  };
}

/**
 * Get user's rating for an entity
 */
export async function getUserRating(userId: number, entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(ratings)
    .where(and(
      eq(ratings.userId, userId),
      eq(ratings.entityType, entityType),
      eq(ratings.entityId, entityId)
    ))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Delete a rating
 */
export async function deleteRating(userId: number, entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(ratings)
    .where(and(
      eq(ratings.userId, userId),
      eq(ratings.entityType, entityType),
      eq(ratings.entityId, entityId)
    ));
}


// ============================================
// Section Templates Functions
// ============================================

/**
 * Get all section templates
 */
export async function getAllSectionTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const templates = await db
    .select()
    .from(sectionTemplates)
    .orderBy(desc(sectionTemplates.usageCount), desc(sectionTemplates.createdAt));
  
  return templates;
}

/**
 * Get section template by ID
 */
export async function getSectionTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [template] = await db
    .select()
    .from(sectionTemplates)
    .where(eq(sectionTemplates.id, id))
    .limit(1);
  
  return template || null;
}

/**
 * Get section templates by category
 */
export async function getSectionTemplatesByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  const templates = await db
    .select()
    .from(sectionTemplates)
    .where(sql`${sectionTemplates.type} = ${category}`)
    .orderBy(desc(sectionTemplates.usageCount));
  
  return templates;
}

/**
 * Create a new section template
 */
export async function createSectionTemplate(data: InsertSectionTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(sectionTemplates).values(data);
  const insertedId = result[0]?.insertId;
  if (!insertedId) throw new Error("Failed to create template");
  
  return getSectionTemplateById(insertedId);
}

/**
 * Update section template
 */
export async function updateSectionTemplate(id: number, data: Partial<InsertSectionTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.update(sectionTemplates).set(data).where(eq(sectionTemplates.id, id));
  return getSectionTemplateById(id);
}

/**
 * Delete section template
 */
export async function deleteSectionTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(sectionTemplates).where(eq(sectionTemplates.id, id));
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(sectionTemplates)
    .set({ usageCount: sql`${sectionTemplates.usageCount} + 1` })
    .where(eq(sectionTemplates.id, id));
}

// ============================================
// Home Sections Functions
// ============================================

/**
 * Get all home sections (published only)
 */
export async function getAllHomeSections() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  
  const sections = await db
    .select()
    .from(homeSections)
    .where(and(
      eq(homeSections.isVisible, 1),
      or(
        eq(homeSections.scheduledStatus, "published"),
        and(
          eq(homeSections.scheduledStatus, "scheduled"),
          lte(homeSections.publishAt, now)
        )
      )
    ))
    .orderBy(asc(homeSections.displayOrder));
  
  return sections;
}

/**
 * Get all home sections for admin (including drafts and scheduled)
 */
export async function getAllHomeSectionsAdmin() {
  const db = await getDb();
  if (!db) return [];
  
  const sections = await db
    .select()
    .from(homeSections)
    .orderBy(asc(homeSections.displayOrder));
  
  return sections;
}

/**
 * Get home section by ID
 */
export async function getHomeSectionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [section] = await db
    .select()
    .from(homeSections)
    .where(eq(homeSections.id, id))
    .limit(1);
  
  return section || null;
}

/**
 * Create a new home section
 */
export async function createHomeSection(data: InsertHomeSection) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(homeSections).values(data);
  const insertedId = result[0]?.insertId;
  if (!insertedId) throw new Error("Failed to create section");
  
  const section = await getHomeSectionById(insertedId);
  if (!section) throw new Error("Failed to retrieve created section");
  return section;
}

/**
 * Update home section
 */
export async function updateHomeSection(id: number, data: Partial<InsertHomeSection>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.update(homeSections).set(data).where(eq(homeSections.id, id));
  return getHomeSectionById(id);
}

/**
 * Delete home section
 */
export async function deleteHomeSection(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(homeSections).where(eq(homeSections.id, id));
}

/**
 * Get scheduled sections that need to be published
 */
export async function getScheduledSectionsToPublish() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  
  const sections = await db
    .select()
    .from(homeSections)
    .where(and(
      eq(homeSections.scheduledStatus, "scheduled"),
      lte(homeSections.publishAt, now)
    ));
  
  return sections;
}

/**
 * Get published sections that need to be unpublished
 */
export async function getPublishedSectionsToUnpublish() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  
  const sections = await db
    .select()
    .from(homeSections)
    .where(and(
      eq(homeSections.scheduledStatus, "published"),
      lte(homeSections.unpublishAt, now)
    ));
  
  return sections;
}

// ============================================
// Cached Responses Functions
// ============================================

// ============================================
// Land References Functions
// ============================================

/**
 * Get all land references with optional filtering
 */
export async function getLandReferences(filters?: {
  type?: string;
  region?: string;
  yearFrom?: number;
  yearTo?: number;
  search?: string;
  isActive?: number;
}): Promise<LandReference[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(landReferences);
    const conditions: any[] = [];

    if (filters?.type) {
      conditions.push(eq(landReferences.type, filters.type as any));
    }

    if (filters?.region) {
      conditions.push(eq(landReferences.region, filters.region));
    }

    if (filters?.yearFrom) {
      conditions.push(gte(landReferences.year, filters.yearFrom));
    }

    if (filters?.yearTo) {
      conditions.push(lte(landReferences.year, filters.yearTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(landReferences.title, `%${filters.search}%`),
          like(landReferences.description, `%${filters.search}%`),
          like(landReferences.author, `%${filters.search}%`)
        )!
      );
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(landReferences.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    return await query.orderBy(desc(landReferences.year));
  } catch (error) {
    console.error("[Database] Error fetching land references:", error);
    return [];
  }
}

/**
 * Get a single land reference by ID
 */
export async function getLandReferenceById(id: number): Promise<LandReference | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const [reference] = await db.select().from(landReferences).where(eq(landReferences.id, id));
    return reference;
  } catch (error) {
    console.error("[Database] Error fetching land reference:", error);
    return undefined;
  }
}

/**
 * Create a new land reference
 */
export async function createLandReference(data: InsertLandReference): Promise<LandReference> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    const [reference] = await db.insert(landReferences).values(data).$returningId();
    const created = await getLandReferenceById((reference as any).id);
    if (!created) throw new Error("Failed to create land reference");
    return created;
  } catch (error) {
    console.error("[Database] Error creating land reference:", error);
    throw error;
  }
}

/**
 * Update an existing land reference
 */
export async function updateLandReference(
  id: number,
  updates: Partial<InsertLandReference>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    await db.update(landReferences).set(updates).where(eq(landReferences.id, id));
  } catch (error) {
    console.error("[Database] Error updating land reference:", error);
    throw error;
  }
}

/**
 * Delete a land reference
 */
export async function deleteLandReference(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    await db.delete(landReferences).where(eq(landReferences.id, id));
  } catch (error) {
    console.error("[Database] Error deleting land reference:", error);
    throw error;
  }
}

/**
 * Get unique regions from land references
 */
export async function getLandReferenceRegions(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const results = await db
      .selectDistinct({ region: landReferences.region })
      .from(landReferences)
      .where(eq(landReferences.isActive, 1));
    
    return results.map((r) => r.region).sort();
  } catch (error) {
    console.error("[Database] Error fetching regions:", error);
    return [];
  }
}

/**
 * Get statistics for land references
 */
export async function getLandReferenceStats() {
  const db = await getDb();
  if (!db) return { total: 0, byType: {}, byRegion: {}, byDecade: {} };

  try {
    const allReferences = await getLandReferences({ isActive: 1 });
    
    const byType: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byDecade: Record<string, number> = {};

    allReferences.forEach((ref) => {
      // Count by type
      byType[ref.type] = (byType[ref.type] || 0) + 1;
      
      // Count by region
      byRegion[ref.region] = (byRegion[ref.region] || 0) + 1;
      
      // Count by decade
      const decade = Math.floor(ref.year / 10) * 10;
      byDecade[`${decade}s`] = (byDecade[`${decade}s`] || 0) + 1;
    });

    return {
      total: allReferences.length,
      byType,
      byRegion,
      byDecade,
    };
  } catch (error) {
    console.error("[Database] Error fetching land reference stats:", error);
    return { total: 0, byType: {}, byRegion: {}, byDecade: {} };
  }
}


// ============================================================
// WAQF CATEGORIES
// ============================================================

/**
 * Get all waqf categories
 */
export async function getWaqfCategories(): Promise<WaqfCategory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(waqfCategories)
    .where(eq(waqfCategories.isActive, 1))
    .orderBy(waqfCategories.order, waqfCategories.nameAr);
}

/**
 * Get waqf category by ID
 */
export async function getWaqfCategoryById(id: number): Promise<WaqfCategory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [category] = await db
    .select()
    .from(waqfCategories)
    .where(eq(waqfCategories.id, id))
    .limit(1);
  return category;
}

/**
 * Create a new waqf category
 */
export async function createWaqfCategory(category: InsertWaqfCategory): Promise<WaqfCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfCategories).values(category);
  const created = await getWaqfCategoryById(result.insertId);
  if (!created) throw new Error("Failed to create category");
  return created;
}

/**
 * Update a waqf category
 */
export async function updateWaqfCategory(id: number, updates: Partial<InsertWaqfCategory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfCategories).set(updates).where(eq(waqfCategories.id, id));
}

/**
 * Delete a waqf category (soft delete)
 */
export async function deleteWaqfCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfCategories).set({ isActive: 0 }).where(eq(waqfCategories.id, id));
}

/**
 * Get waqf properties count by category
 */
export async function getWaqfPropertiesCountByCategory(): Promise<{ categoryId: number | null; count: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      categoryId: waqfProperties.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(waqfProperties)
    .where(eq(waqfProperties.isActive, 1))
    .groupBy(waqfProperties.categoryId);

  return results;
}

/**
 * Get waqf statistics for analytics
 */
export async function getWaqfStatistics(): Promise<{
  totalWaqfs: number;
  totalCategories: number;
  waqfsByCategory: { categoryId: number | null; categoryName: string; count: number }[];
  waqfsByType: { type: string; count: number }[];
  waqfsByStatus: { status: string; count: number }[];
  waqfsByGovernorate: { governorate: string; count: number }[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalWaqfs: 0,
      totalCategories: 0,
      waqfsByCategory: [],
      waqfsByType: [],
      waqfsByStatus: [],
      waqfsByGovernorate: [],
    };
  }

  // Total waqfs
  const [totalWaqfsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(waqfProperties)
    .where(eq(waqfProperties.isActive, 1));
  const totalWaqfs = totalWaqfsResult?.count || 0;

  // Total categories
  const [totalCategoriesResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(waqfCategories)
    .where(eq(waqfCategories.isActive, 1));
  const totalCategories = totalCategoriesResult?.count || 0;

  // Waqfs by category
  const waqfsByCategoryRaw = await db
    .select({
      categoryId: waqfProperties.categoryId,
      categoryName: waqfCategories.nameAr,
      count: sql<number>`count(*)`,
    })
    .from(waqfProperties)
    .leftJoin(waqfCategories, eq(waqfProperties.categoryId, waqfCategories.id))
    .where(eq(waqfProperties.isActive, 1))
    .groupBy(waqfProperties.categoryId, waqfCategories.nameAr);

  const waqfsByCategory = waqfsByCategoryRaw.map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName || "غير مصنف",
    count: item.count,
  }));

  // Waqfs by type
  const waqfsByTypeRaw = await db
    .select({
      type: waqfProperties.waqfType,
      count: sql<number>`count(*)`,
    })
    .from(waqfProperties)
    .where(eq(waqfProperties.isActive, 1))
    .groupBy(waqfProperties.waqfType);

  const waqfsByType = waqfsByTypeRaw.map((item) => ({
    type: item.type,
    count: item.count,
  }));

  // Waqfs by status
  const waqfsByStatusRaw = await db
    .select({
      status: waqfProperties.status,
      count: sql<number>`count(*)`,
    })
    .from(waqfProperties)
    .where(eq(waqfProperties.isActive, 1))
    .groupBy(waqfProperties.status);

  const waqfsByStatus = waqfsByStatusRaw.map((item) => ({
    status: item.status,
    count: item.count,
  }));

  // Waqfs by governorate
  const waqfsByGovernorateRaw = await db
    .select({
      governorate: waqfProperties.governorate,
      count: sql<number>`count(*)`,
    })
    .from(waqfProperties)
    .where(eq(waqfProperties.isActive, 1))
    .groupBy(waqfProperties.governorate);

  const waqfsByGovernorate = waqfsByGovernorateRaw.map((item) => ({
    governorate: item.governorate,
    count: item.count,
  }));

  return {
    totalWaqfs,
    totalCategories,
    waqfsByCategory,
    waqfsByType,
    waqfsByStatus,
    waqfsByGovernorate,
  };
}


// ============================================
// Content Templates Functions
// ============================================

/**
 * Get all content templates
 */
export async function getAllContentTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const { contentTemplates } = await import("../drizzle/schema");
  return db.select().from(contentTemplates).orderBy(contentTemplates.type, contentTemplates.name);
}

/**
 * Get content template by ID
 */
export async function getContentTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const { contentTemplates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const result = await db.select().from(contentTemplates).where(eq(contentTemplates.id, id));
  return result[0] || null;
}

/**
 * Create a new content template
 */
export async function createContentTemplate(data: {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  type: "landing" | "about" | "services" | "portfolio" | "blog" | "documentation" | "dashboard" | "ecommerce" | "educational" | "nonprofit";
  sections: string;
  layout?: string;
  colorScheme?: string;
  thumbnail?: string;
  config?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const { contentTemplates } = await import("../drizzle/schema");
  
  const result = await db.insert(contentTemplates).values(data as any);
  const insertedId = result[0]?.insertId;
  if (!insertedId) throw new Error("Failed to create template");
  
  const template = await getContentTemplateById(insertedId);
  if (!template) throw new Error("Failed to retrieve created template");
  return template;
}

/**
 * Update content template
 */
export async function updateContentTemplate(id: number, data: Partial<{
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: string;
  sections: string;
  layout: string;
  colorScheme: string;
  thumbnail: string;
  config: string;
  isActive: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const { contentTemplates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  await db.update(contentTemplates).set(data as any).where(eq(contentTemplates.id, id));
  
  const template = await getContentTemplateById(id);
  if (!template) throw new Error("Template not found after update");
  return template;
}

/**
 * Delete content template
 */
export async function deleteContentTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const { contentTemplates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
}

/**
 * Increment content template usage count
 */
export async function incrementContentTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const { contentTemplates } = await import("../drizzle/schema");
  const { eq, sql } = await import("drizzle-orm");
  
  await db.update(contentTemplates)
    .set({ usageCount: sql`${contentTemplates.usageCount} + 1` })
    .where(eq(contentTemplates.id, id));
}


// ============ Roles & Permissions Functions ============

export async function getAllRoles() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { roles } = await import("../drizzle/schema");
  return await database.select().from(roles).orderBy(roles.createdAt);
}

export async function getRoleById(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { roles } = await import("../drizzle/schema");
  const [role] = await database.select().from(roles).where(eq(roles.id, id));
  return role || null;
}

export async function createRole(data: any) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { roles } = await import("../drizzle/schema");
  const [result] = await database.insert(roles).values(data);
  return await getRoleById(result.insertId);
}

export async function updateRole(id: number, data: any) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { roles } = await import("../drizzle/schema");
  await database.update(roles).set(data).where(eq(roles.id, id));
  return await getRoleById(id);
}

export async function deleteRole(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { roles } = await import("../drizzle/schema");
  await database.delete(roles).where(eq(roles.id, id));
}

export async function getAllPermissions() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { permissions } = await import("../drizzle/schema");
  return await database.select().from(permissions).orderBy(permissions.resource, permissions.action);
}

export async function getPermissionById(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { permissions } = await import("../drizzle/schema");
  const [permission] = await database.select().from(permissions).where(eq(permissions.id, id));
  return permission || null;
}

export async function createPermission(data: any) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { permissions } = await import("../drizzle/schema");
  const [result] = await database.insert(permissions).values(data);
  return await getPermissionById(result.insertId);
}

export async function updatePermission(id: number, data: any) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { permissions } = await import("../drizzle/schema");
  await database.update(permissions).set(data).where(eq(permissions.id, id));
  return await getPermissionById(id);
}

export async function deletePermission(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { permissions } = await import("../drizzle/schema");
  await database.delete(permissions).where(eq(permissions.id, id));
}

export async function getRolePermissions(roleId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { rolePermissions, permissions } = await import("../drizzle/schema");
  return await database
    .select({
      id: permissions.id,
      name: permissions.name,
      nameAr: permissions.nameAr,
      description: permissions.description,
      descriptionAr: permissions.descriptionAr,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
}

export async function assignPermissionToRole(roleId: number, permissionId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { rolePermissions } = await import("../drizzle/schema");
  await database.insert(rolePermissions).values({ roleId, permissionId });
}

export async function removePermissionFromRole(roleId: number, permissionId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { rolePermissions } = await import("../drizzle/schema");
  await database
    .delete(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      )
    );
}


// ============================================
// Page Settings Functions
// ============================================

export async function getPageSettings(pageName: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
try {
  const result = await database
    .select()
    .from(pageSettings)
    .where(eq(pageSettings.pageName, pageName))
    .limit(1);
  return result[0] || null;
} catch (err) {
  console.error("[getPageSettings] query failed", { pageName, err });
  return null;
}
}

export async function updatePageSettings(pageName: string, data: Partial<typeof pageSettings.$inferInsert>) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const existing = await getPageSettings(pageName);
  
  if (existing) {
    await database.update(pageSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pageSettings.pageName, pageName));
  } else {
    await database.insert(pageSettings).values({
      pageName,
      ...data,
    });
  }
  
  return await getPageSettings(pageName);
}

// ============================================================================
// Smart Processing Functions
// ============================================================================

/**
 * Update fetched content with AI processing results
 */
export async function updateFetchedContentProcessing(
  id: number,
  data: {
    aiCategory?: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
    aiKeywords?: string;
    aiSummary?: string;
    aiConfidence?: string | number;
    aiReasoning?: string;
    tags?: string;
    relevanceScore?: number;
    processingVersion?: string;
    processingError?: string | null;
  }
): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const updates: any = {};
  
  if (data.aiCategory !== undefined) updates.aiCategory = data.aiCategory;
  if (data.aiKeywords !== undefined) updates.aiKeywords = data.aiKeywords;
  if (data.aiSummary !== undefined) updates.aiSummary = data.aiSummary;
  if (data.aiConfidence !== undefined) updates.aiConfidence = data.aiConfidence;
  if (data.aiReasoning !== undefined) updates.aiReasoning = data.aiReasoning;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.relevanceScore !== undefined) updates.relevanceScore = data.relevanceScore;
  
  updates.processedAt = now;
  updates.processingVersion = data.processingVersion || "rule-v1";
  updates.processingError = data.processingError || null;
  
  await database
    .update(fetchedContent)
    .set(updates)
    .where(eq(fetchedContent.id, id));
}

/**
 * List pending unprocessed fetched content
 */
export async function listPendingUnprocessedFetchedContent(
  limit: number = 20
): Promise<FetchedContent[]> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const results = await database
    .select()
    .from(fetchedContent)
    .where(
      and(
        eq(fetchedContent.status, "pending"),
        isNull(fetchedContent.processedAt)
      )
    )
    .orderBy(desc(fetchedContent.fetchedAt))
    .limit(limit);

  return results;
}


/**
 * Create chunks for a single fetched content item
 * Returns { created: number, skipped: number }
 */
export async function createChunksForFetchedContentItem(
  itemId: number
): Promise<{ created: number; skipped: number }> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get the item
  const item = await database
    .select()
    .from(fetchedContent)
    .where(eq(fetchedContent.id, itemId))
    .limit(1);

  if (!item || item.length === 0) {
    return { created: 0, skipped: 0 };
  }

  const content = item[0];

  // Only process approved items
  if (content.status !== "approved") {
    return { created: 0, skipped: 1 };
  }

  // Import chunking function
  const { chunkText, generateChunkHash } = await import(
    "./chunking/chunkText"
  );

  // Delete old chunks for this item
  await database
    .delete(knowledgeChunks)
    .where(eq(knowledgeChunks.sourceItemId, itemId));

  // Generate new chunks
  const chunks = chunkText(content.content || "", 900, 120);

  if (chunks.length === 0) {
    return { created: 0, skipped: 1 };
  }

  // Insert chunks
  let created = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const hash = generateChunkHash(chunk);

    try {
      await database.insert(knowledgeChunks).values({
        sourceItemId: itemId,
        chunkNo: i + 1,
        chunkText: chunk,
        chunkHash: hash,
        aiCategory: content.aiCategory || undefined,
        tags: content.tags || undefined,
        sourceType: undefined,
        sourceId: undefined,
        canonicalUrl: content.url || undefined,
        createdAt: new Date().toISOString().slice(0, 19),
      });
      created++;
    } catch (err) {
      console.error(`Failed to insert chunk ${i + 1}:`, err);
    }
  }

  return { created, skipped: 0 };
}

/**
 * Create chunks for all approved items without chunks
 * Returns { created: number, skipped: number }
 */
export async function createChunksForApproved(
  limit: number = 20
): Promise<{ created: number; skipped: number }> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get approved items
  const approvedItems = await database
    .select()
    .from(fetchedContent)
    .where(eq(fetchedContent.status, "approved"))
    .orderBy(desc(fetchedContent.fetchedAt))
    .limit(limit);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const item of approvedItems) {
    const result = await createChunksForFetchedContentItem(item.id);
    totalCreated += result.created;
    totalSkipped += result.skipped;
  }

  return { created: totalCreated, skipped: totalSkipped };
}

/**
 * Search chunks with filters
 * Returns chunks with metadata
 */
export async function searchChunks(
  query: string,
  filters?: {
    category?: string;
    tags?: string;
    sourceType?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  limit: number = 20
): Promise<
  Array<{
    id: number;
    chunkText: string;
    chunkNo: number;
    sourceItemId: number;
    title?: string;
    url?: string;
    aiCategory?: string;
    tags?: string;
    sourceType?: string;
    canonicalUrl?: string;
  }>
> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const baseQuery = database
    .select({
      id: knowledgeChunks.id,
      chunkText: knowledgeChunks.chunkText,
      chunkNo: knowledgeChunks.chunkNo,
      sourceItemId: knowledgeChunks.sourceItemId,
      title: fetchedContent.title,
      url: fetchedContent.url,
      aiCategory: knowledgeChunks.aiCategory,
      tags: knowledgeChunks.tags,
      sourceType: knowledgeChunks.sourceType,
      canonicalUrl: knowledgeChunks.canonicalUrl,
    })
    .from(knowledgeChunks)
    .innerJoin(
      fetchedContent,
      eq(knowledgeChunks.sourceItemId, fetchedContent.id)
    );

  const whereClauses: any[] = [];

  if (query && query.trim().length > 0) {
    whereClauses.push(
      sql`MATCH(${knowledgeChunks.chunkText}) AGAINST(${query} IN BOOLEAN MODE)`
    );
  }

  if (filters?.category) {
    whereClauses.push(eq(knowledgeChunks.aiCategory, filters.category));
  }

  if (filters?.sourceType) {
    whereClauses.push(eq(knowledgeChunks.sourceType, filters.sourceType));
  }

  if (filters?.dateFrom) {
    whereClauses.push(gte(knowledgeChunks.createdAt, filters.dateFrom));
  }

  if (filters?.dateTo) {
    whereClauses.push(lte(knowledgeChunks.createdAt, filters.dateTo));
  }

  const finalQuery = whereClauses.length > 0
    ? baseQuery.where(and(...whereClauses))
    : baseQuery;

  const results = await finalQuery
    .orderBy(desc(knowledgeChunks.createdAt))
    .limit(limit);

  return results as any[];
}


/**
 * Update fetched content with PDF extraction results
 */
export async function updateFetchedContentExtraction(
  id: number,
  patch: {
    docDate?: string | null;
    docNumber?: string | null;
    issuer?: string | null;
    docType?: string | null;
    language?: string | null;
    pageCount?: number | null;
    extractedAt?: string | null;
    extractionVersion?: string | null;
    extractionError?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Record<string, any> = {};
  
  if (patch.docDate !== undefined) updates.docDate = patch.docDate;
  if (patch.docNumber !== undefined) updates.docNumber = patch.docNumber;
  if (patch.issuer !== undefined) updates.issuer = patch.issuer;
  if (patch.docType !== undefined) updates.docType = patch.docType;
  if (patch.language !== undefined) updates.language = patch.language;
  if (patch.pageCount !== undefined) updates.pageCount = patch.pageCount;
  if (patch.extractedAt !== undefined) updates.extractedAt = patch.extractedAt;
  if (patch.extractionVersion !== undefined) updates.extractionVersion = patch.extractionVersion;
  if (patch.extractionError !== undefined) updates.extractionError = patch.extractionError;

  if (Object.keys(updates).length === 0) return null;

  await db
    .update(fetchedContent)
    .set(updates)
    .where(eq(fetchedContent.id, id));

  return { id, ...updates };
}


export async function createFetchedContentReviewEvent(event: InsertFetchedContentReviewEvent): Promise<FetchedContentReviewEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(fetchedContentReviewEvents).values(event);
  const events = await db
    .select()
    .from(fetchedContentReviewEvents)
    .where(eq(fetchedContentReviewEvents.id, result.insertId))
    .limit(1);

  if (!events[0]) throw new Error("Failed to create review event");
  return events[0];
}

export async function listFetchedContentReviewEvents(fetchedContentId: number): Promise<FetchedContentReviewEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(fetchedContentReviewEvents)
    .where(eq(fetchedContentReviewEvents.fetchedContentId, fetchedContentId))
    .orderBy(desc(fetchedContentReviewEvents.createdAt), desc(fetchedContentReviewEvents.id));
}

// ============================================
// WATCHLISTS & ALERTS
// ============================================

export async function listWatchlists() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(watchlists).orderBy(desc(watchlists.createdAt));
}

export async function createWatchlist(data: InsertWatchlist) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(watchlists).values(data);
  const row = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.name, data.name))
    .orderBy(desc(watchlists.createdAt))
    .limit(1);
  return row[0] ?? null;
}

export async function updateWatchlist(id: number, data: Partial<InsertWatchlist>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(watchlists).set(data).where(eq(watchlists.id, id));
  return { id, ...data };
}

export async function toggleWatchlist(id: number, isActive: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(watchlists).set({ isActive }).where(eq(watchlists.id, id));
  return { id, isActive };
}

export async function listAlerts(
  filters?: {
    status?: string;
    watchlistId?: number;
    q?: string;
    minScore?: number;
    dateFrom?: string;
    dateTo?: string;
    offset?: number;
    limit?: number;
  }
) {
  const db = await getDb();
  if (!db) return { items: [], hasMore: false, nextOffset: 0, prevOffset: 0 };

  const status = filters?.status && filters.status !== "all" ? filters.status : undefined;
  const watchlistId = filters?.watchlistId && filters.watchlistId !== 0 ? filters.watchlistId : undefined;
  const q = filters?.q;
  const minScore = filters?.minScore;
  const dateFrom = filters?.dateFrom;
  const dateTo = filters?.dateTo;
  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;

  let conditions: any[] = [];

  if (status) {
    conditions.push(eq(alerts.status, status));
  }

  if (watchlistId) {
    conditions.push(eq(alerts.watchlistId, watchlistId));
  }

  if (minScore !== undefined) {
    conditions.push(sql`${alerts.score} >= ${minScore}`);
  }

  if (dateFrom) {
    conditions.push(sql`DATE(${alerts.createdAt}) >= DATE(${dateFrom})`);
  }

  if (dateTo) {
    conditions.push(sql`DATE(${alerts.createdAt}) <= DATE(${dateTo})`);
  }

  if (q) {
    const searchPattern = `%${q}%`;
    conditions.push(
      sql`(${fetchedContent.title} LIKE ${searchPattern} OR ${fetchedContent.canonicalUrl} LIKE ${searchPattern})`
    );
  }

  let query = db
    .select({
      alert: alerts,
      watchlist: watchlists,
      item: fetchedContent,
    })
    .from(alerts)
    .innerJoin(watchlists, eq(alerts.watchlistId, watchlists.id))
    .innerJoin(fetchedContent, eq(alerts.sourceItemId, fetchedContent.id))
    .orderBy(desc(alerts.createdAt))
    .limit(limit + 1)
    .offset(offset);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const items = await query;
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;

  return {
    items: resultItems,
    hasMore,
    nextOffset: offset + limit,
    prevOffset: Math.max(0, offset - limit),
  };
}

export async function markAlertSeen(id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(alerts).set({ status: "seen" }).where(eq(alerts.id, id));
  return { id, status: "seen" };
}

export async function markAlertDone(id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(alerts).set({ status: "done" }).where(eq(alerts.id, id));
  return { id, status: "done" };
}

export async function runWatchlists(limitItems: number = 200) {
  const db = await getDb();
  if (!db) return { createdCount: 0, totalMatches: 0, error: null };

  try {
    // Import matcher
    const { matchItemsAgainstWatchlists } = await import("./alerts/matchWatchlists");

    // Fetch active watchlists
    const activeWatchlists = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.isActive, 1));

    if (activeWatchlists.length === 0) {
      return { createdCount: 0, totalMatches: 0, error: null };
    }

    // Fetch recent items (pending/approved)
    const recentItems = await db
      .select()
      .from(fetchedContent)
      .where(inArray(fetchedContent.status, ["pending", "approved"]))
      .orderBy(desc(fetchedContent.fetchedAt))
      .limit(limitItems);

    if (recentItems.length === 0) {
      return { createdCount: 0, totalMatches: 0, error: null };
    }

    // Run matcher
    const matches = matchItemsAgainstWatchlists(
      recentItems.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        aiCategory: item.aiCategory,
        status: item.status,
      })),
      activeWatchlists.map((w) => ({
        id: w.id,
        query: w.query,
        categories: w.categories,
        sourceTypes: w.sourceTypes,
        statuses: w.statuses,
      }))
    );

    // Insert alerts with upsert (ignore duplicates)
    let createdCount = 0;
    for (const match of matches) {
      try {
        await db.insert(alerts).values({
          watchlistId: match.watchlistId,
          sourceItemId: match.itemId,
          matchedOn: match.matchedOn.join(","),
          score: match.score,
          status: "new",
        });
        createdCount++;
      } catch (e) {
        // Ignore duplicate key errors
        if (!String(e).includes("Duplicate")) {
          console.error("[Alerts] Insert error:", e);
        }
      }
    }

    return {
      createdCount,
      totalMatches: matches.length,
      error: null,
    };
  } catch (error) {
    console.error("[Alerts] runWatchlists error:", error);
    return {
      createdCount: 0,
      totalMatches: 0,
      error: String(error),
    };
  }
}

export async function deleteWatchlist(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  // حذف alerts المرتبطة أولاً (لتجنب FK errors)
  await db.delete(alerts).where(eq(alerts.watchlistId, id));
  
  // ثم حذف watchlist
  await db.delete(watchlists).where(eq(watchlists.id, id));
  
  return { success: true };
}

export async function markAlertsSeen(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return { updatedCount: 0 };
  
  const result = await db
    .update(alerts)
    .set({ status: "seen" })
    .where(inArray(alerts.id, ids));
  
  return { updatedCount: ids.length };
}

export async function markAlertsDone(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return { updatedCount: 0 };
  
  const result = await db
    .update(alerts)
    .set({ status: "done" })
    .where(inArray(alerts.id, ids));
  
  return { updatedCount: ids.length };
}

export async function deleteAlerts(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return { deletedCount: 0 };
  
  await db.delete(alerts).where(inArray(alerts.id, ids));
  
  return { deletedCount: ids.length };
}

export async function getAlertsStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalAlerts: 0,
      newAlerts: 0,
      seenAlerts: 0,
      doneAlerts: 0,
      topWatchlists: [],
    };
  }

  try {
    const allAlerts = await db.select().from(alerts);
    const totalAlerts = allAlerts.length;
    const newAlerts = allAlerts.filter((a) => a.status === "new").length;
    const seenAlerts = allAlerts.filter((a) => a.status === "seen").length;
    const doneAlerts = allAlerts.filter((a) => a.status === "done").length;

    const watchlistCounts = await db
      .select({
        watchlistId: alerts.watchlistId,
        count: sql`COUNT(*) as count`,
      })
      .from(alerts)
      .groupBy(alerts.watchlistId)
      .orderBy(sql`count DESC`)
      .limit(5);

    const topWatchlists = await Promise.all(
      watchlistCounts.map(async (wc) => {
        const w = await db
          .select()
          .from(watchlists)
          .where(eq(watchlists.id, wc.watchlistId))
          .limit(1);
        return {
          name: w[0]?.name || "Unknown",
          count: Number(wc.count),
        };
      })
    );

    return {
      totalAlerts,
      newAlerts,
      seenAlerts,
      doneAlerts,
      topWatchlists,
    };
  } catch (error) {
    console.error("[Alerts] getAlertsStats error:", error);
    return {
      totalAlerts: 0,
      newAlerts: 0,
      seenAlerts: 0,
      doneAlerts: 0,
      topWatchlists: [],
    };
  }
}

export async function get7DayTrend() {
  const db = await getDb();
  if (!db) {
    return {
      days: [],
      totalCreated: 0,
    };
  }

  try {
    const days: Array<{ date: string; count: number }> = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = await db
        .select({ count: sql`COUNT(*) as count` })
        .from(alerts)
        .where(sql`DATE(${alerts.createdAt}) = ${dateStr}`);
      
      days.push({
        date: dateStr,
        count: Number(count[0]?.count || 0),
      });
    }
    
    const totalCreated = days.reduce((sum, d) => sum + d.count, 0);
    
    return {
      days,
      totalCreated,
    };
  } catch (error) {
    console.error("[Alerts] get7DayTrend error:", error);
    return {
      days: [],
      totalCreated: 0,
    };
  }
}

// Watchlist Templates CRUD
export async function createWatchlistTemplate(
  name: string,
  description: string | undefined,
  query: string,
  categories: string | undefined,
  sourceTypes: string | undefined,
  statuses: string,
  createdBy: string,
  isPublic: number = 0
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(watchlistTemplates).values({
      name,
      description,
      query,
      categories,
      sourceTypes,
      statuses,
      createdBy,
      isPublic,
    });
    return result;
  } catch (error) {
    console.error("[Templates] createWatchlistTemplate error:", error);
    return null;
  }
}

export async function listWatchlistTemplates(createdBy?: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query: any = db.select().from(watchlistTemplates);
    
    if (createdBy) {
      query = query.where(eq(watchlistTemplates.createdBy, createdBy));
    }
    
    return await query.orderBy(desc(watchlistTemplates.createdAt));
  } catch (error) {
    console.error("[Templates] listWatchlistTemplates error:", error);
    return [];
  }
}

export async function deleteWatchlistTemplate(id: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(watchlistTemplates).where(eq(watchlistTemplates.id, id));
    return true;
  } catch (error) {
    console.error("[Templates] deleteWatchlistTemplate error:", error);
    return false;
  }
}

// Scheduler lock functions
export async function acquireSchedulerLock(
  lockKey: string,
  ttlMinutes: number = 10
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const now = new Date();

    // Try to insert lock
    await db.insert(schedulerLocks).values({
      lockKey,
      lockedAt: now,
      expiresAt,
    });

    return true;
  } catch (error) {
    // Lock already exists or other error
    return false;
  }
}

export async function releaseSchedulerLock(lockKey: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.delete(schedulerLocks).where(eq(schedulerLocks.lockKey, lockKey));
  } catch (error) {
    console.error("Error releasing scheduler lock:", error);
  }
}

export async function createAlertRun(trigger: "manual" | "cron" = "manual") {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startedAt = now.toISOString().slice(0, 19); // YYYY-MM-DD HH:mm:ss

  try {
    const result = await db.insert(alertRuns).values({
      startedAt,
      status: "running",
      trigger,
      lockKey: "watchlists_cron",
    });

    // Get the inserted row
    const row = await db
      .select()
      .from(alertRuns)
      .where(eq(alertRuns.startedAt, startedAt))
      .orderBy(desc(alertRuns.id))
      .limit(1);

    return row[0] ?? null;
  } catch (error) {
    console.error("Error creating alert run:", error);
    return null;
  }
}

export async function finishAlertRun(
  id: number,
  status: "success" | "failed" | "skipped",
  createdCount: number = 0,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();
  const finishedAt = now.toISOString().slice(0, 19); // YYYY-MM-DD HH:mm:ss

  try {
    await db
      .update(alertRuns)
      .set({
        status,
        finishedAt,
        createdCount,
        errorMessage: errorMessage || null,
      })
      .where(eq(alertRuns.id, id));

    return true;
  } catch (error) {
    console.error("Error finishing alert run:", error);
    return false;
  }
}
