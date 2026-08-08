#!/usr/bin/env node
/**
 * سكريبت لإضافة جميع المراجع عبر API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة ملفات المراجع
const basicReferences = JSON.parse(readFileSync(join(__dirname, 'basic_references.json'), 'utf-8'));
const additionalReferences = JSON.parse(readFileSync(join(__dirname, '../research_data/knowledge_base.json'), 'utf-8'));

console.log('='.repeat(60));
console.log('سكريبت إضافة المراجع عبر API');
console.log('='.repeat(60));

// دمج جميع المراجع
const allReferences = [
  ...basicReferences,
  ...additionalReferences.knowledge_documents
];

console.log(`\nإجمالي المراجع المراد إضافتها: ${allReferences.length}\n`);

let addedCount = 0;
let errorCount = 0;

// إضافة المراجع واحداً تلو الآخر
for (const ref of allReferences) {
  try {
    const response = await fetch('http://localhost:3000/api/trpc/knowledge.create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: ref.title,
        content: ref.content,
        source: ref.source || '',
        category: ref.category || 'عام',
        tags: ref.tags || ''
      })
    });

    if (response.ok) {
      addedCount++;
      console.log(`✓ تمت الإضافة (${addedCount}/${allReferences.length}): ${ref.title.substring(0, 50)}...`);
    } else {
      errorCount++;
      const error = await response.text();
      console.error(`✗ خطأ: ${ref.title.substring(0, 50)}...`);
      console.error(`  السبب: ${error}`);
    }
    
    // انتظار قصير لتجنب الضغط على الخادم
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } catch (error) {
    errorCount++;
    console.error(`✗ خطأ: ${ref.title.substring(0, 50)}...`);
    console.error(`  السبب: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('اكتملت العملية!');
console.log('='.repeat(60));
console.log(`✓ تمت الإضافة: ${addedCount} مرجع`);
console.log(`✗ أخطاء: ${errorCount} مرجع`);
console.log('='.repeat(60));
