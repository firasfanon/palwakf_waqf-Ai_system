import type { NavItem, NavSection } from "./adminRegistryV2";

export type AdminWorkspaceKind = "daily" | "governance";

const GOVERNANCE_PREFIXES = [
  "/admin/staging-evidence",
  "/admin/governance",
  "/admin/audit-logs",
  "/admin/security",
  "/admin/api-keys",
  "/admin/roles",
  "/admin/permissions",
  "/admin/role-permissions",
  "/admin/system-settings",
  "/admin/cache",
  "/admin/maintenance",
  "/admin/backup",
  "/admin/integrations",
  "/admin/webhooks",
  "/admin/platform-bridge",
  "/admin/pages-classification",
];

export const governanceSurfaceInventory = GOVERNANCE_PREFIXES.map((href) => ({
  href,
  workspaceKind: "governance" as const,
  purpose: "إدارة سياسات أو أدلة أو أمن أو تدقيق أو إعدادات تشغيلية حساسة.",
}));

export function isGovernanceAdminRoute(path: string): boolean {
  return GOVERNANCE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function getAdminWorkspaceKind(path: string): AdminWorkspaceKind {
  return isGovernanceAdminRoute(path) ? "governance" : "daily";
}

function isGovernanceItem(item: NavItem): boolean {
  return isGovernanceAdminRoute(item.href);
}

export function splitAdminNavSections(sections: NavSection[]) {
  const operational: NavSection[] = [];
  const governanceItems: NavItem[] = [];

  for (const section of sections) {
    const dailyItems: NavItem[] = [];
    for (const item of section.items) {
      if (isGovernanceItem(item)) {
        governanceItems.push(item);
        continue;
      }

      const dailyChildren = (item.children ?? []).filter((child) => !isGovernanceItem(child));
      const governanceChildren = (item.children ?? []).filter(isGovernanceItem);
      if (governanceChildren.length) governanceItems.push(...governanceChildren);

      dailyItems.push(item.children ? { ...item, children: dailyChildren } : item);
    }

    if (dailyItems.length) operational.push({ ...section, items: dailyItems });
  }

  return {
    operational,
    governance: governanceItems.length
      ? [{ title: "الحوكمة والأدلة", icon: sections[0]!.icon, items: governanceItems }]
      : [],
  };
}
