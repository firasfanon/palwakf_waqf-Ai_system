/**
 * أدوات جلب المعرفة من المصادر المفتوحة
 * Knowledge Fetching Tools from Open Sources
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "./db";
import { fetchedContent, knowledgeSources, fetchLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ============ Wikipedia API ============

export interface WikipediaArticle {
  title: string;
  content: string;
  url: string;
  categories: string[];
  lastModified: string;
}

/**
 * جلب مقالات من ويكيبيديا العربية
 */
export async function fetchFromWikipedia(query: string, limit: number = 10): Promise<WikipediaArticle[]> {
  try {
    const searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${limit}`;
    
    const searchResponse = await axios.get(searchUrl);
    const searchResults = searchResponse.data.query.search;
    
    const articles: WikipediaArticle[] = [];
    
    for (const result of searchResults) {
      try {
        const contentUrl = `https://ar.wikipedia.org/w/api.php?action=query&prop=extracts|categories|info&exintro=false&explaintext=true&titles=${encodeURIComponent(result.title)}&format=json&inprop=url`;
        
        const contentResponse = await axios.get(contentUrl);
        const pages = contentResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (page.extract) {
          articles.push({
            title: page.title,
            content: page.extract,
            url: page.fullurl || `https://ar.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            categories: page.categories?.map((cat: any) => cat.title) || [],
            lastModified: page.touched || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`خطأ في جلب مقالة ${result.title}:`, error);
      }
    }
    
    return articles;
  } catch (error) {
    console.error("خطأ في جلب مقالات ويكيبيديا:", error);
    throw error;
  }
}

// ============ RSS Feed Reader ============

export interface RSSItem {
  title: string;
  content: string;
  url: string;
  author?: string;
  publishedDate: string;
  categories?: string[];
}

/**
 * قراءة RSS Feed
 */
export async function fetchFromRSS(feedUrl: string): Promise<RSSItem[]> {
  try {
    const response = await axios.get(feedUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    const items: RSSItem[] = [];
    
    $("item").each((_, element) => {
      const $item = $(element);
      
      items.push({
        title: $item.find("title").text(),
        content: $item.find("description").text() || $item.find("content\\:encoded").text(),
        url: $item.find("link").text(),
        author: $item.find("author").text() || $item.find("dc\\:creator").text(),
        publishedDate: $item.find("pubDate").text() || $item.find("dc\\:date").text(),
        categories: $item.find("category").map((_, cat) => $(cat).text()).get(),
      });
    });
    
    return items;
  } catch (error) {
    console.error("خطأ في قراءة RSS Feed:", error);
    throw error;
  }
}

// ============ Web Scraper ============

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  author?: string;
  date?: string;
  metadata?: Record<string, any>;
}

/**
 * استخراج محتوى من صفحة ويب
 */
export async function scrapeWebPage(url: string, selectors?: {
  title?: string;
  content?: string;
  author?: string;
  date?: string;
}): Promise<ScrapedContent> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const $ = cheerio.load(response.data);
    
    // استخدام selectors مخصصة أو افتراضية
    const defaultSelectors = {
      title: selectors?.title || "h1, .title, .post-title, article h1",
      content: selectors?.content || "article, .content, .post-content, .entry-content, main",
      author: selectors?.author || ".author, .byline, [rel='author']",
      date: selectors?.date || ".date, .published, time, .post-date",
    };
    
    const title = $(defaultSelectors.title).first().text().trim();
    const content = $(defaultSelectors.content).first().text().trim();
    const author = $(defaultSelectors.author).first().text().trim();
    const date = $(defaultSelectors.date).first().text().trim();
    
    return {
      title: title || "بدون عنوان",
      content: content || "",
      url,
      author: author || undefined,
      date: date || undefined,
      metadata: {
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("خطأ في استخراج محتوى الصفحة:", error);
    throw error;
  }
}

// ============ نظام جلب المحتوى الموحد ============

export interface FetchResult {
  success: boolean;
  itemsCount: number;
  itemsFetched?: number;
  itemsSaved?: number;
  errors?: string[] | null;
  error?: string;
}

/**
 * جلب محتوى من مصدر معين
 */
export async function fetchFromSource(sourceId: number): Promise<FetchResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // جلب معلومات المصدر
    const sources = await db
      .select()
      .from(knowledgeSources)
      .where(eq(knowledgeSources.id, sourceId))
      .limit(1);
    
    if (sources.length === 0) {
      throw new Error("المصدر غير موجود");
    }
    
    const source = sources[0];
    
    if (!source.isActive) {
      throw new Error("المصدر غير نشط");
    }
    
    let fetchedItems: any[] = [];
    
    // جلب المحتوى حسب نوع المصدر
    switch (source.type) {
      case "wikipedia":
        const config = source.config ? JSON.parse(source.config) : {};
        const query = config.query || "وقف إسلامي فلسطين";
        const articles = await fetchFromWikipedia(query, config.limit || 10);
        fetchedItems = articles.map(article => ({
          sourceId: source.id,
          title: article.title,
          content: article.content,
          url: article.url,
          category: null,
          tags: article.categories.join(", "),
          status: "pending",
        }));
        break;
      
      case "rss":
        const rssItems = await fetchFromRSS(source.url);
        fetchedItems = rssItems.map(item => ({
          sourceId: source.id,
          title: item.title,
          content: item.content,
          url: item.url,
          author: item.author,
          category: null,
          tags: item.categories?.join(", "),
          status: "pending",
        }));
        break;
      
      case "scraper":
        const scraperConfig = source.config ? JSON.parse(source.config) : {};
        const scrapedContent = await scrapeWebPage(source.url, scraperConfig.selectors);
        fetchedItems = [{
          sourceId: source.id,
          title: scrapedContent.title,
          content: scrapedContent.content,
          url: scrapedContent.url,
          author: scrapedContent.author,
          category: null,
          status: "pending",
        }];
        break;
      
      default:
        throw new Error(`نوع المصدر غير مدعوم: ${source.type}`);
    }
    
    // حفظ المحتوى المجلوب
    for (const item of fetchedItems) {
      await db.insert(fetchedContent).values(item);
    }
    
    // تحديث إحصائيات المصدر
    await db
      .update(knowledgeSources)
      .set({
        lastFetchAt: new Date().toISOString(),
        itemsCount: source.itemsCount + fetchedItems.length,
        successCount: source.successCount + 1,
      })
      .where(eq(knowledgeSources.id, sourceId));
    
    // تسجيل العملية
    await db.insert(fetchLogs).values({
      sourceId: source.id,
      status: "success",
      itemsFetched: fetchedItems.length,
      itemsApproved: 0,
      itemsRejected: 0,
      errors: null,
      completedAt: new Date().toISOString(),
    });
    
    return {
      success: true,
      itemsCount: fetchedItems.length,
      itemsFetched: fetchedItems.length,
      itemsSaved: fetchedItems.length,
      errors: null,
    };
  } catch (error: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // تحديث إحصائيات الفشل
    const sourceData = await db.select().from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
    if (sourceData.length > 0) {
      await db
        .update(knowledgeSources)
        .set({
          errorCount: sourceData[0].errorCount + 1,
        })
        .where(eq(knowledgeSources.id, sourceId));
    }
    
    // تسجيل الخطأ
    await db.insert(fetchLogs).values({
      sourceId,
      status: "failed",
      itemsFetched: 0,
      itemsApproved: 0,
      itemsRejected: 0,
      errors: error.message + "\n" + error.stack,
      completedAt: new Date().toISOString(),
    });
    
    return {
      success: false,
      itemsCount: 0,
      itemsFetched: 0,
      itemsSaved: 0,
      errors: [error.message],
      error: error.message,
    };
  }
}

/**
 * جلب من جميع المصادر النشطة
 */
export async function fetchFromAllActiveSources(): Promise<{ total: number; successful: number; failed: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const activeSources = await db
    .select()
    .from(knowledgeSources)
    .where(eq(knowledgeSources.isActive, 1));
  
  let successful = 0;
  let failed = 0;
  
  for (const source of activeSources) {
    const result = await fetchFromSource(source.id);
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }
  
  return {
    total: activeSources.length,
    successful,
    failed,
  };
}
