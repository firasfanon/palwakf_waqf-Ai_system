import { getDb } from "./db";
import { bookmarks, favoriteConversations, knowledgeDocuments, conversations } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ==================== Bookmarks ====================

/**
 * Add a bookmark for a knowledge document
 */
export async function addBookmark(userId: number, documentId: number, collectionName?: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [bookmark] = await db.insert(bookmarks).values({
    userId,
    documentId,
    collectionName,
    notes,
  });
  
  return bookmark;
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bookmarks).where(
    and(
      eq(bookmarks.userId, userId),
      eq(bookmarks.documentId, documentId)
    )
  );
}

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select({
      id: bookmarks.id,
      documentId: bookmarks.documentId,
      collectionName: bookmarks.collectionName,
      notes: bookmarks.notes,
      createdAt: bookmarks.createdAt,
      document: {
        id: knowledgeDocuments.id,
        title: knowledgeDocuments.title,
        category: knowledgeDocuments.category,
        source: knowledgeDocuments.source,
        pdfUrl: knowledgeDocuments.pdfUrl,
      },
    })
    .from(bookmarks)
    .leftJoin(knowledgeDocuments, eq(bookmarks.documentId, knowledgeDocuments.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));

  return results;
}

/**
 * Check if a document is bookmarked by user
 */
export async function isBookmarked(userId: number, documentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.documentId, documentId)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Get bookmark collections for a user
 */
export async function getBookmarkCollections(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select({
      collectionName: bookmarks.collectionName,
    })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .groupBy(bookmarks.collectionName);

  return results
    .filter((r: any) => r.collectionName !== null)
    .map((r: any) => r.collectionName as string);
}

// ==================== Favorite Conversations ====================

/**
 * Add a conversation to favorites
 */
export async function addFavoriteConversation(userId: number, conversationId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [favorite] = await db.insert(favoriteConversations).values({
    userId,
    conversationId,
    notes,
  });
  
  return favorite;
}

/**
 * Remove a conversation from favorites
 */
export async function removeFavoriteConversation(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(favoriteConversations).where(
    and(
      eq(favoriteConversations.userId, userId),
      eq(favoriteConversations.conversationId, conversationId)
    )
  );
}

/**
 * Get all favorite conversations for a user
 */
export async function getUserFavoriteConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select({
      id: favoriteConversations.id,
      conversationId: favoriteConversations.conversationId,
      notes: favoriteConversations.notes,
      createdAt: favoriteConversations.createdAt,
      conversation: {
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      },
    })
    .from(favoriteConversations)
    .leftJoin(conversations, eq(favoriteConversations.conversationId, conversations.id))
    .where(eq(favoriteConversations.userId, userId))
    .orderBy(desc(favoriteConversations.createdAt));

  return results;
}

/**
 * Check if a conversation is favorited by user
 */
export async function isFavorited(userId: number, conversationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ id: favoriteConversations.id })
    .from(favoriteConversations)
    .where(
      and(
        eq(favoriteConversations.userId, userId),
        eq(favoriteConversations.conversationId, conversationId)
      )
    )
    .limit(1);

  return result.length > 0;
}
