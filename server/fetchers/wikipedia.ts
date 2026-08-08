/**
 * Wikipedia API Fetcher
 * جلب المقالات من ويكيبيديا العربية المتعلقة بالأوقاف الإسلامية
 */

interface WikipediaSearchResult {
  title: string;
  pageid: number;
  snippet: string;
}

interface WikipediaPage {
  title: string;
  extract: string;
  url: string;
}

/**
 * البحث في ويكيبيديا العربية
 */
export async function searchWikipedia(query: string, limit: number = 10): Promise<WikipediaSearchResult[]> {
  const apiUrl = "https://ar.wikipedia.org/w/api.php";
  
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: limit.toString(),
    format: "json",
    origin: "*",
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);
    const data = await response.json();
    
    if (!data.query || !data.query.search) {
      return [];
    }

    return data.query.search.map((result: any) => ({
      title: result.title,
      pageid: result.pageid,
      snippet: result.snippet.replace(/<[^>]*>/g, ""), // إزالة HTML tags
    }));
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return [];
  }
}

/**
 * جلب محتوى صفحة ويكيبيديا كاملة
 */
export async function fetchWikipediaPage(pageId: number): Promise<WikipediaPage | null> {
  const apiUrl = "https://ar.wikipedia.org/w/api.php";
  
  const params = new URLSearchParams({
    action: "query",
    pageids: pageId.toString(),
    prop: "extracts|info",
    exintro: "false", // جلب المقال كاملاً
    explaintext: "true", // نص عادي بدون HTML
    inprop: "url",
    format: "json",
    origin: "*",
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);
    const data = await response.json();
    
    if (!data.query || !data.query.pages) {
      return null;
    }

    const page = data.query.pages[pageId];
    
    if (!page || page.missing) {
      return null;
    }

    return {
      title: page.title,
      extract: page.extract || "",
      url: page.fullurl || `https://ar.wikipedia.org/?curid=${pageId}`,
    };
  } catch (error) {
    console.error("Wikipedia fetch error:", error);
    return null;
  }
}

/**
 * جلب مقالات متعددة عن موضوع معين
 */
export async function fetchWikipediaArticles(
  topic: string,
  maxArticles: number = 5
): Promise<{ title: string; content: string; url: string; category: string }[]> {
  // البحث أولاً
  const searchResults = await searchWikipedia(topic, maxArticles * 2);
  
  if (searchResults.length === 0) {
    return [];
  }

  // جلب المقالات الكاملة
  const articles: { title: string; content: string; url: string; category: string }[] = [];
  
  for (const result of searchResults.slice(0, maxArticles)) {
    const page = await fetchWikipediaPage(result.pageid);
    
    if (page && page.extract.length > 200) {
      articles.push({
        title: page.title,
        content: page.extract,
        url: page.url,
        category: determineCategory(page.title, page.extract),
      });
    }

    // تأخير بسيط لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return articles;
}

/**
 * تحديد الفئة بناءً على العنوان والمحتوى
 */
function determineCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  if (text.includes("قانون") || text.includes("تشريع") || text.includes("نظام")) {
    return "قانوني";
  }
  
  if (text.includes("فقه") || text.includes("شرع") || text.includes("حكم")) {
    return "فقهي";
  }
  
  if (text.includes("تاريخ") || text.includes("عثمان") || text.includes("مملوك")) {
    return "تاريخي";
  }
  
  if (text.includes("إدارة") || text.includes("تنظيم") || text.includes("وزارة")) {
    return "إداري";
  }

  return "عام";
}

/**
 * قائمة المواضيع المقترحة للبحث
 */
export const WAQF_TOPICS = [
  "الوقف الإسلامي",
  "الأوقاف في فلسطين",
  "الوقف الذري",
  "الوقف الخيري",
  "مجلة الأحكام العدلية",
  "قانون الأراضي العثماني",
  "وزارة الأوقاف الفلسطينية",
  "الحجة الوقفية",
  "ناظر الوقف",
  "المستحقون في الوقف",
];
