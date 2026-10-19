import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const required = [
  "design-system/tokens/core/color.json",
  "design-system/tokens/core/dimension.json",
  "design-system/tokens/semantic/light.json",
  "design-system/tokens/components/status.json",
  "design-system/tokens/metadata/ownership.json",
  "client/src/styles/generated-design-tokens.css",
  "client/src/lib/designTokens.generated.ts",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing design-system artifact: ${file}`);
}

const before = required.slice(-2).map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const run = spawnSync(process.execPath, [path.join(root, "scripts/design-system/build-tokens.mjs")], {
  cwd: root,
  encoding: "utf8",
});
if (run.status !== 0) throw new Error(run.stderr || run.stdout || "token build failed");
const after = required.slice(-2).map((file) => fs.readFileSync(path.join(root, file), "utf8"));
if (before[0] !== after[0] || before[1] !== after[1]) throw new Error("Generated token artifacts were stale");

const css = after[0];
for (const requiredVar of [
  "--ds-color-action-primary",
  "--ds-color-status-success",
  "--ds-color-status-warning",
  "--ds-color-status-danger",
  "--ds-color-status-info",
  "--ds-space-md",
  "--ds-radius-md",
]) {
  if (!css.includes(requiredVar + ":")) throw new Error(`Missing generated semantic variable: ${requiredVar}`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const clientFiles = walk(path.join(root, "client/src")).filter((file) => /\.(?:ts|tsx|css)$/.test(file));
const rawStatePattern = /\b(?:bg|text|border|from|via|to|ring|outline|fill|stroke|divide)-(?:red|green|blue|yellow|amber|emerald|orange)-\d+(?:\/\d+)?/g;
const rawStateViolations = [];
for (const file of clientFiles) {
  const source = fs.readFileSync(file, "utf8");
  const matches = source.match(rawStatePattern);
  if (matches?.length) rawStateViolations.push({ file: path.relative(root, file).replace(/\\/g, "/"), matches });
}
if (rawStateViolations.length) {
  throw new Error("Raw state-color utilities remain: " + JSON.stringify(rawStateViolations.slice(0, 8)));
}

const exceptionLedger = JSON.parse(
  fs.readFileSync(path.join(root, "design-system/tokens/metadata/raw-value-exceptions.json"), "utf8"),
);
const allowedHexFiles = new Set(
  exceptionLedger.temporaryLegacyExceptions.map((item) => item.path.replace(/\\/g, "/")),
);
allowedHexFiles.add("client/src/styles/generated-design-tokens.css");
allowedHexFiles.add("client/src/lib/designTokens.generated.ts");

const hexViolations = [];
for (const file of clientFiles) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const source = fs.readFileSync(file, "utf8");
  const matches = source.match(/#[0-9A-Fa-f]{3,8}\b/g);
  if (matches?.length && !allowedHexFiles.has(rel)) hexViolations.push({ file: rel, count: matches.length });
}
if (hexViolations.length) throw new Error("Unclassified raw HEX values: " + JSON.stringify(hexViolations));

const registry = fs.readFileSync(path.join(root, "client/src/config/adminRegistryV2.ts"), "utf8");
if (/lifecycle:\s*"stub_page"/.test(registry)) throw new Error("Unclassified admin stub_page remains");
if (!registry.includes('/admin/design-system')) throw new Error("Design System catalog route is not bound");

console.log(
  JSON.stringify({
    status: "PASS",
    deterministic: true,
    requiredArtifacts: required.length,
    rawStateColorViolations: 0,
    unclassifiedHexViolations: 0,
    rawHexExceptionFiles: allowedHexFiles.size,
    unclassifiedAdminStubs: 0,
  }),
);
