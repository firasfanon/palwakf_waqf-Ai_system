import { platformBridgeConfig, isPlatformBridgeConfigured } from "./config";
import { getPlatformSupabaseClient } from "./supabase";
import { getSourceOfTruthReadinessSummary, sourceOfTruthMatrix } from "./sourceOfTruth";

type BridgeObjectKey = keyof typeof platformBridgeConfig.objects;

type BridgeObjectPreview = {
  key: BridgeObjectKey;
  schema: string;
  table: string;
  reachable: boolean;
  count: number | null;
  sample: Record<string, unknown>[];
  error?: string;
};

const objectEntries = Object.entries(platformBridgeConfig.objects) as [
  BridgeObjectKey,
  { schema: string; table: string },
][];

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function mapSample(key: BridgeObjectKey, row: Record<string, unknown>) {
  switch (key) {
    case "adminUsers":
      return {
        id: pick(row, ["id", "admin_user_id"]),
        authUserId: pick(row, ["auth_user_id", "user_id", "open_id"]),
        email: pick(row, ["email"]),
        name: pick(row, ["name", "display_name", "full_name"]),
        role: pick(row, ["role", "platform_role"]),
        unitId: pick(row, ["unit_id", "org_unit_id"]),
        isActive: pick(row, ["is_active", "active", "enabled"]),
      };
    case "orgUnits":
      return {
        id: pick(row, ["id", "unit_id"]),
        slug: pick(row, ["slug", "unit_slug"]),
        code: pick(row, ["unit_code", "code"]),
        nameAr: pick(row, ["name_ar", "title_ar", "display_name_ar", "name"]),
        nameEn: pick(row, ["name_en", "title_en", "display_name_en"]),
        parentId: pick(row, ["parent_id"]),
        unitType: pick(row, ["unit_type", "type"]),
      };
    case "waqfAssets":
      return {
        id: pick(row, ["id", "waqf_asset_id"]),
        nationalAssetCode: pick(row, ["national_asset_code", "asset_code"]),
        nameAr: pick(row, ["name_ar", "asset_name_ar", "title_ar", "name"]),
        endowmentId: pick(row, ["endowment_id"]),
        endowmentName: pick(row, ["endowment_name", "endowment_name_ar"]),
        status: pick(row, ["status", "asset_status"]),
        assetType: pick(row, ["asset_type", "type"]),
      };
    case "endowments":
      return {
        id: pick(row, ["id", "endowment_id"]),
        nameAr: pick(row, ["name_ar", "title_ar", "name"]),
        nameEn: pick(row, ["name_en", "title_en"]),
        status: pick(row, ["status"]),
        type: pick(row, ["type", "endowment_type"]),
      };
    case "references":
      return {
        id: pick(row, ["id"]),
        title: pick(row, ["title", "name"]),
        region: pick(row, ["region"]),
        type: pick(row, ["type", "reference_type"]),
        year: pick(row, ["year", "published_year"]),
        author: pick(row, ["author", "issuer"]),
      };
    default:
      return row;
  }
}

function scopedFrom(client: any, schema: string, table: string) {
  return schema && schema !== "public" ? client.schema(schema).from(table) : client.from(table);
}



type ListOptions = {
  limit?: number;
  search?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function rowMatchesSearch(row: Record<string, unknown>, search?: string | null) {
  if (!search) return true;
  const needle = normalizeText(search);
  if (!needle) return true;
  return Object.values(row).some((value) => normalizeText(value).includes(needle));
}

async function listMappedObject(key: BridgeObjectKey, options: ListOptions = {}) {
  const client = getPlatformSupabaseClient();
  if (!client) {
    return {
      configured: false,
      key,
      items: [] as Record<string, unknown>[],
      total: 0,
      filtered: 0,
      error:
        "Platform bridge is not configured. Set PLATFORM_SUPABASE_URL and PLATFORM_SUPABASE_SERVICE_ROLE_KEY in .env.",
    };
  }

  const objectConfig = platformBridgeConfig.objects[key];
  const fetchLimit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  if (!objectConfig) {
    return {
      configured: true,
      key,
      items: [] as Record<string, unknown>[],
      total: 0,
      filtered: 0,
      error: `Unknown platform object key: ${key}`,
    };
  }

  try {
    const countResult = await scopedFrom(client, objectConfig.schema, objectConfig.table).select("*", {
      count: "exact",
      head: true,
    });

    const sampleResult = await scopedFrom(client, objectConfig.schema, objectConfig.table)
      .select("*")
      .limit(fetchLimit);

    if (sampleResult.error) {
      return {
        configured: true,
        key,
        schema: objectConfig.schema,
        table: objectConfig.table,
        items: [] as Record<string, unknown>[],
        total: typeof countResult.count === "number" ? countResult.count : 0,
        filtered: 0,
        error: sampleResult.error.message,
      };
    }

    const mapped = (Array.isArray(sampleResult.data) ? sampleResult.data : []).map((row) =>
      mapSample(key, row as Record<string, unknown>)
    );
    const filtered = mapped.filter((row) => rowMatchesSearch(row, options.search));

    return {
      configured: true,
      key,
      schema: objectConfig.schema,
      table: objectConfig.table,
      items: filtered,
      total: typeof countResult.count === "number" ? countResult.count : filtered.length,
      filtered: filtered.length,
      error: countResult.error?.message ?? null,
    };
  } catch (error) {
    return {
      configured: true,
      key,
      schema: objectConfig.schema,
      table: objectConfig.table,
      items: [] as Record<string, unknown>[],
      total: 0,
      filtered: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function listPlatformAdminUsers(options: ListOptions = {}) {
  return listMappedObject("adminUsers", options);
}

export async function listPlatformOrgUnits(options: ListOptions = {}) {
  return listMappedObject("orgUnits", options);
}

export async function listPlatformWaqfAssets(options: ListOptions = {}) {
  return listMappedObject("waqfAssets", options);
}

export async function listPlatformEndowments(options: ListOptions = {}) {
  return listMappedObject("endowments", options);
}

export function getPlatformBridgeStatus() {
  return {
    enabled: platformBridgeConfig.enabled,
    strict: platformBridgeConfig.strict,
    configured: isPlatformBridgeConfigured(),
    url: platformBridgeConfig.url,
    projectRef: platformBridgeConfig.projectRef ?? null,
    objects: objectEntries.map(([key, value]) => ({ key, ...value })),
  };
}

export async function checkPlatformBridgeConnectivity() {
  const client = getPlatformSupabaseClient();
  if (!client) {
    return {
      ok: false,
      configured: false,
      error:
        "Platform bridge is not configured. Set PLATFORM_SUPABASE_URL and PLATFORM_SUPABASE_SERVICE_ROLE_KEY in .env.",
    };
  }

  const probe = platformBridgeConfig.objects.adminUsers;
  const { count, error } = await scopedFrom(client, probe.schema, probe.table)
    .select("*", { count: "exact", head: true });

  return {
    ok: !error,
    configured: true,
    object: probe,
    count: typeof count === "number" ? count : null,
    error: error?.message ?? null,
  };
}

export function getPlatformSourceOfTruthMatrix() {
  return {
    summary: getSourceOfTruthReadinessSummary(),
    entities: sourceOfTruthMatrix,
  };
}

export async function previewMappedPlatformSourceOfTruth(limit = 3) {
  const raw = await previewPlatformSourceOfTruth(limit);
  if (!raw.configured) {
    return { ...raw, mapped: [] as any[] };
  }

  return {
    configured: true,
    mapped: raw.objects.map((entry) => ({
      key: entry.key,
      schema: entry.schema,
      table: entry.table,
      reachable: entry.reachable,
      count: entry.count,
      mappedSample: entry.sample.map((row) => mapSample(entry.key, row)),
      rawSample: entry.sample,
      error: entry.error,
    })),
  };
}

export async function previewPlatformSourceOfTruth(limit = 3) {
  const client = getPlatformSupabaseClient();
  if (!client) {
    return {
      configured: false,
      objects: [] as BridgeObjectPreview[],
      error:
        "Platform bridge is not configured. Set PLATFORM_SUPABASE_URL and PLATFORM_SUPABASE_SERVICE_ROLE_KEY in .env.",
    };
  }

  const results: BridgeObjectPreview[] = [];

  for (const [key, value] of objectEntries) {
    try {
      const countResult = await scopedFrom(client, value.schema, value.table).select("*", {
        count: "exact",
        head: true,
      });

      const sampleResult = await scopedFrom(client, value.schema, value.table)
        .select("*")
        .limit(limit);

      results.push({
        key,
        schema: value.schema,
        table: value.table,
        reachable: !countResult.error && !sampleResult.error,
        count: typeof countResult.count === "number" ? countResult.count : null,
        sample: Array.isArray(sampleResult.data) ? (sampleResult.data as Record<string, unknown>[]) : [],
        error: countResult.error?.message ?? sampleResult.error?.message ?? undefined,
      });
    } catch (error) {
      results.push({
        key,
        schema: value.schema,
        table: value.table,
        reachable: false,
        count: null,
        sample: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    configured: true,
    objects: results,
  };
}
