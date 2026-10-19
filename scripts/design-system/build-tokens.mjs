import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceFiles = [
  "design-system/tokens/core/color.json",
  "design-system/tokens/core/dimension.json",
  "design-system/tokens/semantic/light.json",
  "design-system/tokens/components/status.json",
];

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("$")) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && !("$value" in value)) {
      target[key] ??= {};
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const tree = {};
for (const file of sourceFiles) {
  merge(tree, JSON.parse(fs.readFileSync(path.join(root, file), "utf8")));
}

const raw = new Map();
function collect(node, prefix = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const next = [...prefix, key];
    if (value && typeof value === "object" && "$value" in value) {
      raw.set(next.join("."), value);
    } else if (value && typeof value === "object") {
      collect(value, next);
    }
  }
}
collect(tree);

function formatLiteral(value) {
  if (value && typeof value === "object") {
    if (typeof value.hex === "string") return value.hex;
    if (typeof value.value === "number" && typeof value.unit === "string") return `${value.value}${value.unit}`;
  }
  return String(value);
}

function resolve(name, stack = []) {
  if (stack.includes(name)) throw new Error(`Circular token reference: ${[...stack, name].join(" -> ")}`);
  const token = raw.get(name);
  if (!token) throw new Error(`Unknown token: ${name}`);
  const value = token.$value;
  if (typeof value === "string") {
    const match = value.match(/^\{([^}]+)\}$/);
    if (match) return resolve(match[1], [...stack, name]);
  }
  return formatLiteral(value);
}

function cssName(name) {
  return "--ds-" + name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/\./g, "-").toLowerCase();
}

const names = [...raw.keys()].sort();
const css = [
  "/* GENERATED FILE. Source: design-system/tokens/**. Do not edit directly. */",
  ":root {",
  ...names.map((name) => `  ${cssName(name)}: ${resolve(name)};`),
  "}",
  "",
].join("\n");

const ts = [
  "/* GENERATED FILE. Source: design-system/tokens/**. Do not edit directly. */",
  "export const designTokens = " + JSON.stringify(Object.fromEntries(names.map((name) => [name, resolve(name)])), null, 2) + " as const;",
  "export type DesignTokenName = keyof typeof designTokens;",
  "",
].join("\n");

fs.writeFileSync(path.join(root, "client/src/styles/generated-design-tokens.css"), css);
fs.writeFileSync(path.join(root, "client/src/lib/designTokens.generated.ts"), ts);
console.log(JSON.stringify({ tokenCount: names.length, css: "client/src/styles/generated-design-tokens.css", ts: "client/src/lib/designTokens.generated.ts" }));
