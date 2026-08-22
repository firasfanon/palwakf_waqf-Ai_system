import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Database,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { APP_ROUTES } from "@/lib/appRoutes";
import { formatArabicDateTime } from "@/lib/dateFormat";

export default function OperationsSearch() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const knowledgeSearch = trpc.knowledgeSearch.search.useMutation();
  const sources = trpc.knowledgeSources.list.useQuery(undefined, { retry: false });
  const toolRuns = trpc.aiTools.listRuns.useQuery(
    {
      searchText: submittedQuery || undefined,
      limit: 30,
    },
    {
      enabled: submittedQuery.trim().length >= 2,
      retry: false,
    },
  );

  const sourceMatches = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return (sources.data || [])
      .filter((source: any) => {
        const haystack = [
          source.name,
          source.url,
          source.baseUrl,
          source.type,
          source.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 20);
  }, [sources.data, submittedQuery]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setSubmittedQuery(q);
    await knowledgeSearch.mutateAsync({ q, limit: 30 });
  };

  const knowledgeResults = knowledgeSearch.data?.results || [];
  const runs = toolRuns.data || [];
  const total = knowledgeResults.length + runs.length + sourceMatches.length;
  const busy = knowledgeSearch.isPending || toolRuns.isFetching;

  return (
    <AdminPage className="production-unified-search">
      <header className="rounded-[26px] border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-black">البحث الموحد</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              ابحث في المعرفة والمصادر وتشغيلات الأدوات من شاشة واحدة، ثم افتح السجل الأصلي بدل نسخ النتيجة إلى شاشة وسيطة.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminAssistant)}>
            <Bot className="ml-2 h-4 w-4" /> فتح المساعد
          </Button>
        </div>
      </header>

      <form onSubmit={submit} className="rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثال: حكر، أرض وقفية، حكم قضائي، اسم جهة أو موضوع..."
            className="h-12 flex-1"
          />
          <Button type="submit" className="h-12 sm:min-w-32" disabled={query.trim().length < 2 || knowledgeSearch.isPending}>
            {knowledgeSearch.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Search className="ml-2 h-4 w-4" />}
            بحث
          </Button>
        </div>
        {submittedQuery ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>نتائج البحث عن:</span>
            <Badge variant="outline">{submittedQuery}</Badge>
            <span>•</span>
            <span>{total} نتيجة معروضة</span>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          </div>
        ) : null}
      </form>

      {!submittedQuery ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-bold">ابدأ بكلمة أو عبارة</h2>
          <p className="mt-2 text-sm text-muted-foreground">لن ينفذ البحث قبل إدخال حرفين على الأقل.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <AdminCard title="المعرفة" description={`${knowledgeResults.length} نتيجة`}>
            <div className="space-y-2">
              {knowledgeResults.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">لا توجد مطابقة معرفية.</div>
              ) : knowledgeResults.slice(0, 20).map((result: any, index: number) => (
                <button
                  key={result.id || result.source_item_id || index}
                  type="button"
                  onClick={() => navigate((result.url || `/knowledge-base/${result.id}`).replace(/^\/knowledge\//, "/knowledge-base/"))}
                  className="w-full rounded-xl border p-3 text-right transition hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <div className="line-clamp-1 font-medium">{result.title || `معرفة #${result.source_item_id || index + 1}`}</div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">
                    {result.chunkText || result.content || result.summary || "لا توجد معاينة نصية."}
                  </p>
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="المصادر" description={`${sourceMatches.length} نتيجة`}>
            <div className="space-y-2">
              {sourceMatches.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">لا توجد مطابقة في أسماء المصادر.</div>
              ) : sourceMatches.map((source: any) => (
                <div key={source.id} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <div className="font-medium">{source.name || "مصدر"}</div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{source.url || source.baseUrl || source.type || "—"}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate("/admin/knowledge-sources")}>
                      إدارة المصدر
                    </Button>
                    {(source.url || source.baseUrl) ? (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={source.url || source.baseUrl} target="_blank" rel="noopener noreferrer">فتح الرابط</a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="نتائج الأدوات" description={`${runs.length} نتيجة`}>
            <div className="space-y-2">
              {runs.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">لا توجد تشغيلات مطابقة.</div>
              ) : runs.slice(0, 20).map((run: any) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => navigate(`${APP_ROUTES.adminToolsRuns}?runId=${encodeURIComponent(run.id)}`)}
                  className="w-full rounded-xl border p-3 text-right transition hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <div className="line-clamp-1 font-medium">{run.title || run.tool_key}</div>
                    </div>
                    <Badge variant={run.run_status === "failed" ? "destructive" : "outline"}>{run.run_status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">
                    {run.output_text || run.error_message || run.input_text || "لا توجد معاينة."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatArabicDateTime(run.created_at)}</p>
                </button>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminKnowledgeWorkspace)}>
          مساحة المعرفة <ArrowLeft className="mr-2 h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>
          استوديو الأدوات <ArrowLeft className="mr-2 h-4 w-4" />
        </Button>
      </div>
    </AdminPage>
  );
}
