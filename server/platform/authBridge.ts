import { platformBridgeConfig, isPlatformBridgeConfigured } from "./config";
import { getPlatformSupabaseClient } from "./supabase";
import type { AuthenticatedUser, AppRole } from "../_core/types/authUser";

type PlatformAdminRow = Record<string, unknown>;

type PlatformIdentityLookup = {
  authUserId?: string | null;
  email?: string | null;
  openId?: string | null;
  platformUserId?: string | number | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function readRow(row: PlatformAdminRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function toBoolishNumber(value: unknown) {
  if (value === true) return 1;
  if (value === false) return 0;
  const text = normalizeLower(value);
  if (["1", "true", "yes", "on", "active", "enabled"].includes(text)) return 1;
  if (["0", "false", "no", "off", "inactive", "disabled"].includes(text)) return 0;
  return 1;
}

function mapPlatformRole(value: unknown): AppRole {
  const role = normalizeLower(value);
  if (["admin", "superuser", "super_user", "platformadmin", "platform_admin", "manager", "owner"].includes(role)) {
    return "admin";
  }
  return "user";
}

function stableNumericId(value: unknown) {
  const raw = normalizeText(value);
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (Number.isSafeInteger(n) && n > 0) return n;
  }

  let hash = 0;
  const seed = raw || "platform-user";
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash || 1);
}

function currentTimestamp() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function scopedFrom(client: any) {
  const adminCfg = platformBridgeConfig.objects.adminUsers;
  return adminCfg.schema && adminCfg.schema !== "public"
    ? client.schema(adminCfg.schema).from(adminCfg.table)
    : client.from(adminCfg.table);
}

export function mapPlatformAdminUser(row: PlatformAdminRow): AuthenticatedUser {
  const platformUserId = readRow(row, ["id", "admin_user_id"]);
  const authUserId = readRow(row, ["auth_user_id", "user_id", "open_id"]);
  const email = readRow(row, ["email"]);
  const name = readRow(row, ["name", "display_name", "full_name", "name_ar"]);
  const platformRole = readRow(row, ["role", "platform_role"]);
  const unitId = readRow(row, ["unit_id", "org_unit_id"]);
  const active = toBoolishNumber(readRow(row, ["is_active", "active", "enabled"]));
  const now = currentTimestamp();

  const principal = normalizeText(authUserId) || normalizeText(email) || normalizeText(platformUserId) || "platform-user";

  return {
    id: stableNumericId(platformUserId || authUserId || email || principal),
    openId: principal,
    authUserId: normalizeText(authUserId) || null,
    platformUserId: platformUserId != null ? String(platformUserId) : null,
    name: normalizeText(name) || null,
    email: normalizeText(email) || null,
    loginMethod: "platform",
    role: mapPlatformRole(platformRole),
    platformRole: normalizeText(platformRole) || null,
    unitId: unitId == null || unitId === "" ? null : (typeof unitId === "number" ? unitId : String(unitId)),
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    isActive: active,
    source: "platform_admin_users",
  };
}

export async function findPlatformAdminUser(identity: PlatformIdentityLookup): Promise<AuthenticatedUser | null> {
  if (!platformBridgeConfig.enabled || !isPlatformBridgeConfigured()) {
    return null;
  }

  const client = getPlatformSupabaseClient();
  if (!client) return null;

  const { data, error } = await scopedFrom(client).select("*").limit(200);
  if (error || !Array.isArray(data)) {
    throw new Error(error?.message || "Failed to query platform admin users");
  }

  const authUserId = normalizeLower(identity.authUserId);
  const openId = normalizeLower(identity.openId);
  const email = normalizeLower(identity.email);
  const platformUserId = normalizeLower(identity.platformUserId);

  const matched = data.find((row) => {
    const raw = row as PlatformAdminRow;
    const rowPlatformUserId = normalizeLower(readRow(raw, ["id", "admin_user_id"]));
    const rowAuthUserId = normalizeLower(readRow(raw, ["auth_user_id", "user_id", "open_id", "id"]));
    const rowEmail = normalizeLower(readRow(raw, ["email"]));
    const isActive = toBoolishNumber(readRow(raw, ["is_active", "active", "enabled"]));

    if (!isActive) return false;

    return Boolean(
      (authUserId && rowAuthUserId && rowAuthUserId === authUserId) ||
      (openId && rowAuthUserId && rowAuthUserId === openId) ||
      (email && rowEmail && rowEmail === email) ||
      (platformUserId && rowPlatformUserId && rowPlatformUserId === platformUserId)
    );
  });

  if (!matched) {
    const attempted = {
      authUserId: authUserId || null,
      openId: openId || null,
      email: email || null,
      platformUserId: platformUserId || null,
      fetchedRows: data.length,
    };
    console.warn("[Platform Auth] No matching active admin_users row found", attempted);
    return null;
  }

  return mapPlatformAdminUser(matched as PlatformAdminRow);
}
