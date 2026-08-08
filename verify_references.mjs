import { getDb } from './server/db.ts';
import { knowledgeDocuments } from './drizzle/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function verifyReferences() {
  const db = await getDb();
  if (!db) {
    console.error('❌ فشل الاتصال بقاعدة البيانات');
    process.exit(1);
  }
  
  // عد المراجع المضافة
  const result = await db.select({ count: sql`count(*)` })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.category, 'reference'));
  
  const count = Number(result[0]?.count || 0);
  console.log(`\n📊 إجمالي المراجع في قاعدة البيانات: ${count}\n`);
  
  // عرض عينة من المراجع
  const sample = await db.select({
    id: knowledgeDocuments.id,
    title: knowledgeDocuments.title,
    source: knowledgeDocuments.source,
  })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.category, 'reference'))
    .limit(10);
  
  console.log('📚 عينة من المراجع المضافة:\n');
  sample.forEach((ref, idx) => {
    console.log(`${idx + 1}. ${ref.title}`);
    console.log(`   المؤلف: ${ref.source || 'غير محدد'}`);
    console.log('');
  });
  
  process.exit(0);
}

verifyReferences();
