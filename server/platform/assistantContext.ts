import type { AuthenticatedUser } from "../_core/types/authUser";
import {
  listPlatformEndowments,
  listPlatformOrgUnits,
  listPlatformWaqfAssets,
} from "./bridge";
import { platformBridgeConfig } from "./config";

type PlatformSearchItem = Record<string, unknown>;

type SearchResult = {
  configured: boolean;
  query: string;
  userScope: {
    source: string | null;
    platformRole: string | null;
    unitId: string | number | null;
    orgUnit: PlatformSearchItem | null;
  };
  waqfAssets: PlatformSearchItem[];
  endowments: PlatformSearchItem[];
  orgUnits: PlatformSearchItem[];
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function extractSearchCandidates(query: string, hints: Array<string | null | undefined> = []) {
  const base = [query, ...hints]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  const tokens = base
    .flatMap((value) => value.split(/[\s،,؛;:/\\|()\[\]{}]+/))
    .map((value) => normalizeText(value))
    .filter((value) => value.length >= 3 || /\d/.test(value));

  const candidates = uniqueBy([...base, ...tokens], (item) => item.toLowerCase());
  return candidates.slice(0, 10);
}

async function mergeSearchResults(
  searchers: Array<(search: string) => Promise<PlatformSearchItem[]>>,
  candidates: string[],
  limit: number,
) {
  const collected: PlatformSearchItem[] = [];

  for (const candidate of candidates) {
    for (const searcher of searchers) {
      try {
        const items = await searcher(candidate);
        collected.push(...items);
      } catch {
        // Best-effort read-only bridge: ignore failing search path and continue.
      }
      if (collected.length >= limit * 3) break;
    }
    if (collected.length >= limit * 3) break;
  }

  return uniqueBy(collected, (item) => normalizeText(item.id ?? item.nationalAssetCode ?? item.nameAr ?? item.slug)).slice(0, limit);
}

async function resolveUserOrgUnit(unitId: string | number | null | undefined) {
  if (unitId == null || unitId === "") return null;

  const result = await listPlatformOrgUnits({ search: String(unitId), limit: 50 });
  const items = Array.isArray(result.items) ? result.items : [];
  return items.find((item) => String(item.id ?? "") === String(unitId)) ?? items[0] ?? null;
}

export async function buildPlatformAssistantContext(params: {
  query: string;
  user?: AuthenticatedUser | null;
  hints?: Array<string | null | undefined>;
  limit?: number;
}): Promise<SearchResult> {
  const query = normalizeText(params.query);
  const limit = Math.min(Math.max(params.limit ?? 3, 1), 8);
  const candidates = extractSearchCandidates(query, params.hints);

  const [userOrgUnit, waqfAssets, endowments, orgUnits] = await Promise.all([
    resolveUserOrgUnit(params.user?.unitId),
    mergeSearchResults(
      [async (search) => (await listPlatformWaqfAssets({ search, limit: limit * 2 })).items ?? []],
      candidates,
      limit,
    ),
    mergeSearchResults(
      [async (search) => (await listPlatformEndowments({ search, limit: limit * 2 })).items ?? []],
      candidates,
      limit,
    ),
    mergeSearchResults(
      [async (search) => (await listPlatformOrgUnits({ search, limit: limit * 2 })).items ?? []],
      candidates,
      limit,
    ),
  ]);

  return {
    configured: platformBridgeConfig.enabled,
    query,
    userScope: {
      source: params.user?.source ?? null,
      platformRole: params.user?.platformRole ?? null,
      unitId: params.user?.unitId ?? null,
      orgUnit: userOrgUnit,
    },
    waqfAssets,
    endowments,
    orgUnits,
  };
}

export function formatPlatformAssistantContext(result: SearchResult): string {
  const lines: string[] = [];

  if (result.userScope.source || result.userScope.platformRole || result.userScope.unitId) {
    lines.push("سياق المستخدم المنصّي:");
    lines.push(`- المصدر: ${result.userScope.source ?? "غير محدد"}`);
    lines.push(`- الدور المنصّي: ${result.userScope.platformRole ?? "غير محدد"}`);
    lines.push(`- معرف الوحدة: ${result.userScope.unitId ?? "غير محدد"}`);
    if (result.userScope.orgUnit) {
      lines.push(
        `- الوحدة المطابقة: ${normalizeText(result.userScope.orgUnit.nameAr ?? result.userScope.orgUnit.nameEn ?? result.userScope.orgUnit.slug) || "غير محدد"}`
      );
    }
  }

  if (result.waqfAssets.length > 0) {
    lines.push("أصول وقفية مرجعية مطابقة:");
    for (const asset of result.waqfAssets) {
      lines.push(
        `- أصل: ${normalizeText(asset.nameAr) || "بدون اسم"} | الرمز الوطني: ${normalizeText(asset.nationalAssetCode) || "—"} | الوقف الأم: ${normalizeText(asset.endowmentName) || "—"} | الحالة: ${normalizeText(asset.status) || "—"}`
      );
    }
  }

  if (result.endowments.length > 0) {
    lines.push("أوقاف أم مرجعية مطابقة:");
    for (const endowment of result.endowments) {
      lines.push(
        `- وقف أم: ${normalizeText(endowment.nameAr ?? endowment.nameEn) || "بدون اسم"} | الحالة: ${normalizeText(endowment.status) || "—"} | النوع: ${normalizeText(endowment.type) || "—"}`
      );
    }
  }

  if (result.orgUnits.length > 0) {
    lines.push("وحدات تنظيمية ذات صلة:");
    for (const unit of result.orgUnits) {
      lines.push(
        `- وحدة: ${normalizeText(unit.nameAr ?? unit.nameEn ?? unit.slug) || "بدون اسم"} | slug: ${normalizeText(unit.slug) || "—"} | النوع: ${normalizeText(unit.unitType) || "—"}`
      );
    }
  }

  return lines.join("\n").trim();
}
