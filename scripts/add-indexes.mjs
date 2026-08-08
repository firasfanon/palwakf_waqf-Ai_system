import { getDb } from '../server/db.js';

async function addIndexes() {
  console.log('🔧 Adding performance indexes...');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }
  
  try {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title ON knowledge_documents(title)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON knowledge_documents(category)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations(user_id, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category)',
      'CREATE INDEX IF NOT EXISTS idx_properties_governorate ON waqf_properties(governorate)',
      'CREATE INDEX IF NOT EXISTS idx_cases_status ON waqf_cases(status)',
    ];
    
    for (const sql of indexes) {
      try {
        await db.execute(sql);
        const indexName = sql.match(/idx_\w+/)?.[0];
        console.log('✅ Index created:', indexName);
      } catch (error) {
        console.log('⚠️  Index may already exist:', sql.match(/idx_\w+/)?.[0]);
      }
    }
    
    console.log('✅ All indexes processed successfully!');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
  
  process.exit(0);
}

addIndexes();
