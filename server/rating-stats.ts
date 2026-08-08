import { getDb } from "./db";
import { ratings } from "../drizzle/schema";
import { and, eq, count } from "drizzle-orm";

/**
 * Get detailed rating statistics for an entity
 */
export async function getRatingStats(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) {
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  // Get all ratings for this entity
  const allRatings = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.entityType, entityType), eq(ratings.entityId, entityId)));

  const totalRatings = allRatings.length;
  const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = totalRatings > 0 ? sum / totalRatings : 0;

  // Calculate distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allRatings.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return {
    averageRating,
    totalRatings,
    distribution,
  };
}
