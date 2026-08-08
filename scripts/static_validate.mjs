import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'files');
const checks = [
  ['client/src/pages/admin/ToolOutputIntake.tsx', /type ToolRunSummary[\s\S]*const all: ToolRunSummary\[\]/, 'ToolOutputIntake typed list'],
  ['server/knowledgeOperations.ts', /type RuntimeReadRow = Record<string, any>;[\s\S]*async function readOne[\s\S]*Promise<RuntimeReadRow \| null>/, 'readOne typed runtime row'],
  ['server/rag.ts', /authorityLevel: doc\.trust\?\.authorityLevel \?\? assessKnowledgeTrust\(doc\)\.authorityLevel \?\? null/, 'trust fallback'],
];
let failed = false;
for (const [relative, pattern, name] of checks) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  if (!pattern.test(source)) { console.error(`FAIL :: ${name}`); failed = true; }
  else console.log(`PASS :: ${name}`);
}
if (failed) process.exit(1);
console.log('STATIC_SOURCE_GUARDS=PASS');
