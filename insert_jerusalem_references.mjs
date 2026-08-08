#!/usr/bin/env node
/**
 * سكريبت لإضافة مراجع ملكية الأراضي في لواء القدس إلى قاعدة المعرفة
 */

import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { knowledgeDocuments } from './drizzle/schema.ts';

async function main() {
  console.log('🚀 بدء إضافة المراجع إلى قاعدة المعرفة...\n');

  try {
    // قراءة بيانات المراجع من ملف JSON
    const referencesData = JSON.parse(
      readFileSync('/home/ubuntu/jerusalem_land_references.json', 'utf-8')
    );

    console.log(`📚 تم تحميل ${referencesData.length} مرجع من الملف\n`);

    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    // إضافة المراجع إلى قاعدة البيانات
    let successCount = 0;
    let errorCount = 0;

    for (const ref of referencesData) {
      try {
        // إعداد البيانات للإدخال
        const docData = {
          title: ref.title,
          content: ref.summary,
          category: 'reference', // كل المراجع تصنف كـ reference
          source: ref.url || 'غير محدد',
          tags: JSON.stringify(ref.keywords || []),
          author: ref.author || null,
          year: ref.year ? String(ref.year) : null,
          language: ref.title.match(/[a-zA-Z]/) ? 'en' : 'ar', // تحديد اللغة بناءً على العنوان
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // إدخال البيانات
        await db.insert(knowledgeDocuments).values(docData);
        
        console.log(`✅ تمت إضافة: ${ref.title}`);
        successCount++;
      } catch (error) {
        console.error(`❌ خطأ في إضافة: ${ref.title}`);
        console.error(`   السبب: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 النتائج النهائية:`);
    console.log(`   ✅ نجح: ${successCount} مرجع`);
    console.log(`   ❌ فشل: ${errorCount} مرجع`);
    console.log(`   📚 الإجمالي: ${referencesData.length} مرجع`);

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  }
}

main();
