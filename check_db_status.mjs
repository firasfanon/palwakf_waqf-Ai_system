import Database from 'better-sqlite3';

const db = new Database('.manus/db/sqlite.db');

const total = db.prepare('SELECT COUNT(*) as count FROM knowledge_documents').get();
const landRefs = db.prepare("SELECT COUNT(*) as count FROM knowledge_documents WHERE tags LIKE '%ملكية الأراضي%' OR tags LIKE '%لواء القدس%' OR tags LIKE '%الطابو%'").get();

console.log('📊 حالة قاعدة البيانات:');
console.log('إجمالي المراجع:', total.count);
console.log('مراجع ملكية الأراضي:', landRefs.count);

// عرض بعض المراجع الحديثة
const recent = db.prepare('SELECT id, title, category FROM knowledge_documents ORDER BY id DESC LIMIT 5').all();
console.log('\nآخر 5 مراجع مضافة:');
recent.forEach(r => console.log(`- [${r.id}] ${r.title} (${r.category})`));

db.close();
