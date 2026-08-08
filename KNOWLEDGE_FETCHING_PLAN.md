# 🌐 خطة أدوات جلب المعرفة من المصادر المفتوحة
## Open Source Knowledge Fetching Tools Plan

---

## 📋 نظرة عامة

تطوير نظام متكامل لجلب المعرفة تلقائياً من المصادر المفتوحة المتعلقة بالأوقاف الإسلامية في فلسطين، مع معالجة وتصنيف ذكي للمحتوى المجلوب.

---

## 🎯 الأهداف الرئيسية

1. **جلب تلقائي** للمحتوى من مصادر موثوقة
2. **معالجة ذكية** باستخدام AI لتصنيف وتلخيص المحتوى
3. **تحديث دوري** لقاعدة المعرفة
4. **واجهة إدارية** سهلة لإدارة المصادر
5. **جودة عالية** للمحتوى المضاف

---

## 📚 المصادر المفتوحة المقترحة

### 1. المكتبات الرقمية العربية
- **المكتبة الشاملة** (shamela.ws)
  - كتب فقهية وشرعية
  - أحكام الأوقاف في المذاهب الأربعة
  - API: Web Scraping (لا يوجد API رسمي)

- **المكتبة الوقفية** (waqfeya.net)
  - كتب متخصصة في الأوقاف
  - مراجع تاريخية
  - API: Web Scraping + RSS

- **مكتبة نور** (noor-book.com)
  - كتب قانونية وفقهية
  - دراسات معاصرة
  - API: Web Scraping

### 2. المواقع الحكومية والرسمية
- **وزارة الأوقاف الفلسطينية** (awqaf.ps)
  - قرارات وتعليمات وزارية
  - أخبار ومستجدات
  - API: RSS + Web Scraping

- **ديوان الفتوى والتشريع الفلسطيني**
  - قوانين وأنظمة
  - فتاوى رسمية
  - API: Web Scraping

- **المجلس الأعلى للقضاء الشرعي**
  - أحكام قضائية
  - سوابق قضائية
  - API: Web Scraping

### 3. المجلات والدوريات الأكاديمية
- **المنظومة (Mandumah)**
  - أبحاث أكاديمية محكّمة
  - دراسات قانونية وفقهية
  - API: قد يتطلب اشتراك

- **المجلة الأردنية في الدراسات الإسلامية**
  - أبحاث متخصصة
  - API: Web Scraping

### 4. قواعد البيانات القانونية
- **قانون فلسطين** (palestinelaw.org)
  - قوانين وأنظمة
  - API: Web Scraping

- **المقتفي** (muqtafi.birzeit.edu)
  - قاعدة بيانات التشريعات الفلسطينية
  - API: قد يوجد API

### 5. ويكيبيديا والموسوعات
- **ويكيبيديا العربية**
  - مقالات عن الأوقاف
  - API: MediaWiki API (رسمي ومجاني)

- **الموسوعة الفلسطينية**
  - معلومات تاريخية
  - API: Web Scraping

### 6. منصات البحث الأكاديمي
- **Google Scholar**
  - أوراق بحثية
  - API: Serpapi (مدفوع) أو Web Scraping

- **ResearchGate**
  - أبحاث الباحثين
  - API: محدود

### 7. مصادر الأخبار
- **وكالة الأنباء الفلسطينية (وفا)**
  - أخبار متعلقة بالأوقاف
  - API: RSS

---

## 🛠️ الأدوات المقترحة

### 1. أداة جلب من APIs
**الوظيفة:** جلب المحتوى من APIs الرسمية

**المصادر المدعومة:**
- MediaWiki API (ويكيبيديا)
- RSS Feeds (مواقع الأخبار)
- RESTful APIs (إن وجدت)

**التقنيات:**
- axios/fetch للطلبات
- xml2js لمعالجة RSS
- rate limiting لتجنب الحظر

**مثال:**
```typescript
// جلب من ويكيبيديا
async function fetchFromWikipedia(searchTerm: string) {
  const response = await fetch(
    `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchTerm}&format=json`
  );
  return response.json();
}
```

### 2. أداة Web Scraping
**الوظيفة:** استخراج المحتوى من المواقع التي لا تملك API

**المصادر المدعومة:**
- المكتبة الشاملة
- المكتبة الوقفية
- المواقع الحكومية

**التقنيات:**
- puppeteer/playwright للمواقع الديناميكية
- cheerio لمعالجة HTML
- robots.txt compliance

**ملاحظات قانونية:**
- احترام robots.txt
- rate limiting (طلب كل 2-3 ثواني)
- User-Agent واضح
- استخدام للأغراض التعليمية/البحثية فقط

**مثال:**
```typescript
// استخراج من المكتبة الشاملة
async function scrapeFromShamela(bookId: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://shamela.ws/book/${bookId}`);
  const content = await page.evaluate(() => {
    return document.querySelector('.book-content')?.textContent;
  });
  await browser.close();
  return content;
}
```

### 3. أداة RSS Reader
**الوظيفة:** متابعة التحديثات من مصادر RSS

**المصادر المدعومة:**
- وكالة وفا
- وزارة الأوقاف
- مواقع الأخبار

**التقنيات:**
- rss-parser
- cron jobs للتحديث الدوري

**مثال:**
```typescript
import Parser from 'rss-parser';

async function fetchRSS(feedUrl: string) {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);
  return feed.items;
}
```

### 4. أداة PDF Downloader & Extractor
**الوظيفة:** تحميل ملفات PDF واستخراج النصوص

**المصادر المدعومة:**
- المكتبة الوقفية
- مكتبة نور
- الأبحاث الأكاديمية

**التقنيات:**
- pdf-parse (Node.js)
- pdftotext + OCR (كما في نظام Bulk Upload)

### 5. أداة معالجة وتصنيف ذكية
**الوظيفة:** تصنيف وتلخيص المحتوى المجلوب تلقائياً

**المعالجات:**
- **تصنيف تلقائي:** قانوني، فقهي، تاريخي، إداري
- **استخراج الكلمات المفتاحية**
- **تلخيص ذكي** (باستخدام LLM)
- **تحديد الصلة** بالأوقاف الإسلامية

**التقنيات:**
- invokeLLM (Manus Built-in)
- NLP libraries

**مثال:**
```typescript
async function classifyContent(content: string) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "أنت مصنف محتوى متخصص في الأوقاف الإسلامية" },
      { role: "user", content: `صنف هذا المحتوى: ${content}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "classification",
        schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            relevance_score: { type: "number" }
          }
        }
      }
    }
  });
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 🗄️ البنية التحتية المقترحة

### 1. قاعدة البيانات

#### جدول: `knowledge_sources`
```sql
CREATE TABLE knowledge_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('api', 'rss', 'scraping', 'pdf') NOT NULL,
  url TEXT NOT NULL,
  config JSON, -- إعدادات خاصة بكل مصدر
  is_active BOOLEAN DEFAULT true,
  fetch_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  last_fetched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### جدول: `fetched_content`
```sql
CREATE TABLE fetched_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_id INT,
  title VARCHAR(500),
  content TEXT,
  url TEXT,
  author VARCHAR(255),
  published_date DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'processing', 'approved', 'rejected') DEFAULT 'pending',
  category VARCHAR(100),
  keywords TEXT,
  summary TEXT,
  relevance_score DECIMAL(3,2),
  FOREIGN KEY (source_id) REFERENCES knowledge_sources(id)
);
```

#### جدول: `fetch_logs`
```sql
CREATE TABLE fetch_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_id INT,
  status ENUM('success', 'failed') NOT NULL,
  items_fetched INT DEFAULT 0,
  error_message TEXT,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES knowledge_sources(id)
);
```

### 2. Backend (tRPC Procedures)

```typescript
// server/routers.ts

knowledgeFetching: router({
  // إدارة المصادر
  sources: router({
    list: adminProcedure.query(async () => {
      return await db.getAllKnowledgeSources();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(['api', 'rss', 'scraping', 'pdf']),
        url: z.string().url(),
        config: z.any().optional(),
        fetchFrequency: z.string()
      }))
      .mutation(async ({ input }) => {
        return await db.createKnowledgeSource(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        config: z.any().optional()
      }))
      .mutation(async ({ input }) => {
        return await db.updateKnowledgeSource(input);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteKnowledgeSource(input.id);
      })
  }),
  
  // جلب المحتوى
  fetch: router({
    // جلب يدوي من مصدر واحد
    manual: adminProcedure
      .input(z.object({ sourceId: z.number() }))
      .mutation(async ({ input }) => {
        const source = await db.getKnowledgeSourceById(input.sourceId);
        const fetcher = getFetcherByType(source.type);
        const items = await fetcher.fetch(source);
        return { success: true, itemsCount: items.length };
      }),
    
    // جلب تلقائي من جميع المصادر النشطة
    auto: adminProcedure
      .mutation(async () => {
        const sources = await db.getActiveKnowledgeSources();
        const results = [];
        for (const source of sources) {
          const fetcher = getFetcherByType(source.type);
          const items = await fetcher.fetch(source);
          results.push({ sourceId: source.id, itemsCount: items.length });
        }
        return results;
      })
  }),
  
  // إدارة المحتوى المجلوب
  content: router({
    list: adminProcedure
      .input(z.object({
        status: z.enum(['pending', 'processing', 'approved', 'rejected']).optional(),
        sourceId: z.number().optional(),
        page: z.number().default(1),
        limit: z.number().default(20)
      }))
      .query(async ({ input }) => {
        return await db.getFetchedContent(input);
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // نقل المحتوى إلى knowledge_documents
        const content = await db.getFetchedContentById(input.id);
        await db.createKnowledgeDocument({
          title: content.title,
          content: content.content,
          category: content.category,
          source: content.url,
          tags: content.keywords
        });
        await db.updateFetchedContentStatus(input.id, 'approved');
        return { success: true };
      }),
    
    reject: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateFetchedContentStatus(input.id, 'rejected');
        return { success: true };
      })
  }),
  
  // السجلات
  logs: adminProcedure
    .input(z.object({
      sourceId: z.number().optional(),
      limit: z.number().default(50)
    }))
    .query(async ({ input }) => {
      return await db.getFetchLogs(input);
    })
})
```

### 3. Cron Jobs للجلب التلقائي

```typescript
// server/jobs/knowledge-fetcher.ts

import cron from 'node-cron';

// كل يوم الساعة 2 صباحاً
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily knowledge fetch...');
  
  const sources = await db.getActiveKnowledgeSources();
  
  for (const source of sources) {
    if (shouldFetchNow(source)) {
      try {
        const fetcher = getFetcherByType(source.type);
        const items = await fetcher.fetch(source);
        
        // معالجة وتصنيف
        for (const item of items) {
          const classified = await classifyContent(item.content);
          await db.createFetchedContent({
            ...item,
            ...classified,
            sourceId: source.id
          });
        }
        
        await db.createFetchLog({
          sourceId: source.id,
          status: 'success',
          itemsFetched: items.length
        });
        
      } catch (error) {
        await db.createFetchLog({
          sourceId: source.id,
          status: 'failed',
          errorMessage: error.message
        });
      }
    }
  }
  
  console.log('Daily knowledge fetch completed');
});
```

---

## 🎨 الواجهات الإدارية المقترحة

### 1. صفحة إدارة المصادر (`/admin/knowledge-sources`)

**الميزات:**
- جدول بجميع المصادر
- إضافة مصدر جديد (نموذج)
- تعديل إعدادات المصدر
- تفعيل/تعطيل المصدر
- جلب يدوي فوري
- عرض آخر جلب وعدد العناصر

**التصميم:**
```
┌─────────────────────────────────────────────────┐
│  إدارة مصادر المعرفة                            │
├─────────────────────────────────────────────────┤
│  [+ إضافة مصدر جديد]  [🔄 جلب من الكل]        │
├─────────────────────────────────────────────────┤
│  المصدر  │  النوع  │  الحالة  │  آخر جلب  │ إجراءات │
│  ويكيبيديا│  API   │   ✅    │ 2 ساعات  │ [⚙️][🔄][🗑️]│
│  الشاملة  │ Scraping│   ✅    │ 1 يوم    │ [⚙️][🔄][🗑️]│
│  وفا     │  RSS    │   ❌    │ 3 أيام   │ [⚙️][🔄][🗑️]│
└─────────────────────────────────────────────────┘
```

### 2. صفحة المحتوى المجلوب (`/admin/fetched-content`)

**الميزات:**
- جدول بالمحتوى المجلوب
- فلترة حسب الحالة (pending, approved, rejected)
- فلترة حسب المصدر
- معاينة المحتوى
- موافقة/رفض جماعي
- تعديل التصنيف قبل الموافقة

**التصميم:**
```
┌─────────────────────────────────────────────────┐
│  المحتوى المجلوب                                │
├─────────────────────────────────────────────────┤
│  الحالة: [الكل▼]  المصدر: [الكل▼]  🔍 بحث...  │
├─────────────────────────────────────────────────┤
│☐ العنوان         │ المصدر  │ التصنيف │ الصلة │ إجراءات│
│☐ أحكام الوقف...  │ الشاملة │ فقهي    │ 95%  │[👁️][✅][❌]│
│☐ قانون الأوقاف.. │ قانون فلسطين│ قانوني │ 88% │[👁️][✅][❌]│
│☐ تاريخ الأوقاف.. │ ويكيبيديا│ تاريخي  │ 75%  │[👁️][✅][❌]│
├─────────────────────────────────────────────────┤
│  [✅ موافقة على المحدد]  [❌ رفض المحدد]        │
└─────────────────────────────────────────────────┘
```

### 3. صفحة السجلات (`/admin/fetch-logs`)

**الميزات:**
- سجل جميع عمليات الجلب
- عرض الأخطاء
- إحصائيات (نجاح/فشل)
- تصفية حسب المصدر والتاريخ

---

## 📊 الإحصائيات والتقارير

### Dashboard Widget: "المحتوى المجلوب"
```typescript
// عرض في AdminDashboard.tsx
<Card>
  <CardHeader>
    <CardTitle>المحتوى المجلوب اليوم</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">{todayFetchedCount}</div>
    <p className="text-sm text-muted-foreground">
      {pendingCount} في انتظار المراجعة
    </p>
  </CardContent>
</Card>
```

---

## ⚠️ اعتبارات قانونية وأخلاقية

### 1. احترام حقوق النشر
- ✅ استخدام المحتوى للأغراض التعليمية/البحثية فقط
- ✅ ذكر المصدر الأصلي دائماً
- ✅ عدم إعادة نشر المحتوى تجارياً
- ❌ تجنب المحتوى المحمي بحقوق نشر صارمة

### 2. احترام robots.txt
```typescript
// التحقق من robots.txt قبل الـ scraping
async function canScrape(url: string): Promise<boolean> {
  const robotsUrl = new URL('/robots.txt', url).href;
  const response = await fetch(robotsUrl);
  const robotsTxt = await response.text();
  // تحليل robots.txt
  return !robotsTxt.includes('Disallow: /');
}
```

### 3. Rate Limiting
```typescript
// تأخير بين الطلبات
async function fetchWithDelay(urls: string[], delayMs = 2000) {
  const results = [];
  for (const url of urls) {
    const result = await fetch(url);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return results;
}
```

### 4. User-Agent واضح
```typescript
const headers = {
  'User-Agent': 'PalWaqfAI-Bot/1.0 (Educational Research; +https://yoursite.com/bot)'
};
```

---

## 🚀 خطة التنفيذ

### المرحلة 1: البنية التحتية (أسبوع 1)
- [ ] إنشاء الجداول في قاعدة البيانات
- [ ] إنشاء دوال قاعدة البيانات في `server/db.ts`
- [ ] إنشاء tRPC procedures الأساسية
- [ ] اختبارات Vitest

### المرحلة 2: أدوات الجلب (أسبوع 2)
- [ ] أداة Wikipedia API
- [ ] أداة RSS Reader
- [ ] أداة Web Scraping (Puppeteer)
- [ ] أداة PDF Downloader

### المرحلة 3: المعالجة الذكية (أسبوع 3)
- [ ] نظام التصنيف التلقائي (LLM)
- [ ] استخراج الكلمات المفتاحية
- [ ] التلخيص الذكي
- [ ] حساب درجة الصلة

### المرحلة 4: الواجهات الإدارية (أسبوع 4)
- [ ] صفحة إدارة المصادر
- [ ] صفحة المحتوى المجلوب
- [ ] صفحة السجلات
- [ ] Dashboard Widgets

### المرحلة 5: الأتمتة والاختبار (أسبوع 5)
- [ ] Cron Jobs للجلب التلقائي
- [ ] اختبار شامل مع مصادر حقيقية
- [ ] توثيق كامل
- [ ] تدريب المسؤولين

---

## 📈 مؤشرات النجاح (KPIs)

1. **عدد المصادر النشطة**: هدف 10+ مصادر
2. **المحتوى المجلوب يومياً**: هدف 20-50 عنصر
3. **معدل الموافقة**: هدف 60%+ (دليل على جودة التصنيف)
4. **وقت المراجعة**: هدف < 24 ساعة
5. **تنوع المحتوى**: توزيع متوازن بين الفئات

---

## 🔮 التوسعات المستقبلية

### قصيرة المدى (1-3 أشهر)
- [ ] دعم المزيد من المصادر (20+ مصدر)
- [ ] نظام تنبيهات للمحتوى المهم
- [ ] API عام للمطورين

### متوسطة المدى (3-6 أشهر)
- [ ] ربط تلقائي بين المحتوى المجلوب والمراجع الموجودة
- [ ] نظام توصيات للمحتوى المشابه
- [ ] تحليلات متقدمة (Trends, Topics)

### طويلة المدى (6-12 شهر)
- [ ] نظام Machine Learning لتحسين التصنيف
- [ ] ربط مع قواعد بيانات دولية (WorldCat, JSTOR)
- [ ] نظام Blockchain لتوثيق المصادر

---

## 💡 نصائح للنجاح

1. **ابدأ صغيراً**: ابدأ بـ 2-3 مصادر سهلة (Wikipedia, RSS)
2. **اختبر كثيراً**: تأكد من جودة المحتوى المجلوب
3. **راقب الأداء**: تتبع الأخطاء ووقت الاستجابة
4. **احترم المصادر**: لا تحمّل المواقع بطلبات كثيرة
5. **وثّق كل شيء**: سجّل جميع الإعدادات والتغييرات

---

**تاريخ الإنشاء:** 8 يناير 2026  
**الإصدار:** 1.0.0  
**الحالة:** مقترح - في انتظار الموافقة
