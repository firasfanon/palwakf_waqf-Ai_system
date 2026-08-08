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
const css = read("client/src/styles/admin.css");
const pkg = read("package.json");

assertContains("mobile drawer uses a body portal", layout, "createPortal");
assertContains("mobile drawer portal targets document.body", layout, "document.body");
assertContains("desktop sidebar remains non-mobile in document flow", layout, "<AdminSidebarV2 mobileOpen={false}");
assertContains("mobile overlay includes a portalled sidebar", layout, "<AdminSidebarV2 mobileOpen={true}");
assertContains("mobile overlay includes close scrim", layout, "admin-mobile-sidebar-scrim");
assertContains("mobile drawer remains viewport-fixed", css, "position: fixed !important");
assertContains("mobile drawer retains RTL physical edge", css, "right: 0 !important");
assertContains("portal verification script is registered", pkg, "verify:admin-mobile-drawer-portal");

console.log("ADMIN_MOBILE_DRAWER_PORTAL_NAVIGATION_VISIBILITY_STATIC_VERIFICATION=PASS");
