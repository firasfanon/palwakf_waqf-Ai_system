import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('.manus/db/sqlite.db');

// قراءة ملف المراجع
const referencesData = JSON.parse(
  fs.readFileSync('./research_data/jerusalem_land_references.json', 'utf8')
);

console.log('🚀 بدء إضافة مراجع ملكية الأراضي في لواء القدس...\n');

const insertStmt = db.prepare(`
  INSERT INTO knowledge_documents (
    title, author, year, category, type, url, content, tags, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const checkStmt = db.prepare(`
  SELECT id FROM knowledge_documents WHERE title = ?
`);

let addedCount = 0;
let skippedCount = 0;

for (const ref of referencesData) {
  // التحقق من عدم وجود المرجع مسبقاً
  const existing = checkStmt.get(ref.title);
  
  if (existing) {
    console.log(`⏭️  تم تخطي: ${ref.title} (موجود مسبقاً)`);
    skippedCount++;
    continue;
  }

  // تحضير البيانات
  const title = ref.title;
  const author = ref.author || 'غير محدد';
  const year = ref.year || null;
  const category = ref.category || 'reference';
  const type = ref.type || 'مرجع';
  const url = ref.url || '';
  const content = ref.summary || '';
  const tags = ref.keywords ? ref.keywords.join(', ') : '';
  const now = new Date().toISOString();

  try {
    insertStmt.run(
      title,
      author,
      year,
      category,
      type,
      url,
      content,
      tags,
      now,
      now
    );
    console.log(`✅ تمت الإضافة: ${title}`);
    addedCount++;
  } catch (error) {
    console.error(`❌ خطأ في إضافة: ${title}`);
    console.error(error.message);
  }
}

db.close();

console.log('\n📊 النتائج النهائية:');
console.log(`✅ تمت إضافة: ${addedCount} مرجع`);
console.log(`⏭️  تم تخطي: ${skippedCount} مرجع`);
console.log(`📚 إجمالي المراجع المعالجة: ${referencesData.length}`);
