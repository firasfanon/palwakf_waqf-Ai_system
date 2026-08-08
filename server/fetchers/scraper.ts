/**
 * Web Scraper
 * جلب المحتوى من المواقع التي لا توفر API (المكتبة الوقفية، قانون فلسطين)
 */

import { governedFetch, type FetchGovernance } from "./governance";

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  metadata?: Record<string, any>;
}

/**
 * جلب وتحليل صفحة HTML
 */
export async function scrapePage(url: string, governance: FetchGovernance = {}): Promise<ScrapedContent | null> {
  try {
    const response = await governedFetch(url, {}, { ...governance, respectRobots: governance.respectRobots ?? true, rateLimitMs: governance.rateLimitMs ?? 1000 });
    const html = await response.text();
    
    // استخراج العنوان
    const title = extractTitle(html);
    
    // استخراج المحتوى الرئيسي
    const content = extractMainContent(html);
    
    if (!title || !content || content.length < 100) {
      return null;
    }

    return {
      title,
      content,
      url,
      metadata: {
        scrapedAt: new Date().toISOString(),
        contentLength: content.length,
      },
    };
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
}

/**
 * استخراج العنوان من HTML
 */
function extractTitle(html: string): string {
  // محاولة استخراج من <title>
  let match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (match) return cleanText(match[1]);
  
  // محاولة استخراج من <h1>
  match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (match) return cleanText(match[1]);
  
  return "بدون عنوان";
}

/**
 * استخراج المحتوى الرئيسي من HTML
 */
function extractMainContent(html: string): string {
  // إزالة scripts و styles
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // محاولة استخراج من <article> أو <main>
  let match = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (match) {
    content = match[1];
  } else {
    match = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (match) {
      content = match[1];
    }
  }

  // إزالة جميع HTML tags
  content = content.replace(/<[^>]*>/g, " ");
  
  // تنظيف النص
  return cleanText(content);
}

/**
 * تنظيف النص
 */
function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * جلب صفحات متعددة من موقع
 */
export async function scrapeMultiplePages(urls: string[], governance: FetchGovernance = {}): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];
  
  for (const url of urls) {
    const content = await scrapePage(url, governance);
    
    if (content) {
      results.push(content);
    }
    
    // تأخير بسيط (بالإضافة إلى rateLimit per-host داخل governedFetch)
    await new Promise(resolve => setTimeout(resolve, governance.rateLimitMs ?? 1000));
  }
  
  return results;
}

/**
 * جلب من المكتبة الوقفية (مثال)
 */
export async function scrapeWaqfLibrary(searchTerm: string, governance: FetchGovernance = {}, baseUrlOverride?: string): Promise<ScrapedContent[]> {
  // هذا مثال - يحتاج لتعديل حسب البنية الفعلية للموقع
  const baseUrl = baseUrlOverride || "https://www.awqaf.ps"; // مثال
  
  // في الواقع، نحتاج لمعرفة بنية الموقع أولاً
  // هذا كود تجريبي
  
  try {
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(searchTerm)}`;
    const response = await governedFetch(searchUrl, {}, { ...governance, respectRobots: governance.respectRobots ?? true, rateLimitMs: governance.rateLimitMs ?? 1000 });
    const html = await response.text();
    
    // استخراج روابط النتائج
    const links = extractLinks(html, baseUrl);
    
    // جلب محتوى كل صفحة
    return await scrapeMultiplePages(links.slice(0, 5), governance);
  } catch (error) {
    console.error("Waqf library scraping error:", error);
    return [];
  }
}

/**
 * استخراج الروابط من HTML
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  const matches = Array.from(html.matchAll(linkRegex));
  
  for (const match of matches) {
    let link = match[1];
    
    // تحويل الروابط النسبية إلى مطلقة
    if (link.startsWith("/")) {
      link = baseUrl + link;
    } else if (!link.startsWith("http")) {
      continue;
    }
    
    // تصفية الروابط غير المرغوبة
    if (!link.includes("#") && !link.includes("javascript:")) {
      links.push(link);
    }
  }
  
  return Array.from(new Set(links)); // إزالة المكررات
}

/**
 * جلب من موقع قانون فلسطين
 */
export async function scrapePalestinianLaw(governance: FetchGovernance = {}): Promise<ScrapedContent[]> {
  // مواقع قانونية فلسطينية
  const lawUrls: string[] = [
    // يمكن إضافة روابط محددة للقوانين المتعلقة بالأوقاف
    // مثال: "https://www.palestinianbasiclaw.org/..."
  ];
  
  return await scrapeMultiplePages(lawUrls, governance);
}

/**
 * تحديد الفئة بناءً على المحتوى
 */
export function determineCategory(content: string): string {
  const text = content.toLowerCase();

  if (text.includes("قانون") || text.includes("مادة") || text.includes("نظام")) {
    return "قانوني";
  }
  
  if (text.includes("فقه") || text.includes("شرع") || text.includes("حكم")) {
    return "فقهي";
  }
  
  if (text.includes("تاريخ") || text.includes("عثمان") || text.includes("مملوك")) {
    return "تاريخي";
  }

  return "عام";
}

/**
 * تحويل scraped content إلى knowledge document format
 */
export function scrapedToKnowledgeDoc(scraped: ScrapedContent, sourceType: string) {
  return {
    title: scraped.title,
    content: scraped.content,
    category: determineCategory(scraped.content),
    source: sourceType,
    sourceUrl: scraped.url,
    tags: extractTags(scraped.content),
    metadata: scraped.metadata,
  };
}

/**
 * استخراج tags من المحتوى
 */
function extractTags(content: string): string {
  const keywords = [
    "وقف", "أوقاف", "مسجد", "مقبرة", "القدس", "الأقصى",
    "قانون", "تشريع", "حكم", "فتوى", "ناظر", "مستحق"
  ];

  const foundTags = keywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  );

  return foundTags.join(", ");
}
