/**
 * سكريبت اختبار لجلب محتوى من ويكيبيديا العربية
 * يستخدم MediaWiki API لجلب مقالات عن الأوقاف الإسلامية
 */

// استخدام fetch المدمج في Node.js 18+

const WIKIPEDIA_API = 'https://ar.wikipedia.org/w/api.php';

// قائمة المواضيع المتعلقة بالأوقاف الإسلامية
const WAQF_TOPICS = [
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
];

/**
 * جلب محتوى مقالة من ويكيبيديا
 */
async function fetchWikipediaArticle(title) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'extracts|info|categories',
      exintro: false, // جلب المقالة كاملة
      explaintext: true, // نص بدون HTML
      inprop: 'url',
      cllimit: 50
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`);
    const data = await response.json();

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (pageId === '-1' || !page.extract) {
      return null;
    }

    // استخراج الفئات
    const categories = page.categories 
      ? page.categories.map(cat => cat.title.replace('تصنيف:', ''))
      : [];

    return {
      title: page.title,
      content: page.extract,
      url: page.fullurl || `https://ar.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      categories: categories,
      wordCount: page.extract.split(/\s+/).length
    };
  } catch (error) {
    console.error(`❌ خطأ في جلب "${title}":`, error.message);
    return null;
  }
}

/**
 * جلب محتوى من جميع المواضيع
 */
async function fetchAllTopics() {
  console.log('🚀 بدء جلب المحتوى من ويكيبيديا العربية...\n');
  console.log(`📚 عدد المواضيع: ${WAQF_TOPICS.length}\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < WAQF_TOPICS.length; i++) {
    const topic = WAQF_TOPICS[i];
    console.log(`[${i + 1}/${WAQF_TOPICS.length}] جاري جلب: ${topic}...`);

    const article = await fetchWikipediaArticle(topic);
    
    if (article) {
      results.push(article);
      successCount++;
      console.log(`  ✅ نجح - ${article.wordCount} كلمة`);
      console.log(`  📂 الفئات: ${article.categories.slice(0, 3).join(', ')}${article.categories.length > 3 ? '...' : ''}`);
    } else {
      failCount++;
      console.log(`  ❌ فشل`);
    }

    // تأخير بسيط لاحترام rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص النتائج:');
  console.log('='.repeat(60));
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${failCount}`);
  console.log(`📝 إجمالي الكلمات: ${results.reduce((sum, r) => sum + r.wordCount, 0).toLocaleString()}`);
  console.log(`📄 متوسط الكلمات/مقالة: ${Math.round(results.reduce((sum, r) => sum + r.wordCount, 0) / results.length).toLocaleString()}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

/**
 * حفظ النتائج في ملف JSON
 */
async function saveResults(results) {
  const fs = await import('fs/promises');
  const path = '/home/ubuntu/waqf_ai_model/fetched-wikipedia-data.json';
  
  await fs.writeFile(path, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`💾 تم حفظ النتائج في: ${path}\n`);
}

/**
 * عرض عينة من المحتوى
 */
function displaySample(results) {
  if (results.length === 0) return;

  console.log('📖 عينة من المحتوى المجلوب:\n');
  console.log('='.repeat(60));
  
  const sample = results[0];
  console.log(`العنوان: ${sample.title}`);
  console.log(`الرابط: ${sample.url}`);
  console.log(`عدد الكلمات: ${sample.wordCount}`);
  console.log(`الفئات: ${sample.categories.slice(0, 5).join(', ')}`);
  console.log('\nمقتطف من المحتوى:');
  console.log('-'.repeat(60));
  console.log(sample.content.substring(0, 500) + '...');
  console.log('='.repeat(60) + '\n');
}

// تشغيل السكريبت
(async () => {
  try {
    const results = await fetchAllTopics();
    
    if (results.length > 0) {
      await saveResults(results);
      displaySample(results);
      
      console.log('✅ اكتملت عملية الجلب بنجاح!');
      console.log('📌 الخطوة التالية: استخدم هذه البيانات لحفظها في قاعدة البيانات\n');
    } else {
      console.log('⚠️ لم يتم جلب أي محتوى');
    }
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  }
})();
