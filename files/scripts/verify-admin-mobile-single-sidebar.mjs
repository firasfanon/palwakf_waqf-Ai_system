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

assertContains("layout derives the viewport breakpoint", layout, "useMediaQuery(\"(max-width: 900px)\")");
assertContains("desktop sidebar is omitted on mobile", layout, "!isMobileShell ? <AdminSidebarV2 variant=\"desktop\"");
assertContains("mobile portal mounts one mobile variant", layout, "<AdminSidebarV2 variant=\"mobile\" mobileOpen={true}");
assertContains("sidebar accepts a viewport variant", sidebar, "variant?: \"desktop\" | \"mobile\"");
assertContains("sidebar emits its variant", sidebar, "data-sidebar-variant={variant}");
assertContains("sidebar uses separate mobile search identity", sidebar, "admin-sidebar-search-mobile");
assertContains("sidebar nav carries containment marker", sidebar, 'data-admin-nav="true"');
assertContains("mobile sidebar is an explicit column", css, "flex-direction: column !important");
assertContains("mobile sidebar nav occupies its own scroll region", css, "flex: 1 1 auto !important");
assertContains("mobile nav items are width-contained", css, "width: 100% !important");
assertContains("mobile nav items clear inherited transforms", css, "transform: none !important");
assertContains("desktop variant has a mobile guard", css, '[data-sidebar-variant="desktop"]');
assertContains("single sidebar verifier is registered", pkg, "verify:admin-mobile-single-sidebar");

console.log("ADMIN_MOBILE_SINGLE_SIDEBAR_RENDER_AND_NAV_CONTAINMENT_STATIC_VERIFICATION=PASS");
