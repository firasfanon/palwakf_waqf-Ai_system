import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL :: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS :: ${message}`);
  }
};
const pngDimensions = (relative) => {
  const data = fs.readFileSync(path.join(root, relative));
  const signature = '89504e470d0a1a0a';
  if (data.subarray(0, 8).toString('hex') !== signature) return null;
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
};

const html = read('client/index.html');
const main = read('client/src/main.tsx');
const workspace = read('client/src/pages/admin/KnowledgeOperationsWorkspace.tsx');
const manifest = read('client/public/manifest.json');

assert(!html.includes('%VITE_ANALYTICS_ENDPOINT%/umami'), 'static unresolved umami script is removed from index.html');
assert(main.includes('function loadOptionalAnalytics()') && main.includes('if (!endpoint || !websiteId) return;'), 'analytics script is gated by both runtime values');
assert(main.includes("script.dataset.pwfAnalytics = 'umami'"), 'analytics injection is de-duplicated and explicit');
assert(workspace.includes('grid-cols-1 gap-4 min-[1200px]:grid-cols-2 2xl:grid-cols-3'), 'workspace card grid defers multi-column layout until safe width');
assert(workspace.includes('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'), 'workspace actions stack before constrained horizontal layout');
assert(workspace.includes('w-full max-w-full justify-center whitespace-normal sm:w-auto'), 'workspace action button is width-contained');
assert(manifest.includes('/icon-192.png') && manifest.includes('/icon-512.png'), 'manifest retains declared PWA icon contract');
for (const [relative, expected] of [['client/public/icon-192.png', 192], ['client/public/icon-512.png', 512]]) {
  const dimensions = pngDimensions(relative);
  assert(Boolean(dimensions) && dimensions.width === expected && dimensions.height === expected, `${path.basename(relative)} is a valid ${expected}x${expected} PNG`);
}
if (process.exitCode) process.exit(process.exitCode);
console.log('MEGA_BATCH_B_GLOBAL_CONSOLE_AND_RESPONSIVE_WORKSPACE_CLOSURE_STATIC_VERIFICATION=PASS');
