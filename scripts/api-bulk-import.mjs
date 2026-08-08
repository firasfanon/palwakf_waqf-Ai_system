#!/usr/bin/env node
/**
 * سكريبت لإضافة المراجع عبر bulkCreate API
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

console.log('=' * 60);
console.log('سكريبت إضافة المراجع عبر bulkCreate API');
console.log('='.repeat(60));

// دمج جميع المراجع
const allReferences = [
  ...basicReferences,
  ...additionalReferences,
  ...knowledgeBase.knowledge_documents
];

console.log(`\nإجمالي المراجع: ${allReferences.length}\n`);

// تحويل الفئات
const categoryMap = {
  'قانوني': 'law',
  'فقهي': 'jurisprudence',
  'مجلة الأحكام العدلية': 'majalla',
  'تاريخي': 'historical',
  'إداري': 'administrative',
  'مرجع': 'reference',
  'عام': 'reference'
};

// تحويل المراجع إلى الصيغة المطلوبة
const documents = allReferences.map(ref => ({
  title: ref.title,
  content: ref.content,
  category: categoryMap[ref.category || 'عام'] || 'reference',
  source: ref.source || '',
  sourceUrl: ref.sourceUrl || '',
  pdfUrl: ref.pdfUrl || '',
  tags: ref.tags || ''
}));

// إرسال الطلب
const API_URL = 'http://localhost:3000/api/trpc/knowledge.bulkCreate';

console.log('إرسال الطلب إلى API...\n');

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      0: { 
        json: { documents } 
      } 
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('✗ خطأ في الطلب:', response.status, response.statusText);
    console.error('التفاصيل:', errorText);
    process.exit(1);
  }

  const result = await response.json();
  
  console.log('='.repeat(60));
  console.log('✓ اكتملت العملية بنجاح!');
  console.log('='.repeat(60));
  console.log(`إجمالي المراجع: ${result.result.data.total}`);
  console.log(`✓ تمت الإضافة: ${result.result.data.successCount}`);
  console.log(`✗ فشلت: ${result.result.data.errorCount}`);
  
  if (result.result.data.errorCount > 0) {
    console.log('\nالأخطاء:');
    result.result.data.results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.title}: ${r.error}`);
      });
  }
  
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('\n✗ خطأ في الاتصال:', error.message);
  process.exit(1);
}
