import { getDb } from "./db";
import { comments, ratings, notifications } from "../drizzle/schema";
import { sql, desc, eq, and, gte } from "drizzle-orm";

/**
 * Get interaction statistics (comments, ratings, notifications)
 */
export async function getInteractionStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Total comments
  const totalCommentsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments);
  const totalComments = Number(totalCommentsResult[0]?.count || 0);

  // Total ratings
  const totalRatingsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ratings);
  const totalRatings = Number(totalRatingsResult[0]?.count || 0);

  // Total notifications
  const totalNotificationsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications);
  const totalNotifications = Number(totalNotificationsResult[0]?.count || 0);

  // Average rating
  const avgRatingResult = await db
    .select({ avg: sql<number>`AVG(rating)` })
    .from(ratings);
  const avgRating = Number(avgRatingResult[0]?.avg || 0);

  // Interaction rate (comments + ratings per day)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const recentCommentsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(gte(comments.createdAt, thirtyDaysAgoStr));
  const recentComments = Number(recentCommentsResult[0]?.count || 0);

  const recentRatingsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ratings)
    .where(gte(ratings.createdAt, thirtyDaysAgoStr));
  const recentRatings = Number(recentRatingsResult[0]?.count || 0);

  const interactionRate = ((recentComments + recentRatings) / 30).toFixed(1);

  return {
    totalComments,
    totalRatings,
    totalNotifications,
    avgRating: avgRating.toFixed(1),
    interactionRate,
  };
}

/**
 * Get comments over time (last 30 days)
 */
export async function getCommentsOverTime() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const result = await db
    .select({
      date: sql<string>`DATE(created_at)`.as('date'),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(comments)
    .where(gte(comments.createdAt, thirtyDaysAgoStr))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  return result.map((row: { date: string; count: number }) => ({
    date: row.date,
    count: Number(row.count || 0),
  }));
}

/**
 * Get ratings distribution (1-5 stars)
 */
export async function getRatingsDistribution() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      rating: ratings.rating,
      count: sql<number>`count(*)`,
    })
    .from(ratings)
    .groupBy(ratings.rating)
    .orderBy(ratings.rating);

  return result.map((row: { rating: number; count: number }) => ({
    rating: row.rating,
    count: Number(row.count || 0),
  }));
}

/**
 * Get notifications by type
 */
export async function getNotificationsByType() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      type: notifications.type,
      count: sql<number>`count(*)`,
    })
    .from(notifications)
    .groupBy(notifications.type);

  return result.map((row: { type: string; count: number }) => ({
    type: row.type,
    count: Number(row.count || 0),
  }));
}

/**
 * Get recent comments (last 20)
 */
export async function getRecentComments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: comments.id,
      content: comments.content,
      userId: comments.userId,
      entityType: comments.entityType,
      entityId: comments.entityId,
      createdAt: comments.createdAt,
      isApproved: comments.isApproved,
    })
    .from(comments)
    .orderBy(desc(comments.createdAt))
    .limit(20);

  return result;
}

/**
 * Get comments by entity type
 */
export async function getCommentsByEntityType() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      entityType: comments.entityType,
      count: sql<number>`count(*)`,
    })
    .from(comments)
    .groupBy(comments.entityType);

  return result.map((row: { entityType: string; count: number }) => ({
    entityType: row.entityType,
    count: Number(row.count || 0),
  }));
}

/**
 * Get ratings by entity type
 */
export async function getRatingsByEntityType() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      entityType: ratings.entityType,
      count: sql<number>`count(*)`,
      avgRating: sql<number>`AVG(rating)`,
    })
    .from(ratings)
    .groupBy(ratings.entityType);

  return result.map((row: { entityType: string; count: number; avgRating: number }) => ({
    entityType: row.entityType,
    count: Number(row.count || 0),
    avgRating: Number(row.avgRating || 0).toFixed(1),
  }));
}
