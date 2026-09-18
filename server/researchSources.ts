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

export function dedupeResearchSources(rows: ResearchSourceResult[]): ResearchSourceResult[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    const key = (row.doi || row.url || row.title).toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (seen.has(key)) return false; seen.add(key); return true;
  });
}
export async function searchExternalResearch(query: string, deep = false): Promise<ResearchSourceResult[]> {
  const jobs = [searchWikipedia(query, deep ? 4 : 2)];
  if (deep) jobs.push(searchOpenAlex(query, 5), searchCrossref(query, 5));
  const settled = await Promise.allSettled(jobs);
  return dedupeResearchSources(settled.flatMap(x => x.status === "fulfilled" ? x.value : [])).slice(0, deep ? 10 : 4);
}

export async function searchExternalResearchMany(queries: string[], deep = true): Promise<ResearchSourceResult[]> {
  const unique = [...new Set(queries.map(q => q.trim()).filter(Boolean))].slice(0, 4);
  const settled = await Promise.allSettled(unique.map(q => searchExternalResearch(q, deep)));
  return dedupeResearchSources(settled.flatMap(x => x.status === "fulfilled" ? x.value : [])).slice(0, 16);
}
