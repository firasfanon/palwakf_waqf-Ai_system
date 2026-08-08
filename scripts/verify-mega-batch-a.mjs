import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const checks = [
  ["client/src/main.tsx", /operational-foundation\.css/, "global operational CSS is imported"],
  ["client/src/components/ErrorBoundary.tsx", /\[Application Error Boundary\]/, "error boundary keeps diagnostics in console only"],
  ["client/src/pages/admin/KnowledgeReviewOperations.tsx", /stageMismatch/, "review stage mismatch guard exists"],
  ["client/src/pages/admin/KnowledgeReviewOperations.tsx", /content_classification/, "classification workflow exists"],
  ["client/src/config/governanceSurfaces.ts", /governanceSurfaceInventory/, "governance inventory exists"],
  ["client/src/components/admin/AdminLayoutV2.tsx", /data-workspace-kind/, "workspace kind is emitted by layout"],
  ["package.json", /"dev": "node scripts\/run-dev\.mjs"/, "cross-platform dev runner is configured"],
];

let failures = 0;
for (const [file, expectation, label] of checks) {
  const content = await readFile(resolve(file), "utf8");
  const passed = expectation instanceof RegExp ? expectation.test(content) : Boolean(expectation);
  console.log(`${passed ? "PASS" : "FAIL"} :: ${label}`);
  if (!passed) failures += 1;
}

const boundary = await readFile(resolve("client/src/components/ErrorBoundary.tsx"), "utf8");
const rendersRawStack = /this\.state\.error\?\.stack/.test(boundary);
console.log(`${rendersRawStack ? "FAIL" : "PASS"} :: raw error stack is not rendered`);
if (rendersRawStack) failures += 1;

const review = await readFile(resolve("client/src/pages/admin/KnowledgeReviewOperations.tsx"), "utf8");
const mojibake = /(?:Ø.|Ù.|â€)/.test(review);
console.log(`${mojibake ? "FAIL" : "PASS"} :: review workspace has no mojibake literals`);
if (mojibake) failures += 1;

if (failures) process.exit(1);
console.log("MEGA_BATCH_A_STATIC_FOUNDATION_VERIFICATION=PASS");
