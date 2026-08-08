/**
 * سكريبت لحفظ المحتوى المجلوب في قاعدة البيانات باستخدام SQL مباشر
 */

import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';

// تحميل متغيرات البيئة
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
  process.exit(1);
}

/**
 * تصنيف المحتوى تلقائياً
 */
function classifyContent(title, content, categories) {
  const text = `${title} ${content} ${categories.join(' ')}`.toLowerCase();
  
  const patterns = {
    law: ['قانون', 'قوانين', 'تشريع', 'مادة', 'نظام', 'لائحة', 'مرسوم'],
    jurisprudence: ['فقه', 'فقهي', 'مذهب', 'حكم شرعي', 'فتوى', 'إجماع', 'قياس', 'اجتهاد'],
    majalla: ['مجلة', 'أحكام عدلية', 'عثماني'],
    historical: ['تاريخ', 'تاريخي', 'عثماني', 'مملوكي', 'أيوبي', 'عصر'],
    administrative: ['إدارة', 'إداري', 'ناظر', 'وزارة', 'مجلس', 'هيئة'],
    reference: ['مرجع', 'موسوعة', 'دليل', 'معجم']
  };

  const scores = {};
  for (const [category, keywords] of Object.entries(patterns)) {
    scores[category] = keywords.filter(keyword => text.includes(keyword)).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'reference';
  
  return Object.entries(scores).find(([_, score]) => score === maxScore)[0];
}

/**
 * استخراج الكلمات المفتاحية
 */
function extractKeywords(title, content, categories) {
  const keywords = new Set();
  
  title.split(/\s+/).forEach(word => {
    if (word.length > 3) keywords.add(word);
  });
  
  categories.forEach(cat => {
    cat.split(/\s+/).forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
  });
  
  const commonWords = ['وقف', 'أوقاف', 'إسلامي', 'فلسطين', 'القدس', 'عثماني', 'قانون', 'فقه'];
  const text = content.toLowerCase();
  commonWords.forEach(word => {
    if (text.includes(word)) keywords.add(word);
  });
  
  return Array.from(keywords).slice(0, 10);
}

/**
 * حساب درجة الصلة
 */
function calculateRelevanceScore(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  
  const highRelevance = ['وقف', 'أوقاف', 'موقوف', 'واقف', 'ناظر'];
  const mediumRelevance = ['إسلام', 'شرع', 'فقه', 'قانون', 'عثماني', 'فلسطين', 'القدس'];
  
  let score = 0;
  highRelevance.forEach(word => {
    if (text.includes(word)) score += 10;
  });
  mediumRelevance.forEach(word => {
    if (text.includes(word)) score += 5;
  });
  
  return Math.min(100, score);
}

// تشغيل السكريبت
(async () => {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🚀 بدء عملية حفظ المحتوى...\n');
    
    // قراءة البيانات
    const data = await readFile('/home/ubuntu/waqf_ai_model/fetched-wikipedia-data.json', 'utf-8');
    const articles = JSON.parse(data);
    
    console.log(`📚 عدد المقالات: ${articles.length}\n`);
    
    // إنشاء أو الحصول على مصدر ويكيبيديا
    const [sources] = await connection.execute(
      'SELECT id FROM knowledge_sources WHERE name = ? LIMIT 1',
      ['ويكيبيديا العربية']
    );
    
    let sourceId;
    if (sources.length > 0) {
      sourceId = sources[0].id;
      console.log(`✅ مصدر موجود (ID: ${sourceId})\n`);
    } else {
      const [result] = await connection.execute(
        `INSERT INTO knowledge_sources (name, type, url, config, is_active, fetch_frequency, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          'ويكيبيديا العربية',
          'wikipedia',
          'https://ar.wikipedia.org',
          JSON.stringify({ api: 'https://ar.wikipedia.org/w/api.php' }),
          1,
          'weekly'
        ]
      );
      sourceId = result.insertId;
      console.log(`✅ مصدر جديد (ID: ${sourceId})\n`);
    }
    
    // حفظ المحتوى
    console.log('💾 حفظ المحتوى...\n');
    let savedCount = 0;
    
    for (const article of articles) {
      const category = classifyContent(article.title, article.content, article.categories);
      const keywords = extractKeywords(article.title, article.content, article.categories);
      const relevanceScore = calculateRelevanceScore(article.title, article.content);
      
      await connection.execute(
        `INSERT INTO fetched_content 
         (source_id, title, content, url, category, tags, relevance_score, status, fetched_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          sourceId,
          article.title,
          article.content,
          article.url,
          category,
          JSON.stringify(keywords),
          relevanceScore,
          'pending'
        ]
      );
      
      savedCount++;
      console.log(`✅ [${savedCount}] ${article.title}`);
      console.log(`   📂 ${category} | 🎯 ${relevanceScore}% | 🔑 ${keywords.slice(0, 3).join(', ')}`);
    }
    
    // تسجيل العملية
    await connection.execute(
      `INSERT INTO fetch_logs 
       (source_id, status, items_fetched, items_approved, items_rejected, started_at, completed_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [sourceId, 'success', articles.length, 0, 0]
    );
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ تم الحفظ: ${savedCount} مقالة`);
    console.log('='.repeat(60));
    console.log('\n📌 افتح /admin/fetched-content لمراجعة المحتوى\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
