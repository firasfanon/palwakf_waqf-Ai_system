export type ResearchSourceKind = "encyclopedic" | "academic" | "legal" | "archival" | "web";
export type ResearchSourceResult = {
  id: string; provider: string; kind: ResearchSourceKind; title: string; url: string;
  content: string; publishedAt?: string | null; authors?: string[]; doi?: string | null;
  authority: "primary" | "scholarly" | "reference" | "discovery"; reviewed: boolean;
};

const UA = "PalWakf-WaqfAI/1.0 research-orchestrator";
async function getJson(url: string, timeoutMs = 9000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA }, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}
function text(v: unknown): string { return String(v ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function rebuildAbstract(index: Record<string, number[]> | null | undefined): string {
  if (!index) return "";
  return Object.entries(index).flatMap(([word, positions]) => positions.map(pos => [pos, word] as const))
    .sort((a,b) => a[0]-b[0]).map(([,word]) => word).join(" ");
}
export async function searchOpenAlex(query: string, limit = 4): Promise<ResearchSourceResult[]> {
  const data = await getJson(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}`);
  return (data?.results || []).map((row: any) => ({
    id: `openalex:${row.id || row.doi || row.title}`, provider: "OpenAlex", kind: "academic" as const,
    title: text(row.title), url: row.doi || row.primary_location?.landing_page_url || row.id,
    content: text(rebuildAbstract(row.abstract_inverted_index)) || text(row.title),
    publishedAt: row.publication_date || null,
    authors: (row.authorships || []).slice(0, 8).map((a: any) => text(a.author?.display_name)).filter(Boolean),
    doi: row.doi || null, authority: "scholarly" as const, reviewed: false,
  })).filter((row: ResearchSourceResult) => row.title && row.url);
}

export async function searchCrossref(query: string, limit = 4): Promise<ResearchSourceResult[]> {
  const data = await getJson(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=${limit}`);
  return (data?.message?.items || []).map((row: any) => ({
    id: `crossref:${row.DOI || row.URL || row.title?.[0]}`, provider: "Crossref", kind: "academic" as const,
    title: text(row.title?.[0]), url: row.URL || (row.DOI ? `https://doi.org/${row.DOI}` : ""),
    content: text(row.abstract) || text(row.title?.[0]), publishedAt: row.published?.["date-parts"]?.[0]?.join("-") || null,
    authors: (row.author || []).slice(0, 8).map((a: any) => text([a.given,a.family].filter(Boolean).join(" "))).filter(Boolean),
    doi: row.DOI || null, authority: "scholarly" as const, reviewed: false,
  })).filter((row: ResearchSourceResult) => row.title && row.url);
}
export async function searchWikipedia(query: string, limit = 4): Promise<ResearchSourceResult[]> {
  const api = "https://ar.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(query) +
    `&gsrlimit=${limit}&prop=extracts|info&exintro=1&explaintext=1&inprop=url&format=json&origin=*`;
  const data = await getJson(api);
  return Object.values(data?.query?.pages || {}).map((row: any) => ({
    id: `wikipedia:${row.pageid}`, provider: "Wikipedia", kind: "encyclopedic" as const,
    title: text(row.title), url: row.fullurl || `https://ar.wikipedia.org/?curid=${row.pageid}`, content: text(row.extract),
    authority: "discovery" as const, reviewed: false,
  })).filter((row: ResearchSourceResult) => row.title && row.url);
}

function tokens(value: string): string[] {
  return text(value).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(token => token.length >= 3);
}
export function researchRelevanceScore(query: string, row: ResearchSourceResult): number {
  const q = [...new Set(tokens(query))];
  if (!q.length) return 0;
  const haystack = new Set(tokens(`${row.title} ${row.content}`));
  const matches = q.filter(token => haystack.has(token)).length;
  const title = new Set(tokens(row.title));
  const titleMatches = q.filter(token => title.has(token)).length;
  return (matches / q.length) + (titleMatches / q.length);
}
export function filterRelevantResearchSources(query: string, rows: ResearchSourceResult[], minScore = 0.5): ResearchSourceResult[] {
  return rows.map(row => ({ row, score: researchRelevanceScore(query, row) }))
    .filter(item => item.score >= (item.row.kind === "academic" ? Math.max(minScore, 0.75) : minScore))
    .sort((a, b) => {
      const authorityRank = (value: ResearchSourceResult["authority"]) => value === "primary" ? 4 : value === "reference" ? 3 : value === "scholarly" ? 2 : 1;
      return authorityRank(b.row.authority) - authorityRank(a.row.authority) || b.score - a.score;
    })
    .map(item => item.row);
}

export function dedupeResearchSources(rows: ResearchSourceResult[]): ResearchSourceResult[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    const key = (row.doi || row.url || row.title).toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (seen.has(key)) return false; seen.add(key); return true;
  });
}
export async function searchExternalResearch(query: string, deep = false): Promise<ResearchSourceResult[]> {
  const jobs = [searchAuthoritativeCatalog(query, deep ? 6 : 4), searchWikipedia(query, deep ? 4 : 2)];
  if (deep) jobs.push(searchOpenAlex(query, 5), searchCrossref(query, 5));
  const settled = await Promise.allSettled(jobs);
  return filterRelevantResearchSources(query, dedupeResearchSources(settled.flatMap(x => x.status === "fulfilled" ? x.value : []))).slice(0, deep ? 10 : 4);
}

export async function searchExternalResearchMany(queries: string[], deep = true): Promise<ResearchSourceResult[]> {
  const unique = [...new Set(queries.map(q => q.trim()).filter(Boolean))].slice(0, 4);
  const settled = await Promise.allSettled(unique.map(q => searchExternalResearch(q, deep)));
  return dedupeResearchSources(settled.flatMap(x => x.status === "fulfilled" ? x.value : [])).slice(0, 10);
}


type AuthoritativeCatalogEntry = {
  id: string; provider: string; kind: ResearchSourceKind; title: string; url: string;
  authority: ResearchSourceResult["authority"]; keywords: string[];
};
const AUTHORITATIVE_CATALOG: AuthoritativeCatalogEntry[] = [
  { id: "maqam:ottoman-land-code-1858", provider: "مقام - جامعة النجاح", kind: "legal", title: "قانون الأراضي العثماني 1858", url: "https://maqam.najah.edu/legislation/169/", authority: "reference", keywords: ["قانون الأراضي العثماني","الأراضي الموقوفة","وقف تخصيصات","الوقف غير الصحيح","المادة 4","المادة 121","تمليك","ملكنامه"] },
  { id: "maqam:appeal-96-2017", provider: "مقام - جامعة النجاح", kind: "legal", title: "استئناف القدس 96/2017 - وقف خاصكي سلطان ووقف التخصيصات", url: "https://maqam.najah.edu/judgments/1780/", authority: "reference", keywords: ["خاصكي سلطان","وقف تخصيصات","وقف غير صحيح","الأراضي العثماني","بيت لحم","بيت جالا"] },
  { id: "maqam:cassation-1543-2016", provider: "مقام - جامعة النجاح", kind: "legal", title: "نقض 1543/2016 - الفرق بين الوقف الصحيح ووقف التخصيصات", url: "https://maqam.najah.edu/judgments/7543/", authority: "reference", keywords: ["وقف تخصيصات","وقف غير صحيح","المادة 4","الأراضي العثماني","رقبة العقار","بيت المال"] },
  { id: "openjerusalem:haseki-ottoman-archive", provider: "OpenJerusalem Archives", kind: "archival", title: "Ottoman archival records concerning the Waqf of Haseki Sultan in Jerusalem", url: "https://archives.openjerusalem.org/index.php/informationobject/browse?collection=31098&media=print&repos=739&sf_culture=en&sort=identifier&sortDir=asc&topLod=0&view=table", authority: "primary", keywords: ["Haseki Sultan","خاصكي سلطان","Jerusalem","وقف","waqf","Ottoman","برات","حجة","سند","أرشيف"] },
  { id: "escholarship:haseki-deed-1552", provider: "University of California eScholarship", kind: "academic", title: "Early-Ottoman Palestinian Toponymy: Haseki Sultan's Endowment Deed (1552)", url: "https://escholarship.org/uc/item/0cs6f5k5", authority: "scholarly", keywords: ["Haseki Sultan","خاصكي سلطان","waqfiyya","وقفية","endowment deed","1552","Jerusalem","العمارة العامرة"] }
];
async function getHtmlText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": UA }, signal: controller.signal });
    if (!res.ok) throw new Error("HTTP_" + res.status);
    const html = await res.text();
    return text(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  } finally { clearTimeout(timer); }
}
export async function searchAuthoritativeCatalog(query: string, limit = 6): Promise<ResearchSourceResult[]> {
  const qTokens = new Set(tokens(query));
  const ranked = AUTHORITATIVE_CATALOG.map(entry => {
    const keyTokens = tokens([entry.title, ...entry.keywords].join(" "));
    const hits = keyTokens.filter(token => qTokens.has(token)).length;
    return { entry, score: hits / Math.max(1, Math.min(qTokens.size, 8)) };
  }).filter(item => item.score >= 0.2).sort((a,b) => b.score - a.score).slice(0, limit);
  const settled = await Promise.allSettled(ranked.map(async ({ entry }) => ({
    id: entry.id, provider: entry.provider, kind: entry.kind, title: entry.title, url: entry.url,
    content: `${entry.keywords.join(" ")}\n${(await getHtmlText(entry.url)).slice(0, 4500)}`, authority: entry.authority, reviewed: false,
  } satisfies ResearchSourceResult)));
  return settled.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
}
