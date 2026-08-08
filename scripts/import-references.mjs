#!/usr/bin/env node
/**
 * سكريبت لإضافة جميع المراجع إلى قاعدة البيانات باستخدام Drizzle ORM
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// قراءة ملفات المراجع
console.log('قراءة ملفات المراجع...');
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

// الاتصال بقاعدة البيانات
const dbPath = join(projectRoot, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite');
console.log(`\nالاتصال بقاعدة البيانات: ${dbPath}`);

const client = createClient({
  url: `file:${dbPath}`
});

const db = drizzle(client, { schema });

let addedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('\nبدء الإضافة...\n');

// إضافة المراجع
for (const ref of allReferences) {
  try {
    // التحقق من عدم وجود مرجع بنفس العنوان
    const existing = await db.select()
      .from(schema.knowledgeDocuments)
      .where(eq(schema.knowledgeDocuments.title, ref.title))
      .limit(1);
    
    if (existing.length > 0) {
      skippedCount++;
      console.log(`⊘ تم تخطي (موجود مسبقاً): ${ref.title.substring(0, 50)}...`);
      continue;
    }

    // إضافة المرجع
    await db.insert(schema.knowledgeDocuments).values({
      title: ref.title,
      content: ref.content,
      source: ref.source || '',
      category: ref.category || 'عام',
      tags: ref.tags || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    addedCount++;
    console.log(`✓ تمت الإضافة (${addedCount}/${allReferences.length}): ${ref.title.substring(0, 50)}...`);
    
  } catch (error) {
    errorCount++;
    console.error(`✗ خطأ في إضافة: ${ref.title.substring(0, 50)}...`);
    console.error(`  السبب: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('اكتملت العملية!');
console.log('='.repeat(60));
console.log(`✓ تمت الإضافة: ${addedCount} مرجع`);
console.log(`⊘ تم التخطي: ${skippedCount} مرجع`);
console.log(`✗ أخطاء: ${errorCount} مرجع`);

// التحقق من العدد النهائي
const finalCount = await db.select().from(schema.knowledgeDocuments);
console.log(`\nالعدد النهائي في قاعدة البيانات: ${finalCount.length} مرجع`);
console.log('='.repeat(60));

// إغلاق الاتصال
client.close();
process.exit(0);
