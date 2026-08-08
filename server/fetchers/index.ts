/**
 * Fetchers Orchestrator
 * تنسيق جميع أدوات الجلب وإدارة العملية الكاملة
 */

import {
  fetchWikipediaArticles,
  WAQF_TOPICS,
} from "./wikipedia";

import {
  fetchWafaNews,
  fetchFromMultipleSources,
  rssItemToKnowledgeDoc,
  RSS_SOURCES,
} from "./rss";

import { type FetchGovernance } from "./governance";

import {
  scrapeWaqfLibrary,
  scrapePalestinianLaw,
  scrapedToKnowledgeDoc,
} from "./scraper";

import {
  fetchMultiplePDFs,
  pdfToKnowledgeDoc,
  SUGGESTED_PDF_URLS,
} from "./pdf";

/**
 * بناء حوكمة الجلب من config (Pilot)
 * - rateLimitMs: default 1000ms (1 req/sec)
 * - respectRobots: default true
 * - allowedDomains: REQUIRED in Phase D لتفعيل scraper/pdf_url
 */
function buildGovernance(config: any): FetchGovernance {
  const g: any = {};
  g.userAgent = config?.userAgent || "PalWakfBot/1.0";
  g.respectRobots = config?.respectRobots ?? true;
  g.rateLimitMs = Number(config?.rateLimitMs ?? 1000);
  g.timeoutMs = Number(config?.timeoutMs ?? 15000);
  g.allowedDomains = Array.isArray(config?.allowedDomains) ? config.allowedDomains : [];
  // Optional maxBytes for PDF, passed via governance object
  if (config?.maxBytes) g.maxBytes = Number(config.maxBytes);
  return g as FetchGovernance;
}

function assertAllowlist(governance: FetchGovernance, sourceType: string) {
  if (!governance.allowedDomains || governance.allowedDomains.length === 0) {
    throw new Error(`allowedDomains is required for ${sourceType} (Pilot governance)`);
  }
}

export interface FetchResult {
  sourceId: number;
  sourceName: string;
  sourceType: string;
  items: Array<{
    title: string;
    content: string;
    category: string;
    source: string;
    sourceUrl: string;
    tags: string;
    metadata?: any;
  }>;
  itemsFetched: number;
  errors: string[];
  fetchedAt: Date;
}

/**
 * جلب من جميع المصادر
 */
export async function fetchFromAllSources(): Promise<FetchResult[]> {
  const results: FetchResult[] = [];

  // 1. Wikipedia
  console.log("Fetching from Wikipedia...");
  try {
    const wikiArticles: Array<{
      title: string;
      content: string;
      category: string;
      source: string;
      sourceUrl: string;
      tags: string;
      metadata: undefined;
    }> = [];
    
    for (const topic of WAQF_TOPICS.slice(0, 3)) { // أول 3 مواضيع فقط للاختبار
      const articles = await fetchWikipediaArticles(topic, 2);
      const mappedArticles = articles.map(a => ({
        title: a.title,
        content: a.content,
        category: a.category,
        source: "ويكيبيديا",
        sourceUrl: a.url,
        tags: "",
        metadata: undefined,
      }));
      wikiArticles.push(...mappedArticles);
      
      // تأخير بين المواضيع
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    results.push({
      sourceId: 0,
      sourceName: "ويكيبيديا العربية",
      sourceType: "wikipedia",
      items: wikiArticles,
      itemsFetched: wikiArticles.length,
      errors: [],
      fetchedAt: new Date(),
    });
  } catch (error: any) {
    console.error("Wikipedia fetch error:", error);
    results.push({
      sourceId: 0,
      sourceName: "ويكيبيديا العربية",
      sourceType: "wikipedia",
      items: [],
      itemsFetched: 0,
      errors: [error.message],
      fetchedAt: new Date(),
    });
  }

  // 2. RSS Feeds
  console.log("Fetching from RSS feeds...");
  try {
    const rssResults = await fetchFromMultipleSources(RSS_SOURCES.slice(0, 2));
    
    for (const result of rssResults) {
      const items = result.items.map(item => 
        rssItemToKnowledgeDoc(item, result.source)
      );

      results.push({
        sourceId: 0,
        sourceName: `RSS Feed`,
        sourceType: "rss",
        items,
        itemsFetched: items.length,
        errors: [],
        fetchedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error("RSS fetch error:", error);
    results.push({
      sourceId: 0,
      sourceName: "RSS Feeds",
      sourceType: "rss",
      items: [],
      itemsFetched: 0,
      errors: [error.message],
      fetchedAt: new Date(),
    });
  }

  // 3. Web Scraping (تعطيل مؤقتاً - يحتاج URLs حقيقية)
  // console.log("Scraping websites...");
  // try {
  //   const scrapedContent = await scrapeWaqfLibrary("الوقف الإسلامي");
  //   const items = scrapedContent.map(content => 
  //     scrapedToKnowledgeDoc(content, "المكتبة الوقفية")
  //   );
  //   results.push({
  //     sourceId: 0,
  //     sourceName: "المكتبة الوقفية",
  //     sourceType: "scraper",
  //     items,
  //     itemsFetched: items.length,
  //     errors: [],
  //     fetchedAt: new Date(),
  //   });
  // } catch (error: any) {
  //   console.error("Scraping error:", error);
  // }

  // 4. PDF Downloads (تعطيل مؤقتاً - يحتاج URLs حقيقية)
  // console.log("Downloading PDFs...");
  // try {
  //   const pdfContents = await fetchMultiplePDFs(SUGGESTED_PDF_URLS);
  //   const items = pdfContents.map(pdf => pdfToKnowledgeDoc(pdf));
  //   results.push({
  //     sourceId: 0,
  //     sourceName: "PDF Documents",
  //     sourceType: "pdf_url",
  //     items,
  //     itemsFetched: items.length,
  //     errors: [],
  //     fetchedAt: new Date(),
  //   });
  // } catch (error: any) {
  //   console.error("PDF fetch error:", error);
  // }

  return results;
}

/**
 * جلب من مصدر واحد محدد
 */
export async function fetchFromSource(
  sourceId: number,
  sourceType: string,
  sourceUrl: string,
  config?: any
): Promise<FetchResult> {
  console.log(`Fetching from source ${sourceId} (${sourceType})...`);

  try {
    let items: any[] = [];

    switch (sourceType) {
      case "wikipedia":
        const searchTerm = config?.searchTerm || "الوقف الإسلامي";
        const maxArticles = config?.maxArticles || 5;
        items = await fetchWikipediaArticles(searchTerm, maxArticles);
        break;

      case "rss":
        const rssResults = await fetchFromMultipleSources([sourceUrl]);
        items = rssResults[0]?.items.map(item => 
          rssItemToKnowledgeDoc(item, sourceUrl)
        ) || [];
        break;

      case "scraper": {
        const governance = buildGovernance(config);
        assertAllowlist(governance, "scraper");

        // خيارات Phase D (Pilot):
        // - config.urls: قائمة URLs مباشرة
        // - أو sourceUrl كـ entry URL واحد
        // - أو searchTerm مع baseUrl (تجريبي)
        const urls: string[] = Array.isArray(config?.urls) ? config.urls : [];
        const maxPages = Number(config?.maxPages ?? 5);

        if (urls.length > 0) {
          const { scrapeMultiplePages } = await import("./scraper");
          const scraped = await scrapeMultiplePages(urls.slice(0, maxPages), governance);
          items = scraped.map((c) => scrapedToKnowledgeDoc(c, "Web Scraper"));
        } else if (sourceUrl) {
          const { scrapePage } = await import("./scraper");
          const page = await scrapePage(sourceUrl, governance);
          items = page ? [scrapedToKnowledgeDoc(page, "Web Scraper")] : [];
        } else {
          const searchTerm = config?.searchTerm || "الوقف";
          const baseUrl = config?.baseUrl; // اختياري
          const scrapedContent = await scrapeWaqfLibrary(searchTerm, governance, baseUrl);
          items = scrapedContent.slice(0, maxPages).map((c) => scrapedToKnowledgeDoc(c, "Web Scraper"));
        }
        break;
      }

      case "pdf_url": {
        const governance = buildGovernance(config);
        assertAllowlist(governance, "pdf_url");

        const urls: string[] = Array.isArray(config?.urls) ? config.urls : [sourceUrl];
        const maxItems = Number(config?.maxItems ?? 3);
        const pdfContents = await fetchMultiplePDFs(urls, governance, maxItems);
        items = pdfContents.map((pdf) => pdfToKnowledgeDoc(pdf));
        break;
      }

      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }

    return {
      sourceId,
      sourceName: config?.name || "Unknown Source",
      sourceType,
      items,
      itemsFetched: items.length,
      errors: [],
      fetchedAt: new Date(),
    };
  } catch (error: any) {
    console.error(`Fetch error for source ${sourceId}:`, error);
    
    return {
      sourceId,
      sourceName: config?.name || "Unknown Source",
      sourceType,
      items: [],
      itemsFetched: 0,
      errors: [error.message],
      fetchedAt: new Date(),
    };
  }
}

/**
 * حفظ النتائج في قاعدة البيانات
 */
export async function saveFetchResults(results: FetchResult[]): Promise<number> {
  const { getDb } = await import("../db");
  const { createFetchedContent, createFetchLog } = await import("../db");
  
  let totalSaved = 0;

  for (const result of results) {
    // حفظ سجل الجلب
    const logId = await createFetchLog({
      sourceId: result.sourceId,
      status: result.errors.length > 0 ? "partial" : "success",
      itemsFetched: result.itemsFetched,
      itemsApproved: 0,
      errors: result.errors.join("; ") || null,
      startedAt: result.fetchedAt instanceof Date ? result.fetchedAt.toISOString().slice(0, 19).replace('T', ' ') : result.fetchedAt,
      completedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    // حفظ كل عنصر
    for (const item of result.items) {
      try {
        await createFetchedContent({
          sourceId: result.sourceId,
          title: item.title,
          content: item.content,
          category: mapCategoryToEnum(item.category),
          url: item.sourceUrl,
          tags: item.tags,
          relevanceScore: calculateRelevanceScore(item.content),
        });
        
        totalSaved++;
      } catch (error) {
        console.error("Error saving fetched content:", error);
      }
    }
  }

  return totalSaved;
}

/**
 * تحويل الفئة إلى enum
 */
function mapCategoryToEnum(category: string): "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference" {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes("قانون")) return "law";
  if (lowerCategory.includes("فقه")) return "jurisprudence";
  if (lowerCategory.includes("مجلة")) return "majalla";
  if (lowerCategory.includes("تاريخ")) return "historical";
  if (lowerCategory.includes("إدار")) return "administrative";
  
  return "reference";
}

/**
 * حساب درجة الصلة (relevance score)
 */
function calculateRelevanceScore(content: string): number {
  const keywords = [
    "وقف", "أوقاف", "مسجد", "مقبرة", "القدس", "الأقصى",
    "قانون", "تشريع", "حكم", "فتوى", "ناظر", "مستحق",
    "فلسطين", "عثماني", "مجلة الأحكام"
  ];

  let score = 0;
  const lowerContent = content.toLowerCase();

  for (const keyword of keywords) {
    if (lowerContent.includes(keyword)) {
      score += 5;
    }
  }

  // تطبيع الدرجة (0-100)
  return Math.min(100, score);
}
