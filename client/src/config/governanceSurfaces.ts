import {
  Brain,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/appRoutes";
import type { NavItem, NavSection } from "./adminRegistryV2";

export type AdminWorkspaceKind = "daily" | "governance";

const DAILY_GROUPS: Array<{
  title: string;
  icon: NavSection["icon"];
  hrefs: string[];
}> = [
  {
    title: "العمل اليومي",
    icon: LayoutDashboard,
    hrefs: [
      APP_ROUTES.adminDashboard,
      APP_ROUTES.adminAssistant,
      APP_ROUTES.adminOperationsSearch,
      "/admin/activity",
    ],
  },
  {
    title: "المعرفة",
    icon: Brain,
    hrefs: [
      APP_ROUTES.adminKnowledgeWorkspace,
      APP_ROUTES.adminKnowledgeReviewOperations,
      "/admin/knowledge",
      "/admin/knowledge-search",
      "/admin/knowledge-sources",
      "/admin/files",
    ],
  },
  {
    title: "الأدوات الذكية",
    icon: Sparkles,
    hrefs: [APP_ROUTES.adminTools],
  },
  {
    title: "البيانات الوقفية",
    icon: Building2,
    hrefs: [
      "/admin/properties",
      "/admin/cases",
      "/admin/rulings",
      "/admin/deeds",
      "/admin/instructions",
      "/admin/waqf-categories",
    ],
  },
];

const DAILY_PREFIXES = Array.from(
  new Set(
    DAILY_GROUPS.flatMap((group) => group.hrefs).concat([
      "/admin/tools",
      "/admin/properties",
      "/admin/cases",
      "/admin/rulings",
    ]),
  ),
);

export const governanceSurfaceInventory = [
  {
    href: "/admin/* except curated daily routes",
    workspaceKind: "governance" as const,
    purpose: "إدارة إعدادات أو أدلة أو أمن أو محتوى أو تحليلات أو تشغيل متقدم لا يحتاجه المستخدم في المسار اليومي.",
  },
];

function pathMatchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`);
}

export function isDailyAdminRoute(path: string): boolean {
  return DAILY_PREFIXES.some((prefix) => pathMatchesPrefix(path, prefix));
}

export function isGovernanceAdminRoute(path: string): boolean {
  return !isDailyAdminRoute(path);
}

export function getAdminWorkspaceKind(path: string): AdminWorkspaceKind {
  return isDailyAdminRoute(path) ? "daily" : "governance";
}

function collectTopLevelItems(sections: NavSection[]) {
  const byHref = new Map<string, NavItem>();
  for (const section of sections) {
    for (const item of section.items) {
      if (!byHref.has(item.href)) byHref.set(item.href, item);
    }
  }
  return byHref;
}

function collectItemHrefs(item: NavItem, out: Set<string>) {
  out.add(item.href);
  for (const child of item.children ?? []) out.add(child.href);
}

export function splitAdminNavSections(sections: NavSection[]) {
  const byHref = collectTopLevelItems(sections);
  const used = new Set<string>();

  const operational: NavSection[] = DAILY_GROUPS.map((group) => {
    const items = group.hrefs
      .map((href) => byHref.get(href))
      .filter(Boolean) as NavItem[];

    for (const item of items) collectItemHrefs(item, used);

    return {
      title: group.title,
      icon: group.icon,
      items,
    };
  }).filter((section) => section.items.length > 0);

  const governanceItems: NavItem[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      if (used.has(item.href)) continue;
      governanceItems.push(item);
    }
  }

  return {
    operational,
    governance: governanceItems.length
      ? [
          {
            title: "الحوكمة والإدارة المتقدمة",
            icon: ShieldCheck,
            items: governanceItems,
          },
        ]
      : [],
  };
}
