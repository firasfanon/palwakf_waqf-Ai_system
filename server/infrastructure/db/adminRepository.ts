import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db";

export async function getOptionalAdminDb() {
  try {
    return await getDb();
  } catch (error) {
    console.warn("[adminRepository] Database unavailable; using safe fallback", error);
    return null;
  }
}

export async function countTable(table: any): Promise<number> {
  const db = await getOptionalAdminDb();
  if (!db) return 0;
  try {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(table as any);
    const value = Number((rows as any[])?.[0]?.count ?? 0);
    return Number.isFinite(value) ? value : 0;
  } catch (error) {
    console.warn("[adminRepository] countTable failed", error);
    return 0;
  }
}

export async function selectAllSafe(table: any, limit = 1000): Promise<any[]> {
  const db = await getOptionalAdminDb();
  if (!db) return [];
  try {
    return (await db.select().from(table as any).limit(limit)) as any[];
  } catch (error) {
    console.warn("[adminRepository] selectAllSafe failed", error);
    return [];
  }
}

export async function updateTableByIdSafe(table: any, id: number, patch: any) {
  const db = await getOptionalAdminDb();
  if (!db) throw new Error("Database not available");
  await db.update(table).set(patch).where(eq(table.id, id));
  const rows = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return (rows as any[])?.[0] ?? null;
}

export async function deleteTableByIdSafe(table: any, id: number, softField?: string) {
  const db = await getOptionalAdminDb();
  if (!db) throw new Error("Database not available");
  if (softField) {
    await db.update(table).set({ [softField]: 0 }).where(eq(table.id, id));
    return { success: true, softDeleted: true };
  }
  await db.delete(table).where(eq(table.id, id));
  return { success: true };
}

export async function insertTableSafe(table: any, values: any) {
  const db = await getOptionalAdminDb();
  if (!db) throw new Error("Database not available");
  await db.insert(table).values(values);
  return { success: true };
}
