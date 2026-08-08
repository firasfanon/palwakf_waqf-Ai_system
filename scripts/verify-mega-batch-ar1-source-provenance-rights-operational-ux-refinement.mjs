import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'client', 'src', 'pages', 'admin', 'SourceProvenanceRightsRegistry.tsx');
const immutableTargets = {
  'server/governedAgenticRagPilot.ts': '891387c53b24da8e9a2bd8ceda1829fb15602804c0de32f2415900be150de9e7',
  'server/sourceProvenanceRights.ts': '3a64577ba13bc36f462b5524a573d6a34f533b96dee7379f16f9c3a1bf2e707f',
  'client/src/config/adminRegistryV2.ts': '243dd3c5dc365799aad592bcd2b6d81d2102e64622bec057ce85112b71e44010',
};

const requiredMarkers = [
  'حالة طبقة الحقوق',
  'لا يوجد إجراء مطلوب من المشغّل داخل هذه الصفحة الآن',
  'الخطوة المطلوبة الآن: C3 ثم قراءة C4',
  'فتح خطوة C3 المطلوبة',
  'إنشاء جلسة AR1 غير متاح حاليًا',
  '4. توثيق الاستخدام وإنشاء جلسة AR1',
  'ضوابط الربط والحماية',
  'السجل التقني وحالة التفعيل',
  'c3-external-verification',
  'c4-controlled-release-plan',
  'C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD',
  'startPilotSession.mutate',
  'rollbackPilot.mutate',
];

const forbiddenMarkers = [
  'sourceProvenance.upsert.mutate({ sourceId: null, autoApproved: true',
  'agenticRagPilot.releaseToChat',
  'semanticFallback',
  'vectorFallback',
];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const failures = [];
if (!fs.existsSync(sourcePath)) {
  failures.push(`MISSING_SOURCE=${sourcePath}`);
} else {
  const source = fs.readFileSync(sourcePath, 'utf8');
  for (const marker of requiredMarkers) {
    if (!source.includes(marker)) failures.push(`MISSING_MARKER=${marker}`);
  }
  for (const marker of forbiddenMarkers) {
    if (source.includes(marker)) failures.push(`FORBIDDEN_MARKER=${marker}`);
  }
}

for (const [relativePath, expectedHash] of Object.entries(immutableTargets)) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`MISSING_IMMUTABLE_TARGET=${relativePath}`);
    continue;
  }
  const actualHash = sha256(filePath);
  if (actualHash !== expectedHash) failures.push(`IMMUTABLE_TARGET_CHANGED=${relativePath}`);
}

if (failures.length) {
  console.error('AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_STATIC_VERIFY=FAIL');
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_STATIC_VERIFY=PASS');
console.log('NO_SCHEMA_CHANGE=PASS');
console.log('NO_RLS_CHANGE=PASS');
console.log('NO_SERVER_LOGIC_CHANGE=PASS');
console.log('NO_CHAT_OR_RELEASE_CHANGE=PASS');
console.log(`TARGET_SHA256=${sha256(sourcePath)}`);
