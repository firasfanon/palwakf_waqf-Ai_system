#!/usr/bin/env node
/**
 * سكريبت للتحقق من إضافة مراجع ملكية الأراضي في لواء القدس
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { knowledgeDocuments } from './drizzle/schema.ts';
import { eq, like, or } from 'drizzle-orm';

async function main() {
  console.log('🔍 بدء التحقق من إضافة المراجع...\n');

  try {
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    // البحث عن المراجع المضافة
    const keywords = [
      'متصرفية القدس',
      'ملكية الأراضي',
      'قانون الأراضي العثماني',
      'الطابو',
      'Ottoman land',
      'Jerusalem'
    ];

    console.log('📚 البحث عن المراجع في قاعدة المعرفة...\n');

    // عد المراجع حسب الكلمات المفتاحية
    let totalFound = 0;
    const foundDocs = [];

    for (const keyword of keywords) {
      const docs = await db
        .select()
        .from(knowledgeDocuments)
        .where(
          or(
            like(knowledgeDocuments.title, `%${keyword}%`),
            like(knowledgeDocuments.content, `%${keyword}%`),
            like(knowledgeDocuments.tags, `%${keyword}%`)
          )
        );

      if (docs.length > 0) {
        console.log(`✅ "${keyword}": وجد ${docs.length} مرجع`);
        
        // إضافة الوثائق الجديدة فقط
        for (const doc of docs) {
          if (!foundDocs.find(d => d.id === doc.id)) {
            foundDocs.push(doc);
          }
        }
      }
    }

    totalFound = foundDocs.length;

    console.log(`\n📊 إجمالي المراجع المتعلقة بملكية الأراضي: ${totalFound} مرجع\n`);

    // عرض عينة من المراجع المضافة
    if (totalFound > 0) {
      console.log('📖 عينة من المراجع المضافة:\n');
      
      const sample = foundDocs.slice(0, 5);
      for (const doc of sample) {
        console.log(`   📌 ${doc.title}`);
        console.log(`      المؤلف: ${doc.author || 'غير محدد'}`);
        console.log(`      السنة: ${doc.year || 'غير محددة'}`);
        console.log(`      المصدر: ${doc.source?.substring(0, 60)}...`);
        console.log('');
      }

      if (totalFound > 5) {
        console.log(`   ... و ${totalFound - 5} مرجع آخر\n`);
      }
    }

    // إحصائيات إضافية
    const allReferences = await db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.category, 'reference'));

    console.log(`📊 إحصائيات قاعدة المعرفة:`);
    console.log(`   📚 إجمالي المراجع: ${allReferences.length}`);
    console.log(`   🎯 المراجع المتعلقة بملكية الأراضي: ${totalFound}`);
    console.log(`   📈 النسبة: ${((totalFound / allReferences.length) * 100).toFixed(1)}%\n`);

    await connection.end();
    console.log('✅ تم التحقق بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

main();
