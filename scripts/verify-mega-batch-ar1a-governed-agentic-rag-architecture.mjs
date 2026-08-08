import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsRoot = path.join(root, 'docs', 'ai', 'governed_agentic_rag');
const required = [
  'AR1A_GOVERNING_ARCHITECTURE_AND_RELEASE_CONTRACT_AR.md',
  'AR1A_DECISION_MATRIX_AND_INTERNAL_UAT_SCOPE_AR.md',
  'AR1A_IMPLEMENTATION_ENTRY_GATES_AR.md',
  'STATE_MEGA_BATCH_AR1A_GOVERNED_AGENTIC_RAG_ARCHITECTURE.md',
];
const expectations = [
  ['AR1A is architecture-only', 'AR1A_ARCHITECTURE_ONLY=YES'],
  ['AR1A blocks runtime implementation authorization', 'AR1A_IMPLEMENTATION=NOT_AUTHORIZED_BY_THIS_DOCUMENT'],
  ['AR1A defines trust tiers', 'T3_REVIEWED_CITATION'],
  ['AR1A restricts substantive retrieval to T3/T4', 'T3, T4'],
  ['AR1A blocks external web agent behavior', 'NO_EXTERNAL_WEB_AGENT'],
  ['AR1A blocks autonomous legal conclusion', 'NO_AUTONOMOUS_LEGAL_CONCLUSION'],
  ['AR1A defines abstention or escalation', 'ABSTAIN_INSUFFICIENT_EVIDENCE'],
  ['AR1A requires an explicit AR1B authorization', 'AR1B_CONTROLLED_CORPUS_BINDING=AUTHORIZED'],
  ['AR1A requires an explicit AR1C authorization', 'AR1C_GOVERNED_AGENTIC_RAG_PILOT_IMPLEMENTATION=AUTHORIZED'],
  ['AR1A keeps public release out of scope', 'PUBLIC_CHAT_RELEASE=NOT_AUTHORIZED'],
];

let allText = '';
for (const name of required) {
  const target = path.join(docsRoot, name);
  if (!fs.existsSync(target)) {
    throw new Error(`FAIL :: required AR1A artifact missing :: ${path.relative(root, target)}`);
  }
  allText += `\n${fs.readFileSync(target, 'utf8')}`;
}

for (const [label, token] of expectations) {
  if (!allText.includes(token)) {
    throw new Error(`FAIL :: ${label} :: missing token ${token}`);
  }
  console.log(`PASS :: ${label}`);
}
console.log('MEGA_BATCH_AR1A_GOVERNED_AGENTIC_RAG_ARCHITECTURE_STATIC_VERIFICATION=PASS');
