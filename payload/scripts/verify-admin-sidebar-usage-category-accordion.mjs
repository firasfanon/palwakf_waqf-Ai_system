import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assertContains(label, haystack, needle) {
  if (!haystack.includes(needle)) {
    console.error(`FAIL :: ${label}`);
    console.error(`Missing: ${needle}`);
    process.exit(1);
  }
  console.log(`PASS :: ${label}`);
}

const sidebar = read("client/src/components/admin/AdminSidebarV2.tsx");
const css = read("client/src/styles/admin.css");
const pkg = read("package.json");

assertContains("sidebar derives an active usage category", sidebar, "activeSectionTitle");
assertContains("sidebar tracks category expansion independently", sidebar, "expandedCategoryTitles");
assertContains("sidebar renders an accessible category control", sidebar, "admin-nav-category-toggle");
assertContains("category control exposes aria-expanded", sidebar, "aria-expanded={sectionExpanded}");
assertContains("search reveals matching categories", sidebar, "const hasActiveSearch = query.trim().length > 0");
assertContains("nested tool/dropdown expansion remains scoped", sidebar, "const itemKey = `${section.title}::${item.title}`");
assertContains("category panels have a visual contract", css, ".admin-nav-section {");
assertContains("category toggles are full width", css, ".admin-nav-category-toggle {");
assertContains("category content keeps a contained layout", css, ".admin-nav-section > .admin-nav-items");
assertContains("light theme category treatment exists", css, "body.admin-scope .admin-nav-category-icon");
assertContains("mobile category containment exists", css, ".admin-sidebar[data-sidebar-variant=\"mobile\"] .admin-nav-section");
assertContains("usage category verifier is registered", pkg, "verify:admin-sidebar-usage-category-accordion");

console.log("ADMIN_SIDEBAR_USAGE_CATEGORY_ACCORDION_STATIC_VERIFICATION=PASS");
