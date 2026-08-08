#!/usr/bin/env node
/**
 * سكريبت seed لإضافة المراجع مباشرة إلى قاعدة البيانات
 * يستخدم wrangler d1 execute
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة ملفات المراجع
console.log('قراءة ملفات المراجع...');
const basicReferences = JSON.parse(readFileSync(join(__dirname, 'basic_references.json'), 'utf-8'));
const additionalReferences = JSON.parse(readFileSync(join(__dirname, 'additional_references.json'), 'utf-8'));
const knowledgeBase = JSON.parse(readFileSync(join(__dirname, '../research_data/knowledge_base.json'), 'utf-8'));

console.log('='.repeat(60));
console.log('سكريبت إضافة المراجع إلى قاعدة البيانات');
console.log('='.repeat(60));

// دمج جميع المراجع
const allReferences = [
  ...basicReferences,
  ...additionalReferences,
  ...knowledgeBase.knowledge_documents
];

console.log(`\nإجمالي المراجع المراد إضافتها: ${allReferences.length}\n`);

// دالة لتنظيف النص من علامات الاقتباس المزدوجة
function escapeSQL(text) {
  if (!text) return '';
  return text.replace(/'/g, "''");
}

// إنشاء استعلامات SQL
const sqlStatements = [];

for (const ref of allReferences) {
  const now = Date.now();
  const sql = `INSERT OR IGNORE INTO knowledge_documents (title, content, source, category, tags, createdAt, updatedAt) VALUES ('${escapeSQL(ref.title)}', '${escapeSQL(ref.content)}', '${escapeSQL(ref.source || '')}', '${escapeSQL(ref.category || 'عام')}', '${escapeSQL(ref.tags || '')}', ${now}, ${now});`;
  sqlStatements.push(sql);
}

// حفظ SQL في ملف
const sqlFile = join(__dirname, 'seed-knowledge.sql');
const sqlContent = sqlStatements.join('\n');
writeFileSync(sqlFile, sqlContent, 'utf-8');

console.log(`✓ تم إنشاء ملف SQL: ${sqlFile}`);
console.log(`  عدد الاستعلامات: ${sqlStatements.length}\n`);

// تنفيذ SQL باستخدام wrangler
console.log('تنفيذ الاستعلامات...\n');

try {
  const { stdout, stderr } = await execAsync(`cd /home/ubuntu/waqf_ai_model && pnpm wrangler d1 execute DB --local --file=scripts/seed-knowledge.sql`);
  
  if (stdout) {
    console.log(stdout);
  }
  
  if (stderr && !stderr.includes('warning')) {
    console.error('أخطاء:', stderr);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✓ اكتملت العملية بنجاح!');
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('\n✗ خطأ في تنفيذ SQL:', error.message);
  console.log('\nيمكنك تنفيذ الأمر يدوياً:');
  console.log(`cd /home/ubuntu/waqf_ai_model && pnpm wrangler d1 execute DB --local --file=scripts/seed-knowledge.sql`);
  process.exit(1);
}
