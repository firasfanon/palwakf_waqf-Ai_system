#!/usr/bin/env node
/**
 * سكريبت لإضافة جميع المراجع من ملفات JSON إلى قاعدة البيانات
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// الاتصال بقاعدة البيانات
const dbPath = join(projectRoot, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite');
const db = new Database(dbPath);

// قراءة ملفات المراجع
const basicReferences = JSON.parse(readFileSync(join(__dirname, 'basic_references.json'), 'utf-8'));
const additionalReferences = JSON.parse(readFileSync(join(__dirname, 'additional_references.json'), 'utf-8'));
const knowledgeBase = JSON.parse(readFileSync(join(projectRoot, 'research_data/knowledge_base.json'), 'utf-8'));

console.log('='.repeat(60));
console.log('سكريبت إضافة المراجع إلى قاعدة البيانات');
console.log('='.repeat(60));

// دمج جميع المراجع
const allReferences = [
  ...basicReferences,
  ...additionalReferences,
  ...knowledgeBase.knowledge_documents
];

console.log(`\nإجمالي المراجع المراد إضافتها: ${allReferences.length}`);

// التحقق من المراجع الموجودة
const existingCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_documents').get().count;
console.log(`المراجع الموجودة حالياً: ${existingCount}`);

// إعداد استعلام الإضافة
const insertStmt = db.prepare(`
  INSERT INTO knowledge_documents (title, content, source, category, tags, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// إعداد استعلام التحقق من التكرار
const checkDuplicateStmt = db.prepare(`
  SELECT id FROM knowledge_documents WHERE title = ? LIMIT 1
`);

let addedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('\nبدء الإضافة...\n');

// بدء معاملة
const transaction = db.transaction((references) => {
  for (const ref of references) {
    try {
      // التحقق من عدم وجود مرجع بنفس العنوان
      const existing = checkDuplicateStmt.get(ref.title);
      
      if (existing) {
        skippedCount++;
        console.log(`⊘ تم تخطي (موجود مسبقاً): ${ref.title.substring(0, 50)}...`);
        continue;
      }

      // إضافة المرجع
      const now = Date.now();
      insertStmt.run(
        ref.title,
        ref.content,
        ref.source || '',
        ref.category || 'عام',
        ref.tags || '',
        now,
        now
      );
      
      addedCount++;
      console.log(`✓ تمت الإضافة: ${ref.title.substring(0, 50)}...`);
      
    } catch (error) {
      errorCount++;
      console.error(`✗ خطأ في إضافة: ${ref.title.substring(0, 50)}...`);
      console.error(`  السبب: ${error.message}`);
    }
  }
});

// تنفيذ المعاملة
try {
  transaction(allReferences);
  console.log('\n' + '='.repeat(60));
  console.log('اكتملت العملية!');
  console.log('='.repeat(60));
  console.log(`✓ تمت الإضافة: ${addedCount} مرجع`);
  console.log(`⊘ تم التخطي: ${skippedCount} مرجع`);
  console.log(`✗ أخطاء: ${errorCount} مرجع`);
  
  // التحقق من العدد النهائي
  const finalCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_documents').get().count;
  console.log(`\nالعدد النهائي في قاعدة البيانات: ${finalCount} مرجع`);
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('\n✗ خطأ في تنفيذ المعاملة:', error.message);
  process.exit(1);
}

// إغلاق الاتصال
db.close();
