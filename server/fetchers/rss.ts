/**
 * RSS Feed Reader
 * قارئ RSS لجلب الأخبار من وكالة وفا ووزارة الأوقاف
 */

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  content?: string;
}

/**
 * قراءة RSS feed
 */
export async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    
    // Parse XML manually (simple parser)
    const items = parseRSSItems(xmlText);
    
    return items;
  } catch (error) {
    console.error("RSS fetch error:", error);
    return [];
  }
}

/**
 * Parser بسيط لـ RSS XML
 */
function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // استخراج كل <item>...</item>
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const matches = Array.from(xml.matchAll(itemRegex));
  
  for (const match of matches) {
    const itemXml = match[1];
    
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate");
    const content = extractTag(itemXml, "content:encoded") || extractTag(itemXml, "content");
    
    if (title && link) {
      items.push({
        title: cleanText(title),
        link: cleanText(link),
        description: cleanText(description),
        pubDate: cleanText(pubDate),
        content: content ? cleanText(content) : undefined,
      });
    }
  }
  
  return items;
}

/**
 * استخراج محتوى tag من XML
 */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

/**
 * تنظيف النص من HTML و CDATA
 */
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") // إزالة CDATA
    .replace(/<[^>]*>/g, "") // إزالة HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * تصفية العناصر المتعلقة بالأوقاف
 */
export function filterWaqfRelatedItems(items: RSSItem[]): RSSItem[] {
  const keywords = [
    "وقف",
    "أوقاف",
    "مسجد",
    "مقبرة",
    "زاوية",
    "رباط",
    "خانقاه",
    "وزارة الأوقاف",
    "الشؤون الدينية",
    "الأقصى",
    "القدس",
    "الحرم",
  ];

  return items.filter(item => {
    const text = `${item.title} ${item.description}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword));
  });
}

/**
 * جلب من وكالة وفا
 */
export async function fetchWafaNews(): Promise<RSSItem[]> {
  // وكالة وفا لا توفر RSS رسمي، سنستخدم scraping بدلاً من ذلك
  // أو يمكن استخدام Google News RSS
  const googleNewsUrl = "https://news.google.com/rss/search?q=الأوقاف+فلسطين&hl=ar&gl=PS&ceid=PS:ar";
  
  try {
    const items = await fetchRSSFeed(googleNewsUrl);
    return filterWaqfRelatedItems(items);
  } catch (error) {
    console.error("Wafa news fetch error:", error);
    return [];
  }
}

/**
 * جلب من مصادر RSS متعددة
 */
export async function fetchFromMultipleSources(sources: string[]): Promise<{
  source: string;
  items: RSSItem[];
}[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      const items = await fetchRSSFeed(source);
      return { source, items };
    })
  );

  return results;
}

/**
 * تحويل RSS item إلى knowledge document format
 */
export function rssItemToKnowledgeDoc(item: RSSItem, sourceUrl: string) {
  return {
    title: item.title,
    content: item.content || item.description,
    category: "إخباري",
    source: sourceUrl,
    sourceUrl: item.link,
    tags: extractTags(item.title + " " + item.description),
    metadata: {
      pubDate: item.pubDate,
      originalLink: item.link,
    },
  };
}

/**
 * استخراج tags من النص
 */
function extractTags(text: string): string {
  const keywords = [
    "وقف", "أوقاف", "مسجد", "مقبرة", "القدس", "الأقصى",
    "وزارة", "قانون", "تشريع", "حكم", "فتوى"
  ];

  const foundTags = keywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );

  return foundTags.join(", ");
}

/**
 * مصادر RSS المقترحة
 */
export const RSS_SOURCES = [
  "https://news.google.com/rss/search?q=الأوقاف+فلسطين&hl=ar&gl=PS&ceid=PS:ar",
  "https://news.google.com/rss/search?q=المسجد+الأقصى&hl=ar&gl=PS&ceid=PS:ar",
  "https://news.google.com/rss/search?q=وزارة+الأوقاف+فلسطين&hl=ar&gl=PS&ceid=PS:ar",
];
