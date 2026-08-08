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

const layout = read("client/src/components/admin/AdminLayoutV2.tsx");
const sidebar = read("client/src/components/admin/AdminSidebarV2.tsx");
const css = read("client/src/styles/admin.css");
const pkg = read("package.json");

assertContains("admin layout owns mobile sidebar state", layout, "mobileSidebarOpen");
assertContains("admin layout renders mobile menu button", layout, "admin-mobile-menu-button");
assertContains("admin layout renders mobile scrim", layout, "admin-mobile-sidebar-scrim");
assertContains("admin sidebar accepts mobile props", sidebar, "AdminSidebarV2Props");
assertContains("admin sidebar exposes mobile open state", sidebar, "data-mobile-open");
assertContains("admin sidebar has mobile close action", sidebar, "admin-sidebar-mobile-close");
assertContains("admin mobile media query exists", css, "@media (max-width: 900px)");
assertContains("mobile sidebar removed from document flow", css, "position: fixed !important");
assertContains("mobile sidebar opens via transform", css, ".admin-sidebar.mobile-open");
assertContains("mobile drawer uses physical RTL right edge", css, "right: 0 !important");
assertContains("mobile drawer clears physical left edge", css, "left: auto !important");
assertContains("closed drawer is fully translated off canvas", css, "translate3d(calc(100% + 1px), 0, 0)");
assertContains("closed drawer is non-interactive", css, "pointer-events: none");
assertContains("closed drawer is visually hidden", css, "visibility: hidden");
assertContains("mobile content owns full parent width", css, "width: 100% !important");
assertContains("mobile page prevents horizontal clipping", css, "overflow-x: hidden !important");
assertContains("sidebar search uses a viewport-specific id", sidebar, 'admin-sidebar-search-mobile');
assertContains("sidebar search uses a viewport-specific name", sidebar, 'admin-sidebar-search-desktop');
assertContains("mobile verification script is registered", pkg, "verify:admin-shell-mobile-closure");

console.log("ADMIN_SHELL_MOBILE_DRAWER_RTL_POSITIONING_AND_DOCUMENT_FLOW_STATIC_VERIFICATION=PASS");
