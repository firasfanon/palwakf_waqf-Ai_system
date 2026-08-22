import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileSearch,
  FileText,
  GitCompare,
  Inbox,
  ScanText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { APP_ROUTES, getAdminToolRoute } from "@/lib/appRoutes";
import { formatArabicDateTime } from "@/lib/dateFormat";
import { hasAdminToolsAccess } from "@/lib/access";

const toolDefinitions = [
  { key: "summarize", title: "التلخيص", description: "حوّل وثيقة أو نصًا طويلًا إلى خلاصة عملية محفوظة.", icon: FileText },
  { key: "extract", title: "الاستخراج", description: "استخرج الكيانات والوقائع والإشارات القانونية.", icon: ScanText },
  { key: "classify", title: "التصنيف", description: "صنّف الوثيقة أو المحتوى مع نتيجة قابلة للمراجعة.", icon: FileSearch },
  { key: "compare", title: "المقارنة", description: "قارن حكمين أو نصين واحفظ الفروق والاتفاقات.", icon: GitCompare },
  { key: "precedents", title: "السوابق", description: "حلل اتجاهات وسوابق محفوظة ضمن تشغيل سيادي.", icon: BookOpen },
  { key: "predict", title: "التوقع", description: "قدّر العوامل والنتيجة الاحتمالية مع سجل تشغيل.", icon: Target },
] as const;

export default function AITools() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const allowed = !!user && hasAdminToolsAccess(user);

  const metrics = trpc.aiTools.getRunMetrics.useQuery(undefined, {
    enabled: allowed,
    retry: false,
  });
  const recentRuns = trpc.aiTools.listRuns.useQuery(
    { limit: 12 },
    { enabled: allowed, retry: false },
  );
  const activation = trpc.aiTools.getBackendActivationSnapshot.useQuery(undefined, {
    enabled: allowed,
    retry: false,
  });

  const pendingRuns = useMemo(
    () =>
      (recentRuns.data || [])
        .filter((run: any) => run.approval_status === "pending" || run.run_status === "failed")
        .slice(0, 8),
    [recentRuns.data],
  );

  if (loading || !user) {
    return <AdminPage><div className="py-16 text-center text-sm text-muted-foreground">جارٍ تجهيز استوديو الأدوات…</div></AdminPage>;
  }

  if (!hasAdminToolsAccess(user)) {
    return (
      <AdminPage>
        <div className="rounded-2xl border border-destructive/30 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 text-xl font-bold">الوصول إلى الأدوات غير متاح</h1>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage className="production-ai-tools-studio">
      <header className="rounded-[26px] border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-black">استوديو الأدوات الذكية</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              اختر الأداة، نفّذ التشغيل، ثم راجع النتيجة المحفوظة أو اربطها بمسار المعرفة. تفاصيل Backend والحوكمة مخفية أسفل الصفحة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsOutputIntake)}>
              <Inbox className="ml-2 h-4 w-4" /> صندوق المخرجات
            </Button>
            <Button onClick={() => navigate(APP_ROUTES.adminToolsRuns)}>
              <ShieldCheck className="ml-2 h-4 w-4" /> سجل النتائج
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="إجمالي التشغيلات">
          <div className="text-4xl font-black">{Number(metrics.data?.total || 0)}</div>
        </AdminCard>
        <AdminCard title="بانتظار الاعتماد">
          <div className="text-4xl font-black">{Number(metrics.data?.byApproval?.pending || 0)}</div>
        </AdminCard>
        <AdminCard title="معتمدة">
          <div className="text-4xl font-black">{Number(metrics.data?.byApproval?.approved || 0)}</div>
        </AdminCard>
        <AdminCard title="فاشلة">
          <div className="text-4xl font-black">{Number(metrics.data?.byRunStatus?.failed || 0)}</div>
        </AdminCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolDefinitions.map((tool) => {
          const Icon = tool.icon;
          const count = Number((metrics.data?.byTool as any)?.[tool.key] || 0);
          return (
            <button
              type="button"
              key={tool.key}
              onClick={() => navigate(getAdminToolRoute(tool.key))}
              className="group rounded-[24px] border bg-card p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline">{count} تشغيل</Badge>
              </div>
              <h2 className="mt-4 text-lg font-bold">{tool.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{tool.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-primary">
                تشغيل الأداة <ArrowLeft className="mr-1 h-4 w-4 transition group-hover:-translate-x-1" />
              </div>
            </button>
          );
        })}
      </section>

      <AdminCard
        title="نتائج تحتاج متابعة"
        description="تشغيلات بانتظار الاعتماد أو تشغيلات فشلت وتحتاج فتح سجلها."
      >
        {recentRuns.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">جارٍ تحميل التشغيلات…</div>
        ) : pendingRuns.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            لا توجد تشغيلات تحتاج متابعة في العينة الحالية.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {pendingRuns.map((run: any) => (
              <button
                type="button"
                key={run.id}
                onClick={() => navigate(`${APP_ROUTES.adminToolsRuns}?runId=${encodeURIComponent(run.id)}`)}
                className="rounded-2xl border p-4 text-right transition hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{run.title || run.tool_key}</div>
                  <Badge variant={run.run_status === "failed" ? "destructive" : "secondary"}>
                    {run.run_status === "failed" ? "فشل" : "بانتظار الاعتماد"}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {run.output_text || run.error_message || run.input_text || "لا توجد معاينة نصية."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{formatArabicDateTime(run.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </AdminCard>

      <details className="rounded-2xl border bg-card">
        <summary className="cursor-pointer list-none p-5 font-semibold">
          تفاصيل Backend والحوكمة
          <span className="mr-2 text-xs font-normal text-muted-foreground">للمراجعة التقنية فقط</span>
        </summary>
        <div className="border-t p-5">
          {activation.isLoading ? (
            <div className="text-sm text-muted-foreground">جارٍ قراءة حالة Backend…</div>
          ) : activation.error ? (
            <div className="text-sm text-destructive">{activation.error.message}</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(activation.data?.records || []).map((record: any) => (
                <div key={record.toolKey} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{record.toolLabel}</div>
                    <Badge variant="outline">{record.backendStatusLabel}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted/40 p-2"><strong className="block text-lg">{record.completedRuns}</strong>مكتملة</div>
                    <div className="rounded-lg bg-muted/40 p-2"><strong className="block text-lg">{record.knowledgeLinks}</strong>روابط</div>
                    <div className="rounded-lg bg-muted/40 p-2"><strong className="block text-lg">{record.pendingReviewRuns}</strong>مراجعة</div>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">{record.nextAction}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminKnowledgeWorkspace)}>
          <CheckCircle2 className="ml-2 h-4 w-4" /> الانتقال لمساحة المعرفة
        </Button>
        <Button variant="ghost" onClick={() => navigate(APP_ROUTES.adminToolsGuide)}>
          دليل الاستخدام
        </Button>
      </div>
    </AdminPage>
  );
}
