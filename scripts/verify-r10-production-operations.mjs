import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const checks = [
  ["client/src/lib/appRoutes.ts", "adminAssistant: \"/admin/assistant\""],
  ["client/src/lib/appRoutes.ts", "adminOperationsSearch: \"/admin/operations-search\""],
  ["client/src/pages/AdminDashboard.tsx", "مركز العمل"],
  ["client/src/pages/AdminDashboard.tsx", "palwakf-last-operational-route"],
  ["client/src/pages/AdminDashboard.tsx", "knowledgeTrust.reviewTasks.useQuery"],
  ["client/src/pages/AdminDashboard.tsx", "aiTools.listRuns.useQuery"],
  ["client/src/pages/admin/KnowledgeOperationsWorkspace.tsx", "claimReviewTask.useMutation"],
  ["client/src/pages/admin/KnowledgeOperationsWorkspace.tsx", "تفاصيل العمل المحدد"],
  ["client/src/pages/AITools.tsx", "استوديو الأدوات الذكية"],
  ["client/src/pages/AITools.tsx", "<details"],
  ["client/src/pages/admin/OperationsSearch.tsx", "knowledgeSearch.search.useMutation"],
  ["client/src/pages/admin/OperationsSearch.tsx", "knowledgeSources.list.useQuery"],
  ["client/src/pages/admin/OperationsSearch.tsx", "aiTools.listRuns.useQuery"],
  ["client/src/config/governanceSurfaces.ts", "الحوكمة والإدارة المتقدمة"],
  ["client/src/config/adminRegistryV2.ts", "APP_ROUTES.adminAssistant"],
  ["client/src/config/adminRegistryV2.ts", "APP_ROUTES.adminOperationsSearch"],
  ["client/src/config/adminRegistryV2.ts", "icon: Search"],
  ["client/src/components/admin/AdminLayoutV2.tsx", "palwakf-last-operational-route"],
  ["PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md", "R10_PRODUCTION_OPERATIONS_WORKBENCH"],
];

let failures = 0;

for (const [relative, marker] of checks) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    console.error(`MISSING_FILE=${relative}`);
    failures += 1;
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(marker)) {
    console.error(`MISSING_MARKER=${relative}::${marker}`);
    failures += 1;
  }
}

const lockPath = path.join(root, "pnpm-lock.yaml");
if (!fs.existsSync(lockPath)) {
  console.error("PNPM_LOCK_MISSING");
  failures += 1;
}

if (failures > 0) {
  console.error(`R10_STATIC_VERIFIER=FAIL failures=${failures}`);
  process.exit(1);
}

console.log("R10_CORE_SURFACES=PASS");
console.log("R10_REAL_QUERY_BINDINGS=PASS");
console.log("R10_GOVERNANCE_SECONDARY_NAV=PASS");
console.log("R10_RESUME_ROUTE_MARKER=PASS");
console.log("R10_STATIC_VERIFIER=PASS");
