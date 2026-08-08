import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["knowledge workspace route is registered", "client/src/config/adminRegistryV2.ts", "/admin/knowledge-workspace"],
  ["KB08B pilot route is registered", "client/src/config/adminRegistryV2.ts", "/admin/kb08b-pilot"],
  ["tool output intake route is registered", "client/src/config/adminRegistryV2.ts", "/admin/tools/output-intake"],
  ["deferred Mega Batch A audit is a governance route", "client/src/config/governanceSurfaces.ts", '"/admin/governance"'],
  ["KB08B pilot has no mapping mutation", "client/src/pages/admin/KB08BPilotCandidate.tsx", "data-kb08b-pilot-read-only"],
  ["KB08B pilot contains the fixed ten-record cohort", "client/src/pages/admin/KB08BPilotCandidate.tsx", "PILOT_MATRIX"],
  ["tool intake separates failed outputs", "client/src/pages/admin/ToolOutputIntake.tsx", "failed_diagnostic"],
  ["tool intake does not save as knowledge", "client/src/pages/admin/ToolOutputIntake.tsx", "لا تنشئ هذه الصفحة وثيقة معرفة"],
  ["deferred audit register includes all four pending gates", "client/src/pages/admin/DeferredMegaBatchAAudit.tsx", "FULL_PAGE_INVENTORY_UAT"],
];

let failures = 0;
for (const [label, rel, expected] of checks) {
  const file = path.join(root, rel);
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (content.includes(expected)) {
    console.log(`PASS :: ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL :: ${label} :: ${rel}`);
  }
}

if (failures) {
  console.error(`MEGA_BATCH_B_STATIC_VERIFICATION=FAIL (${failures})`);
  process.exit(1);
}
console.log("MEGA_BATCH_B_STATIC_VERIFICATION=PASS");
