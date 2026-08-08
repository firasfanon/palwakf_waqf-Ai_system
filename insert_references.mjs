#!/usr/bin/env node
/**
 * سكريبت لإضافة مراجع الأوقاف المشهورة إلى قاعدة المعرفة
 */

import { readFileSync } from 'fs';
import { getDb } from './server/db.ts';
import { knowledgeDocuments } from './drizzle/schema.ts';

async function insertReferences() {
  try {
    console.log('🚀 بدء إضافة المراجع إلى قاعدة المعرفة...\n');
    
    // الاتصال بقاعدة البيانات
    const db = await getDb();
    if (!db) {
      console.error('❌ فشل الاتصال بقاعدة البيانات');
      process.exit(1);
    }
    
    // قراءة ملف JSON
    const jsonData = readFileSync('/home/ubuntu/waqf_references.json', 'utf-8');
    const referencesData = JSON.parse(jsonData);
    
    console.log(`📚 عدد المراجع المراد إضافتها: ${referencesData.length}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // إضافة كل مرجع
    for (const ref of referencesData) {
      try {
        // تحويل الكلمات المفتاحية إلى JSON array
        const tagsJson = JSON.stringify(ref.keywords);
        
        // إعداد المحتوى
        const content = `
## ${ref.title}

**المؤلف:** ${ref.author || 'غير محدد'}
**السنة:** ${ref.year || 'غير محددة'}
**النوع:** ${ref.type}
**الرابط:** ${ref.url || 'غير متوفر'}

### الملخص:
${ref.summary}

### الكلمات المفتاحية:
${ref.keywords.join(', ')}
        `.trim();
        
        await db.insert(knowledgeDocuments).values({
          title: ref.title,
          content: content,
          category: 'reference',
          source: ref.author || null,
          sourceUrl: ref.url || null,
          tags: tagsJson,
          isActive: true,
        });
        
        successCount++;
        console.log(`✅ تمت إضافة: ${ref.title}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في إضافة: ${ref.title}`);
        console.error(`   السبب: ${error.message}`);
      }
    }
    
    console.log(`\n📊 النتائج النهائية:`);
    console.log(`   ✅ نجح: ${successCount} مرجع`);
    console.log(`   ❌ فشل: ${errorCount} مرجع`);
    console.log(`\n🎉 تم الانتهاء من عملية الإضافة!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  }
}

insertReferences();
