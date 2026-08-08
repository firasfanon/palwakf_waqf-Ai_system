/**
 * سكريبت لحفظ المحتوى المجلوب من ويكيبيديا في قاعدة البيانات
 * يحفظ في جدول fetched_content مع التصنيف التلقائي
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';

// تحميل متغيرات البيئة
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
  process.exit(1);
}

// الاتصال بقاعدة البيانات
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

/**
 * تصنيف المحتوى تلقائياً بناءً على الكلمات المفتاحية
 */
function classifyContent(title, content, categories) {
  const text = `${title} ${content} ${categories.join(' ')}`.toLowerCase();
  
  // كلمات مفتاحية للتصنيف
  const patterns = {
    law: ['قانون', 'قوانين', 'تشريع', 'مادة', 'نظام', 'لائحة', 'مرسوم'],
    jurisprudence: ['فقه', 'فقهي', 'مذهب', 'حكم شرعي', 'فتوى', 'إجماع', 'قياس', 'اجتهاد'],
    majalla: ['مجلة', 'أحكام عدلية', 'عثماني'],
    historical: ['تاريخ', 'تاريخي', 'عثماني', 'مملوكي', 'أيوبي', 'عصر'],
    administrative: ['إدارة', 'إداري', 'ناظر', 'وزارة', 'مجلس', 'هيئة'],
    reference: ['مرجع', 'موسوعة', 'دليل', 'معجم']
  };

  // حساب النقاط لكل فئة
  const scores = {};
  for (const [category, keywords] of Object.entries(patterns)) {
    scores[category] = keywords.filter(keyword => text.includes(keyword)).length;
  }

  // اختيار الفئة ذات أعلى نقاط
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'reference'; // افتراضي
  
  const bestCategory = Object.entries(scores).find(([_, score]) => score === maxScore)[0];
  return bestCategory;
}

/**
 * استخراج الكلمات المفتاحية من المحتوى
 */
function extractKeywords(title, content, categories) {
  const keywords = new Set();
  
  // إضافة كلمات من العنوان
  title.split(/\s+/).forEach(word => {
    if (word.length > 3) keywords.add(word);
  });
  
  // إضافة كلمات من الفئات
  categories.forEach(cat => {
    cat.split(/\s+/).forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
  });
  
  // كلمات مفتاحية شائعة في المحتوى
  const commonWords = ['وقف', 'أوقاف', 'إسلامي', 'فلسطين', 'القدس', 'عثماني', 'قانون', 'فقه'];
  const text = content.toLowerCase();
  commonWords.forEach(word => {
    if (text.includes(word)) keywords.add(word);
  });
  
  return Array.from(keywords).slice(0, 10); // أول 10 كلمات
}

/**
 * حساب درجة الصلة بالأوقاف الإسلامية
 */
function calculateRelevanceScore(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  
  // كلمات عالية الصلة
  const highRelevance = ['وقف', 'أوقاف', 'موقوف', 'واقف', 'ناظر'];
  const mediumRelevance = ['إسلام', 'شرع', 'فقه', 'قانون', 'عثماني', 'فلسطين', 'القدس'];
  
  let score = 0;
  highRelevance.forEach(word => {
    if (text.includes(word)) score += 10;
  });
  mediumRelevance.forEach(word => {
    if (text.includes(word)) score += 5;
  });
  
  // تطبيع النتيجة (0-100)
  return Math.min(100, score);
}

/**
 * حفظ المحتوى في قاعدة البيانات
 */
async function saveFetchedContent(articles, sourceId) {
  console.log('\n💾 بدء حفظ المحتوى في قاعدة البيانات...\n');
  
  let savedCount = 0;
  let skippedCount = 0;
  
  for (const article of articles) {
    try {
      // التصنيف التلقائي
      const category = classifyContent(article.title, article.content, article.categories);
      const keywords = extractKeywords(article.title, article.content, article.categories);
      const relevanceScore = calculateRelevanceScore(article.title, article.content);
      
      // حفظ في قاعدة البيانات
      await db.insert(schema.fetchedContent).values({
        sourceId: sourceId,
        title: article.title,
        content: article.content,
        url: article.url,
        category: category,
        keywords: JSON.stringify(keywords),
        relevanceScore: relevanceScore,
        status: 'pending',
        fetchedAt: new Date()
      });
      
      savedCount++;
      console.log(`✅ [${savedCount}] ${article.title}`);
      console.log(`   📂 الفئة: ${category} | 🎯 الصلة: ${relevanceScore}% | 🔑 الكلمات: ${keywords.slice(0, 3).join(', ')}`);
    } catch (error) {
      skippedCount++;
      console.log(`⚠️ تخطي "${article.title}": ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ تم الحفظ: ${savedCount}`);
  console.log(`⚠️ تم التخطي: ${skippedCount}`);
  console.log('='.repeat(60) + '\n');
  
  return { savedCount, skippedCount };
}

/**
 * إنشاء أو الحصول على مصدر ويكيبيديا
 */
async function getOrCreateWikipediaSource() {
  // البحث عن مصدر ويكيبيديا
  const existing = await db.query.knowledgeSources.findFirst({
    where: (sources, { eq }) => eq(sources.name, 'ويكيبيديا العربية')
  });
  
  if (existing) {
    console.log('✅ تم العثور على مصدر ويكيبيديا الموجود (ID: ' + existing.id + ')\n');
    return existing.id;
  }
  
  // إنشاء مصدر جديد
  const result = await db.insert(schema.knowledgeSources).values({
    name: 'ويكيبيديا العربية',
    type: 'wikipedia',
    url: 'https://ar.wikipedia.org',
    config: JSON.stringify({
      api: 'https://ar.wikipedia.org/w/api.php',
      topics: [
        'وقف (إسلام)',
        'أوقاف القدس',
        'وزارة الأوقاف الفلسطينية',
        'المجلس الإسلامي الأعلى (فلسطين)',
        'الأوقاف في الدولة العثمانية',
        'مجلة الأحكام العدلية',
        'وقف ذري',
        'وقف خيري',
        'ناظر الوقف',
        'الأوقاف في الإسلام'
      ]
    }),
    isActive: true,
    fetchInterval: 7 // أسبوعياً
  });
  
  console.log('✅ تم إنشاء مصدر ويكيبيديا جديد (ID: ' + result.insertId + ')\n');
  return result.insertId;
}

/**
 * تسجيل عملية الجلب في السجلات
 */
async function logFetchOperation(sourceId, status, itemsFetched, itemsSaved, errors = null) {
  await db.insert(schema.fetchLogs).values({
    sourceId: sourceId,
    status: status,
    itemsFetched: itemsFetched,
    itemsApproved: 0,
    itemsRejected: 0,
    errors: errors ? JSON.stringify(errors) : null,
    startedAt: new Date(),
    completedAt: new Date()
  });
}

// تشغيل السكريبت
(async () => {
  try {
    console.log('🚀 بدء عملية حفظ المحتوى المجلوب...\n');
    
    // قراءة البيانات المجلوبة
    const data = await readFile('/home/ubuntu/waqf_ai_model/fetched-wikipedia-data.json', 'utf-8');
    const articles = JSON.parse(data);
    
    console.log(`📚 عدد المقالات المجلوبة: ${articles.length}\n`);
    
    // الحصول على أو إنشاء مصدر ويكيبيديا
    const sourceId = await getOrCreateWikipediaSource();
    
    // حفظ المحتوى
    const { savedCount, skippedCount } = await saveFetchedContent(articles, sourceId);
    
    // تسجيل العملية
    await logFetchOperation(
      sourceId,
      savedCount > 0 ? 'success' : 'failed',
      articles.length,
      savedCount,
      skippedCount > 0 ? [`تم تخطي ${skippedCount} مقالة`] : null
    );
    
    console.log('✅ اكتملت العملية بنجاح!');
    console.log('📌 الخطوة التالية: افتح صفحة /admin/fetched-content لمراجعة المحتوى\n');
    
    await connection.end();
  } catch (error) {
    console.error('❌ خطأ:', error);
    await connection.end();
    process.exit(1);
  }
})();
