#!/usr/bin/env node
/**
 * سكريبت لإضافة المراجع المتخصصة إلى قاعدة البيانات
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { knowledgeDocuments } from './drizzle/schema.js';
import fs from 'fs/promises';

// قراءة متغيرات البيئة
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ خطأ: DATABASE_URL غير موجود في متغيرات البيئة');
  process.exit(1);
}

async function main() {
  console.log('🔄 جاري الاتصال بقاعدة البيانات...\n');

  // إنشاء اتصال بقاعدة البيانات
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // قراءة ملف JSON
  console.log('📖 جاري قراءة ملف المراجع...\n');
  const jsonData = await fs.readFile('/home/ubuntu/waqf_references.json', 'utf-8');
  const data = JSON.parse(jsonData);
  const references = data.references;

  console.log(`📚 تم العثور على ${references.length} مرجعاً\n`);
  console.log('➕ جاري إضافة المراجع إلى قاعدة البيانات...\n');

  let addedCount = 0;
  let errorCount = 0;

  for (const ref of references) {
    try {
      // تحديد الفئة المناسبة
      let category = 'reference'; // افتراضي
      
      if (ref.type === 'وثيقة تاريخية' || ref.category === 'الجغرافيا التاريخية') {
        category = 'historical';
      } else if (ref.type === 'قانون تاريخي' || ref.category === 'القوانين العثمانية') {
        category = 'law';
      }

      // إعداد المحتوى
      const content = `
## ${ref.title}

${ref.title_en ? `**English Title:** ${ref.title_en}\n` : ''}

**المؤلف:** ${ref.author}
${ref.author_en ? `**Author:** ${ref.author_en}\n` : ''}

${ref.year ? `**سنة النشر:** ${ref.year}\n` : ''}

**النوع:** ${ref.type}

**الفئة:** ${ref.category}

${ref.pages ? `**عدد الصفحات:** ${ref.pages}\n` : ''}

${ref.supervisor ? `**المشرف:** ${ref.supervisor}\n` : ''}

${ref.citations !== undefined ? `**عدد الاستشهادات:** ${ref.citations}\n` : ''}

**الوصف:**
${ref.description}

**المصدر:** ${ref.source}

${ref.reference ? `**المرجع:** ${ref.reference}\n` : ''}

**اللغة:** ${ref.language}

**التوفر:** ${ref.availability}
      `.trim();

      // إعداد العلامات (tags)
      const tags = JSON.stringify([
        ref.category,
        ref.type,
        ref.language,
        ...(ref.year ? [`سنة ${ref.year}`] : [])
      ]);

      // إضافة المرجع إلى قاعدة البيانات
      await db.insert(knowledgeDocuments).values({
        title: ref.title,
        content: content,
        category: category,
        source: ref.source,
        sourceUrl: ref.reference,
        tags: tags,
        isActive: true,
        createdBy: null, // سيتم تعيينه لاحقاً إذا لزم الأمر
      });

      addedCount++;
      console.log(`✓ تمت إضافة: ${ref.title.substring(0, 80)}...`);

    } catch (error) {
      errorCount++;
      console.error(`✗ خطأ في إضافة: ${ref.title.substring(0, 80)}...`);
      console.error(`  السبب: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ تمت إضافة ${addedCount} مرجعاً بنجاح`);
  if (errorCount > 0) {
    console.log(`⚠️  فشلت إضافة ${errorCount} مرجعاً`);
  }
  console.log('='.repeat(60) + '\n');

  // إغلاق الاتصال
  await connection.end();
  console.log('✓ تم إغلاق الاتصال بقاعدة البيانات');
}

main().catch((error) => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});
