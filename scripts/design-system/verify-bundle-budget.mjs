import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist", "public");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const match = html.match(/<script[^>]+src="([^"]+\.js)"/);
if (!match) throw new Error("Unable to resolve entry JS from dist/public/index.html");

const entryPath = path.join(dist, match[1].replace(/^\//, ""));
const entryBytes = fs.statSync(entryPath).size;
const ENTRY_BUDGET_BYTES = 550000;

if (entryBytes > ENTRY_BUDGET_BYTES) {
  throw new Error("Entry bundle budget exceeded: " + entryBytes + " > " + ENTRY_BUDGET_BYTES);
}

const jsAssets = fs.readdirSync(path.join(dist, "assets"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, bytes: fs.statSync(path.join(dist, "assets", name)).size }))
  .sort((a, b) => b.bytes - a.bytes);

console.log(JSON.stringify({
  status: "PASS",
  entry: path.basename(entryPath),
  entryBytes,
  entryBudgetBytes: ENTRY_BUDGET_BYTES,
  entryBudgetHeadroomBytes: ENTRY_BUDGET_BYTES - entryBytes,
  jsAssetCount: jsAssets.length,
  largestAssets: jsAssets.slice(0, 10),
  policy: "Entry budget is enforced; large feature/vendor chunks remain lazy and separately reviewable."
}, null, 2));
