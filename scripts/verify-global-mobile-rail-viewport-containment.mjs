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
const adminCss = read("client/src/styles/admin.css");
const foundationCss = read("client/src/styles/operational-foundation.css");
const pkg = read("package.json");

assertContains("admin layout declares mobile rail guard", layout, 'data-mobile-rail-guard="true"');
assertContains("mobile layout avoids scrollbar-inclusive dvw width", adminCss, 'width: 100% !important;');
assertContains("mobile layout uses rail guard selector", adminCss, 'admin-layout[data-mobile-rail-guard="true"]');
assertContains("mobile root clips horizontal overflow", adminCss, 'overflow-x: clip !important;');
assertContains("mobile rail is suppressed", adminCss, '[data-slot="sidebar-rail"]');
assertContains("mobile sidebar gap is suppressed", adminCss, '[data-slot="sidebar-gap"]');
assertContains("mobile column resize residue is suppressed", adminCss, '.cursor-col-resize');
assertContains("mobile drawer uses percentage width", adminCss, 'width: min(86%, 340px) !important;');
assertContains("operational foundation avoids scrollbar-inclusive sidebar vw", foundationCss, 'width: min(88%, 20rem) !important;');
assertContains("global rail verifier is registered", pkg, 'verify:global-mobile-rail-viewport-containment');

console.log("GLOBAL_MOBILE_RAIL_VIEWPORT_CONTAINMENT_STATIC_VERIFICATION=PASS");
