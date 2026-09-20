export type ResearchSourceKind = "encyclopedic" | "academic" | "legal" | "archival" | "web";
export type ResearchSourceResult = {
  id: string; provider: string; kind: ResearchSourceKind; title: string; url: string;
  content: string; publishedAt?: string | null; authors?: string[]; doi?: string | null;
  authority: "primary" | "scholarly" | "reference" | "discovery"; reviewed: boolean;
};

const UA = "PalWakf-WaqfAI/1.0 research-orchestrator";
async function getJson(url: string, timeoutMs = 5000): Promise<any> {
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

function normalizedRequiredMatchTokens(value: string): string[] {
  return text(value)
    .toLowerCase()
    .replace(/ـ/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token.startsWith("ال") && token.length > 4 ? token.slice(2) : token);
}

export function requiredPhraseMatches(query: string, phrase: string): boolean {
  const q = normalizedRequiredMatchTokens(query).join(" ");
  const p = normalizedRequiredMatchTokens(phrase).join(" ");
  return Boolean(p) && q.includes(p);
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

function normalizeEntityText(value: string): string {
  return text(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type EntityAliasRule = {
  id: string;
  triggers: string[];
  aliases: string[];
};

const ENTITY_ALIAS_RULES: EntityAliasRule[] = [
  {
    id: "khalil_al_rahman_waqf",
    triggers: ["خليل الرحمن", "وقف خليل الرحمن", "khalil al rahman", "khalil al-rahman"],
    aliases: [
      "خليل الرحمن",
      "وقف خليل الرحمن",
      "الحرم الابراهيمي",
      "المسجد الابراهيمي",
      "مدينة الخليل",
      "وقف الخليل",
      "khalil al rahman",
      "khalil al-rahman",
      "hebron",
      "haram al ibrahimi",
      "haram al-ibrahimi",
      "ibrahimi mosque",
      "sanctuary of abraham",
      "mosque of abraham",
      "cave of the patriarchs",
    ],
  },
];

function entityRuleForQuery(query: string): EntityAliasRule | null {
  const normalized = normalizeEntityText(query);
  return (
    ENTITY_ALIAS_RULES.find(rule =>
      rule.triggers.some(trigger =>
        normalized.includes(normalizeEntityText(trigger)),
      ),
    ) ?? null
  );
}

export function matchesNamedEntityIntent(
  query: string,
  row: Pick<ResearchSourceResult, "title" | "content" | "url" | "provider">,
): boolean {
  const rule = entityRuleForQuery(query);
  if (!rule) return true;
  const haystack = normalizeEntityText(
    [row.title, row.content, row.url, row.provider].filter(Boolean).join(" "),
  );
  return rule.aliases.some(alias =>
    haystack.includes(normalizeEntityText(alias)),
  );
}

export function filterEntityConsistentResearchSources(
  query: string,
  rows: ResearchSourceResult[],
): ResearchSourceResult[] {
  return rows.filter(row => matchesNamedEntityIntent(query, row));
}

export function filterRelevantResearchSources(query: string, rows: ResearchSourceResult[], minScore = 0.5): ResearchSourceResult[] {
  return rows
    .filter(row => matchesNamedEntityIntent(query, row))
    .map(row => ({ row, score: researchRelevanceScore(query, row) }))
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
  const target = deep ? 6 : 4;
  const authoritative = await searchAuthoritativeCatalog(query, Math.max(target, 6)).catch(() => []);
  // searchAuthoritativeCatalog already applies curated keyword/topic relevance before fetching.
  // Do not re-reject scholarly catalog evidence merely because the user's Arabic wording
  // differs from an English title/abstract.
  const authoritativeEvidence = filterEntityConsistentResearchSources(
    query,
    authoritative.filter(row => Boolean(row.content?.trim())),
  );
  if (authoritativeEvidence.length >= target) return authoritativeEvidence.slice(0, target);

  const secondaryJobs = [searchWikipedia(query, deep ? 4 : 2)];
  if (deep) secondaryJobs.push(searchOpenAlex(query, 5), searchCrossref(query, 5));
  const settled = await Promise.allSettled(secondaryJobs);
  const secondaryRelevant = filterRelevantResearchSources(
    query,
    dedupeResearchSources(settled.flatMap(x => x.status === "fulfilled" ? x.value : []))
  );
  const contentBearing = filterEntityConsistentResearchSources(
    query,
    dedupeResearchSources([...authoritativeEvidence, ...secondaryRelevant])
      .filter(row => Boolean(row.content?.trim())),
  );
  return contentBearing.slice(0, deep ? 10 : 4);
}

export async function searchExternalResearchMany(queries: string[], deep = true): Promise<ResearchSourceResult[]> {
  const unique = [...new Set(queries.map(q => q.trim()).filter(Boolean))].slice(0, 4);
  const settled = await Promise.allSettled(unique.map(q => searchExternalResearch(q, deep)));
  const merged = dedupeResearchSources(
    settled.flatMap(x => x.status === "fulfilled" ? x.value : []),
  );
  const anchorQuery = unique[0] || "";
  return filterEntityConsistentResearchSources(anchorQuery, merged).slice(0, 10);
}


type AuthoritativeCatalogEntry = {
  id: string; provider: string; kind: ResearchSourceKind; title: string; url: string;
  authority: ResearchSourceResult["authority"]; keywords: string[]; evidenceUrl?: string;
  requiredAny?: string[];
};
const AUTHORITATIVE_CATALOG: AuthoritativeCatalogEntry[] = [
  { id: "maqam:ottoman-land-code-1858", provider: "مقام - جامعة النجاح", kind: "legal", title: "قانون الأراضي العثماني 1858", url: "https://maqam.najah.edu/legislation/169/", authority: "reference", keywords: ["قانون الأراضي العثماني","الأراضي الموقوفة","وقف تخصيصات","الوقف غير الصحيح","المادة 4","المادة 121","تمليك","ملكنامه"], requiredAny: ["قانون الأراضي العثماني","الأراضي الموقوفة","وقف تخصيصات","وقف غير صحيح","المادة 4","ملكنامه"] },
  { id: "maqam:appeal-96-2017", provider: "مقام - جامعة النجاح", kind: "legal", title: "استئناف القدس 96/2017 - وقف خاصكي سلطان ووقف التخصيصات", url: "https://maqam.najah.edu/judgments/1780/", authority: "reference", keywords: ["خاصكي سلطان","وقف تخصيصات","وقف غير صحيح","الأراضي العثماني","بيت لحم","بيت جالا"], requiredAny: ["96/2017","خاصكي سلطان","خاسكي سلطان"] },
  { id: "maqam:cassation-1543-2016", provider: "مقام - جامعة النجاح", kind: "legal", title: "نقض 1543/2016 - الفرق بين الوقف الصحيح ووقف التخصيصات", url: "https://maqam.najah.edu/judgments/7543/", authority: "reference", keywords: ["وقف تخصيصات","وقف غير صحيح","المادة 4","الأراضي العثماني","رقبة العقار","بيت المال"], requiredAny: ["1543/2016","وقف تخصيصات","وقف غير صحيح","المادة 4","بيت المال"] },
  { id: "maqam:appeal-91-2017", provider: "مقام - جامعة النجاح", kind: "legal", title: "استئناف القدس 91/2017 - رفض التعميم بأن جميع أراضي بيت لحم وبيت جالا وقف خاصكي سلطان", url: "https://maqam.najah.edu/judgments/1531/", authority: "reference", keywords: ["بيت لحم","بيت جالا","خاصكي سلطان","جميع الأراضي","فرضيات","نوع الأرض","ملك","وقف"], requiredAny: ["بيت لحم","بيت جالا","جميع الأراضي","فرضيات"] },
  { id: "maqam:cassation-1383-2019", provider: "مقام - جامعة النجاح", kind: "legal", title: "نقض 1383/2019 - الحكر وحق المنفعة ورقبة العقار الوقفي", url: "https://maqam.najah.edu/judgments/7576/", authority: "reference", keywords: ["الحكر","حق المنفعة","رقبة العقار","الوقف","تسجيل الحكر","تسوية الأراضي","المادة 3","تميم الداري"], requiredAny: ["الحكر","حق المنفعة","تسجيل الحكر","تميم الداري"] },
  { id: "maqam:sharia-procedure-art2", provider: "مقام - جامعة النجاح", kind: "legal", title: "المادة 2 من قانون أصول المحاكمات الشرعية رقم 31 لسنة 1959 - اختصاصات المحاكم الشرعية في الوقف", url: "https://maqam.najah.edu/legislation/164/item/9569/", authority: "reference", keywords: ["اختصاص المحاكم الشرعية","الوقف وإنشاؤه","صحة الوقف","التولية","المادة 2","أصول المحاكمات الشرعية"], requiredAny: ["اختصاص المحاكم الشرعية","صحة الوقف","التولية","أصول المحاكمات الشرعية"] },
  { id: "openjerusalem:haseki-ottoman-archive", provider: "OpenJerusalem Archives", kind: "archival", title: "Ottoman archival records concerning the Waqf of Haseki Sultan in Jerusalem", url: "https://archives.openjerusalem.org/index.php/informationobject/browse?collection=31098&media=print&repos=739&sf_culture=en&sort=identifier&sortDir=asc&topLod=0&view=table", authority: "primary", keywords: ["Haseki Sultan","خاصكي سلطان","Jerusalem","وقف","waqf","Ottoman","برات","حجة","سند","أرشيف"], requiredAny: ["Haseki Sultan","خاصكي سلطان","خاسكي سلطان","برات","حجة","أرشيف"] },
  { id: "escholarship:haseki-deed-1552", provider: "University of California eScholarship", kind: "academic", title: "Early-Ottoman Palestinian Toponymy: Haseki Sultan's Endowment Deed (1552)", url: "https://escholarship.org/uc/item/0cs6f5k5", evidenceUrl: "https://escholarship.org/oai?verb=GetRecord&metadataPrefix=oai_dc&identifier=ark:/13030/qt0cs6f5k5", authority: "scholarly", keywords: ["Haseki Sultan","خاصكي سلطان","waqfiyya","وقفية","endowment deed","1552","Jerusalem","العمارة العامرة"], requiredAny: ["Haseki Sultan","خاصكي سلطان","خاسكي سلطان","وقفية","وقفيه","waqfiyya","endowment deed","1552","إنشائه","انشائه"] },
  { id: "escholarship:haseki-waqfiyya-geography-1552", provider: "University of California eScholarship", kind: "academic", title: "Mamluk and Ottoman Endowment Deeds as a Source for Geographical-Historical Research: The Waqfiyya of Haseki Sultan (1552 CE)", url: "https://escholarship.org/uc/item/0sg1x015", authority: "scholarly", keywords: ["Haseki Sultan","خاصكي سلطان","waqfiyya","وقفية","endowment deed","1552","historical geography","Jerusalem"], requiredAny: ["Haseki Sultan","خاصكي سلطان","خاسكي سلطان","وقفية","وقفيه","waqfiyya","endowment deed","1552","إنشائه","انشائه"] },
  {
    id: "pla:waqf-types-khalil-al-rahman",
    provider: "Palestinian Land Authority",
    kind: "legal",
    title: "معاملة الوقف (الذري والخيري) - وقف خليل الرحمن مثال على الوقف غير الصحيح",
    url: "https://www.pla.pna.ps/ar/Article/323/%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A9-%D8%A7%D9%84%D9%88%D9%82%D9%81-%28%D8%A7%D9%84%D8%B0%D8%B1%D9%8A-%D9%88%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%D9%8A%29",
    authority: "primary",
    keywords: ["وقف خليل الرحمن","خليل الرحمن","وقف التخصيصات","الوقف غير الصحيح","الأراضي الأميرية","المادة 4"],
    requiredAny: ["وقف خليل الرحمن","خليل الرحمن"],
  },
  {
    id: "najah:cassation-950-2016-khalil-al-rahman",
    provider: "مقام - جامعة النجاح",
    kind: "legal",
    title: "نقض 950/2016 - وقف خليل الرحمن ووقف التخصيصات",
    url: "https://laws-portal.najah.edu/judgments/3885/",
    authority: "reference",
    keywords: ["وقف خليل الرحمن","خليل الرحمن","وقف التخصيصات","الأراضي الأميرية","بيت المال","950/2016"],
    requiredAny: ["وقف خليل الرحمن","خليل الرحمن","950/2016"],
  },
  {
    id: "najah:khalil-al-rahman-nahiye",
    provider: "An-Najah National University Repository",
    kind: "web",
    title: "Nahiye of Khalil Al-Rahman in the 10th A.H. / 16th A.D. Century",
    url: "https://repository.najah.edu/items/41f042ee-488a-4068-b0bd-2beeebfcba1a",
    authority: "scholarly",
    keywords: ["وقف خليل الرحمن","خليل الرحمن","الخليل","الحرم الإبراهيمي","Khalil Al-Rahman","Hebron","waqf properties"],
    requiredAny: ["وقف خليل الرحمن","خليل الرحمن","الحرم الإبراهيمي","المسجد الإبراهيمي","Khalil Al-Rahman","Hebron"],
  },
  {
    id: "museumwnf:haram-al-ibrahimi",
    provider: "Museum With No Frontiers - Discover Islamic Art",
    kind: "web",
    title: "Haram al-Ibrahimi (Sanctuary of Abraham), Hebron",
    url: "https://islamicart.museumwnf.org/database_item.php?id=monument%3BISL%3Bpa%3BMon01%3B13%3Ben",
    authority: "reference",
    keywords: ["وقف خليل الرحمن","خليل الرحمن","الحرم الإبراهيمي","المسجد الإبراهيمي","Haram al-Ibrahimi","Sanctuary of Abraham","Hebron"],
    requiredAny: ["وقف خليل الرحمن","خليل الرحمن","الحرم الإبراهيمي","المسجد الإبراهيمي","Haram al-Ibrahimi","Hebron"],
  },
  {
    id: "handbook-palestine:hebron-abraham-waqf",
    provider: "The Handbook of Palestine (digitized on Wikisource)",
    kind: "web",
    title: "Hebron waqf attached to the Mosque of Abraham",
    url: "https://en.wikisource.org/wiki/The_Handbook_of_Palestine/Part_2",
    authority: "reference",
    keywords: ["وقف خليل الرحمن","خليل الرحمن","الخليل","الحرم الإبراهيمي","Hebron","Mosque of Abraham","waqf","endowment"],
    requiredAny: ["وقف خليل الرحمن","خليل الرحمن","الحرم الإبراهيمي","المسجد الإبراهيمي","Hebron","Mosque of Abraham"],
  }
];
async function getHtmlText(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,application/pdf;q=0.8", "User-Agent": UA }, signal: controller.signal });
    if (!res.ok) throw new Error("HTTP_" + res.status);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/pdf") || url.toLowerCase().includes(".pdf")) return "";
    const html = await res.text();
    return text(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  } finally { clearTimeout(timer); }
}
export function buildEvidenceSnippet(query: string, content: string, maxChars = 1800): string {
  const normalized = text(content);
  if (!normalized || normalized.length <= maxChars) return normalized;
  const entityRule = entityRuleForQuery(query);
  const entitySnippetTerms = entityRule?.id === "khalil_al_rahman_waqf"
    ? ["waqf", "endowment", "hebron", "ibrahimi", "abraham"]
    : [];
  const qTokens = [
    ...new Set([
      ...tokens(query),
      ...tokens(entityRule?.aliases.join(" ") || ""),
      ...entitySnippetTerms,
    ]),
  ].filter(token => token.length >= 3);
  const lower = normalized.toLowerCase();
  const positions = qTokens
    .map(token => lower.indexOf(token.toLowerCase()))
    .filter(position => position >= 0)
    .sort((a, b) => a - b);
  if (positions.length === 0) return normalized.slice(0, maxChars);
  const windows: string[] = [];
  const radius = Math.max(220, Math.floor(maxChars / Math.min(positions.length, 3) / 2));
  for (const position of positions.slice(0, 3)) {
    const start = Math.max(0, position - radius);
    const end = Math.min(normalized.length, position + radius);
    windows.push(normalized.slice(start, end));
  }
  return [...new Set(windows)].join(" … ").slice(0, maxChars);
}

export async function searchAuthoritativeCatalog(query: string, limit = 6): Promise<ResearchSourceResult[]> {
  const qTokens = new Set(tokens(query));
  const normalizedQuery = text(query).toLowerCase();
  const ranked = AUTHORITATIVE_CATALOG.map(entry => {
    if (entry.requiredAny?.length && !entry.requiredAny.some(phrase => requiredPhraseMatches(query, phrase))) {
      return { entry, score: 0 };
    }
    const keyTokens = tokens([entry.title, ...entry.keywords].join(" "));
    const hits = keyTokens.filter(token => qTokens.has(token)).length;
    const historicalBoost =
      entry.id.startsWith("escholarship:") &&
      /(إنشائه|انشائه|إنشاء|انشاء|وقفية|وقفيه|waqfiyya|endowment deed)/iu.test(query)
        ? 0.5
        : 0;
    const caseMatch = query.match(/\b(\d{1,4})\s*\/\s*(\d{4})\b/);
    const caseBoost = caseMatch && (entry.title.includes(`${caseMatch[1]}/${caseMatch[2]}`) || (entry.id.includes(caseMatch[1]) && entry.id.includes(caseMatch[2]))) ? 1 : 0;
    return { entry, score: (hits / Math.max(1, Math.min(qTokens.size, 8))) + historicalBoost + caseBoost };
  }).filter(item => item.score >= 0.2).sort((a,b) => b.score - a.score).slice(0, limit);
  const settled = await Promise.allSettled(ranked.map(async ({ entry }) => {
    const fetched = await getHtmlText(entry.evidenceUrl || entry.url);
    return {
      id: entry.id,
      provider: entry.provider,
      kind: entry.kind,
      title: entry.title,
      url: entry.url,
      content: buildEvidenceSnippet(query, fetched, 3600),
      authority: entry.authority,
      reviewed: false,
    } satisfies ResearchSourceResult;
  }));
  return settled.flatMap((result, index) => {
    if (result.status === "fulfilled" && result.value.content) return [result.value];
    const fallback = ranked[index]?.entry;
    if (!fallback) return [];
    return [{
      id: fallback.id, provider: fallback.provider, kind: fallback.kind, title: fallback.title, url: fallback.url,
      content: "", authority: fallback.authority, reviewed: false,
    } satisfies ResearchSourceResult];
  });
}
