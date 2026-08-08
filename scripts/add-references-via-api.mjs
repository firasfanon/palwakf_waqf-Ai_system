#!/usr/bin/env node
/**
 * سكريبت لإضافة جميع المراجع عبر tRPC API
 */

import { readFileSync } from 'fs';
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
console.log('سكريبت إضافة المراجع عبر API');
console.log('='.repeat(60));

// دمج جميع المراجع
const allReferences = [
  ...basicReferences,
  ...additionalReferences,
  ...knowledgeBase.knowledge_documents
];

console.log(`\nإجمالي المراجع المراد إضافتها: ${allReferences.length}\n`);

const API_URL = 'http://localhost:3000/api/trpc';

let addedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// إضافة المراجع واحداً تلو الآخر
for (let i = 0; i < allReferences.length; i++) {
  const ref = allReferences[i];
  
  try {
    // استخدام tRPC batch endpoint
    const response = await fetch(`${API_URL}/knowledge.create`, {
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
      console.log(`✓ (${i + 1}/${allReferences.length}) تمت الإضافة: ${ref.title.substring(0, 50)}...`);
    } else {
      const errorText = await response.text();
      
      // التحقق من خطأ التكرار
      if (errorText.includes('UNIQUE') || errorText.includes('duplicate')) {
        skippedCount++;
        console.log(`⊘ (${i + 1}/${allReferences.length}) تم تخطي (موجود مسبقاً): ${ref.title.substring(0, 50)}...`);
      } else {
        errorCount++;
        console.error(`✗ (${i + 1}/${allReferences.length}) خطأ: ${ref.title.substring(0, 50)}...`);
        console.error(`  السبب: ${errorText.substring(0, 100)}`);
      }
    }
    
    // انتظار قصير لتجنب الضغط على الخادم
    await new Promise(resolve => setTimeout(resolve, 50));
    
  } catch (error) {
    errorCount++;
    console.error(`✗ (${i + 1}/${allReferences.length}) خطأ: ${ref.title.substring(0, 50)}...`);
    console.error(`  السبب: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('اكتملت العملية!');
console.log('='.repeat(60));
console.log(`✓ تمت الإضافة: ${addedCount} مرجع`);
console.log(`⊘ تم التخطي: ${skippedCount} مرجع`);
console.log(`✗ أخطاء: ${errorCount} مرجع`);
console.log('='.repeat(60));

process.exit(0);
