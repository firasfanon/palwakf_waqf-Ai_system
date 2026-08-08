import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { knowledgeDocuments } from './drizzle/schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة DATABASE_URL من متغيرات البيئة
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ لم يتم العثور على DATABASE_URL في متغيرات البيئة');
  process.exit(1);
}

async function addNewReferences() {
  console.log('🚀 بدء إضافة المراجع الجديدة...\n');

  // الاتصال بقاعدة البيانات
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // قراءة ملف JSON
  const referencesPath = path.join(__dirname, 'new_references.json');
  const referencesData = fs.readFileSync(referencesPath, 'utf-8');
  const references = JSON.parse(referencesData);

  console.log(`📚 عدد المراجع المراد إضافتها: ${references.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  // إضافة كل مرجع
  for (const ref of references) {
    try {
      // التحقق من عدم وجود المرجع مسبقاً (بناءً على العنوان)
      const existing = await db
        .select()
        .from(knowledgeDocuments)
        .where(eq(knowledgeDocuments.title, ref.title))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⚠️  المرجع موجود مسبقاً: ${ref.title}`);
        continue;
      }

      // تحويل category إلى القيم المقبولة
      const categoryMap: Record<string, 'law' | 'jurisprudence' | 'majalla' | 'historical' | 'administrative' | 'reference'> = {
        'قانوني': 'law',
        'فقهي': 'jurisprudence',
        'تاريخي': 'historical',
        'إداري': 'administrative',
      };
      const category = categoryMap[ref.category] || 'reference';

      // بناء المحتوى الكامل
      const fullContent = `${ref.description}\n\n${ref.content}`;
      
      // إضافة المرجع
      await db.insert(knowledgeDocuments).values({
        title: `${ref.title} - ${ref.author}`,
        content: fullContent,
        category: category,
        source: ref.author,
        tags: ref.keywords,
      });

      successCount++;
      console.log(`✅ تمت إضافة: ${ref.title}`);
    } catch (error: any) {
      errorCount++;
      console.error(`❌ خطأ في إضافة: ${ref.title}`);
      console.error(`   السبب: ${error.message}`);
    }
  }

  await connection.end();

  console.log('\n' + '='.repeat(60));
  console.log(`✅ المراجع المضافة بنجاح: ${successCount}`);
  console.log(`❌ المراجع التي فشلت: ${errorCount}`);
  console.log(`📊 الإجمالي: ${references.length}`);
  console.log('='.repeat(60));
}

// تشغيل السكريبت
addNewReferences().catch((error) => {
  console.error('❌ خطأ عام:', error);
  process.exit(1);
});
