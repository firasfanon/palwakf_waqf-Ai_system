#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const rootIndex = args.indexOf("--project-root");
const projectRoot = path.resolve(rootIndex >= 0 ? args[rootIndex + 1] : process.cwd());

const failures = [];
const passes = [];

function read(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`MISSING_FILE::${relativePath}`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf8");
}

function expect(condition, marker, detail = "") {
  if (condition) passes.push(marker);
  else failures.push(detail ? `${marker}::${detail}` : marker);
}

const routes = read("client/src/lib/appRoutes.ts");
const registry = read("client/src/config/adminRegistryV2.ts");
const sidebar = read("client/src/components/admin/AdminSidebarV2.tsx");
const dashboard = read("client/src/pages/AdminDashboard.tsx");
const tools = read("client/src/pages/AITools.tsx");
const runs = read("client/src/pages/AIToolRuns.tsx");
const intake = read("client/src/pages/admin/ToolOutputIntake.tsx");
const workspace = read("client/src/pages/admin/KnowledgeOperationsWorkspace.tsx");
const activation = read("client/src/pages/admin/KnowledgeActivationCenter.tsx");
const preview = read("client/src/pages/admin/SourceInventoryPreview.tsx");

for (const routeKey of [
  "adminToolsOutputIntake",
  "adminKnowledgeWorkspace",
  "adminKnowledgeReviewOperations",
  "adminKnowledgeActivation",
  "adminSourceProvenanceRights",
  "adminSourceInventoryPreview",
]) {
  expect(routes.includes(`${routeKey}:`), `ROUTE_CONSTANT_${routeKey.toUpperCase()}=PASS`);
}

expect(
  registry.includes('import SourceInventoryPreview from "@/pages/admin/SourceInventoryPreview";'),
  "SOURCE_INVENTORY_PREVIEW_IMPORT=PASS",
);
expect(
  registry.includes("href: APP_ROUTES.adminSourceInventoryPreview"),
  "SOURCE_INVENTORY_PREVIEW_ROUTE_BINDING=PASS",
);
expect(registry.includes('title: "التشغيل الذكي"'), "SMART_OPERATION_SECTION_RENAMED=PASS");
expect(registry.includes('title: "مركز الأدوات الذكية"'), "SMART_TOOLS_PARENT_RENAMED=PASS");

expect(sidebar.includes("key={item.href}"), "SIDEBAR_ITEM_KEY_USES_HREF=PASS");
expect(sidebar.includes("key={child.href}"), "SIDEBAR_CHILD_KEY_USES_HREF=PASS");
expect(
  !sidebar.includes("key={item.title}") && !sidebar.includes("key={child.title}"),
  "SIDEBAR_TITLE_KEY_REMOVED=PASS",
);

expect(
  dashboard.includes('title: "مركز الأدوات الذكية"') &&
    dashboard.includes('title: "صندوق مخرجات الأدوات"') &&
    dashboard.includes('title: "معاينة جرد Manus"'),
  "DASHBOARD_OPERATIONAL_ACTIONS=PASS",
);
expect(
  dashboard.includes('key={`${action.href}:${action.title}`}'),
  "DASHBOARD_ACTION_KEY_UNIQUE=PASS",
);
expect(
  !dashboard.includes('title: "الأدوات الذكية", icon: Database') &&
    !dashboard.includes('title: "الأدوات الذكية", icon: Bell'),
  "DASHBOARD_DUPLICATE_SMART_TOOLS_ACTION_REMOVED=PASS",
);
expect(!dashboard.includes("تحرير PDF"), "DASHBOARD_NONFUNCTIONAL_PDF_CONTROL_REMOVED=PASS");
expect(
  dashboard.includes("await utils.invalidate()") &&
    dashboard.includes("تحديث المؤشرات"),
  "DASHBOARD_REFRESH_CONNECTED=PASS",
);
expect(
  dashboard.includes("toolMetrics") &&
    dashboard.includes("knowledgeOperations"),
  "DASHBOARD_OPERATIONAL_METRICS_CONNECTED=PASS",
);

for (const key of ["classify", "extract", "summarize", "compare", "precedents", "predict"]) {
  expect(tools.includes(`getAdminToolRoute("${key}")`), `SMART_TOOL_${key.toUpperCase()}_ROUTE=PASS`);
}
expect(tools.includes("APP_ROUTES.adminToolsOutputIntake"), "TOOLS_OUTPUT_INTAKE_LINK=PASS");
expect(tools.includes("APP_ROUTES.adminKnowledgeWorkspace"), "TOOLS_KNOWLEDGE_WORKSPACE_LINK=PASS");
expect(tools.includes("key={tool.href}"), "TOOLS_CARD_KEY_USES_ROUTE=PASS");

expect(runs.includes("runIdFromLocation"), "RUNS_DEEP_LINK_READER=PASS");
expect(runs.includes("?runId=${encodeURIComponent(run.id)}"), "RUNS_DEEP_LINK_WRITER=PASS");
expect(runs.includes("APP_ROUTES.adminToolsOutputIntake"), "RUNS_OUTPUT_INTAKE_LINK=PASS");

expect(
  intake.includes("?runId=${encodeURIComponent(run.id)}"),
  "OUTPUT_INTAKE_RUN_DEEP_LINK=PASS",
);
expect(intake.includes("APP_ROUTES.adminKnowledgeWorkspace"), "OUTPUT_INTAKE_KNOWLEDGE_LINK=PASS");

expect(
  workspace.includes("trpc.knowledgeSources.stats.useQuery") &&
    !workspace.includes("sources: 10"),
  "KNOWLEDGE_WORKSPACE_LIVE_SOURCE_COUNT=PASS",
);
expect(
  workspace.includes("APP_ROUTES.adminSourceInventoryPreview"),
  "KNOWLEDGE_WORKSPACE_MANUS_PREVIEW_LINK=PASS",
);

expect(!activation.includes("Staging"), "ACTIVATION_STAGING_COPY_REMOVED=PASS");
expect(
  activation.includes("APP_ROUTES.adminKnowledgeReviewOperations") &&
    activation.includes("APP_ROUTES.adminSourceProvenanceRights"),
  "ACTIVATION_CENTRAL_ROUTES=PASS",
);

for (const marker of [
  "LOCAL_MEMORY_ONLY",
  "NO_DATABASE_WRITE",
  "NO_AUTOMATIC_APPROVAL",
  "PUBLIC_DOMAIN",
  "OPEN_LICENSE",
  "RIGHTS_UNCLEAR",
  "NOT_VERIFIED",
]) {
  expect(preview.includes(marker), `PREVIEW_MARKER_${marker}=PASS`);
}
expect(preview.includes("await file.text()"), "PREVIEW_LOCAL_FILE_READ=PASS");

for (const forbidden of [
  "trpc.",
  "fetch(",
  "axios",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
]) {
  expect(!preview.includes(forbidden), `PREVIEW_FORBIDDEN_${forbidden.replace(/[^A-Za-z0-9]+/g, "_")}=PASS`);
}

const registryRoutes = [...registry.matchAll(/href:\s*(APP_ROUTES\.[A-Za-z0-9_]+|"\/admin\/[^"]+")/g)]
  .map((match) => match[1]);
const duplicateRegistryRoutes = registryRoutes.filter(
  (value, index) => registryRoutes.indexOf(value) !== index,
);
expect(
  duplicateRegistryRoutes.length === 0,
  "REGISTRY_ROUTE_DUPLICATION=PASS",
  duplicateRegistryRoutes.join(","),
);

if (failures.length) {
  console.error("PRODUCT_SURFACES_WAVE_1_STATIC_VERIFY=FAIL");
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

for (const pass of passes) console.log(pass);
console.log(`STATIC_ASSERTION_COUNT=${passes.length}`);
console.log("PRODUCT_SURFACES_WAVE_1_STATIC_VERIFY=PASS");
console.log("DATABASE_CHANGE=NO");
console.log("SERVER_API_CHANGE=NO");
console.log("CHAT_RELEASE=NO");
console.log("PRODUCTION=NO");
