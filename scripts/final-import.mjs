#!/usr/bin/env node
/**
 * سكريبت نهائي لإضافة المراجع مع تحويل الفئات إلى الإنجليزية
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// دالة لتحويل الفئة من العربية إلى الإنجليزية
function convertCategory(arabicCategory) {
  const mapping = {
    'قانوني': 'law',
    'فقهي': 'jurisprudence',
    'مجلة الأحكام العدلية': 'majalla',
    'تاريخي': 'historical',
    'إداري': 'administrative',
    'مرجع': 'reference',
    'عام': 'reference'
  };
  
  return mapping[arabicCategory] || 'reference';
}

// دالة لتنظيف النص من علامات الاقتباس
function escapeSQL(text) {
  if (!text) return '';
  return text.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// إنشاء استعلامات SQL
const sqlStatements = [];
const now = Date.now();

for (const ref of allReferences) {
  const category = convertCategory(ref.category || 'عام');
  const title = escapeSQL(ref.title);
  const content = escapeSQL(ref.content);
  const source = escapeSQL(ref.source || '');
  const tags = escapeSQL(ref.tags || '');
  
  const sql = `INSERT INTO knowledge_documents (title, content, source, category, tags, isActive, createdAt, updatedAt) VALUES ('${title}', '${content}', '${source}', '${category}', '${tags}', 1, FROM_UNIXTIME(${Math.floor(now / 1000)}), FROM_UNIXTIME(${Math.floor(now / 1000)}));`;
  sqlStatements.push(sql);
}

// حفظ SQL في ملف
const sqlFile = join(__dirname, 'final-import.sql');
const sqlContent = sqlStatements.join('\n\n');
writeFileSync(sqlFile, sqlContent, 'utf-8');

console.log(`✓ تم إنشاء ملف SQL: ${sqlFile}`);
console.log(`  عدد الاستعلامات: ${sqlStatements.length}`);
console.log(`  حجم الملف: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

console.log('='.repeat(60));
console.log('الخطوة التالية:');
console.log('='.repeat(60));
console.log('استخدم webdev_execute_sql tool لتنفيذ الاستعلامات واحداً تلو الآخر');
console.log('أو استخدم واجهة إدارة قاعدة البيانات في Management UI');
console.log('='.repeat(60));
