import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck,
  FileSearch,
  HeartPulse,
  Inbox,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { APP_ROUTES } from "@/lib/appRoutes";
import { formatArabicDateTime } from "@/lib/dateFormat";

const stageLabel: Record<string, string> = {
  source_verification: "تحقق المصدر",
  citation_verification: "تحقق الاستشهاد",
  content_classification: "تصنيف المحتوى",
};

const statusLabel: Record<string, string> = {
  open: "مفتوحة",
  assigned: "مسندة",
  in_progress: "قيد التنفيذ",
  blocked: "محجوبة",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [refreshing, setRefreshing] = useState(false);
  const [lastWorkHref, setLastWorkHref] = useState<string | null>(null);

  const readiness = trpc.health.readiness.useQuery(undefined, {
    retry: false,
    refetchInterval: 30000,
  });
  const knowledgeAccess = trpc.knowledgeTrust.access.useQuery(undefined, {
    retry: false,
  });
  const canReview = knowledgeAccess.data?.canReview === true;
  const operations = trpc.knowledgeTrust.operationsSnapshot.useQuery(
    undefined,
    { enabled: canReview, retry: false },
  );
  const reviewTasks = trpc.knowledgeTrust.reviewTasks.useQuery(
    { limit: 100, offset: 0 },
    { enabled: canReview, retry: false },
  );
  const sourceStats = trpc.knowledgeSources.stats.useQuery(undefined, {
    retry: false,
  });
  const toolMetrics = trpc.aiTools.getRunMetrics.useQuery(undefined, {
    retry: false,
  });
  const recentRuns = trpc.aiTools.listRuns.useQuery(
    { limit: 8 },
    { retry: false },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("palwakf-last-operational-route");
    if (saved && saved !== APP_ROUTES.adminDashboard && saved !== "/admin") {
      setLastWorkHref(saved);
    }
  }, []);

  const activeTasks = useMemo(
    () =>
      (reviewTasks.data?.results || [])
        .filter((task: any) => !["completed", "cancelled"].includes(String(task.status)))
        .slice(0, 7),
    [reviewTasks.data],
  );

  const recent = useMemo(
    () => (recentRuns.data || []).slice(0, 6),
    [recentRuns.data],
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await utils.invalidate();
    } finally {
      setRefreshing(false);
    }
  };

  const openTasks = Number(operations.data?.reviewTasksOpen || 0);
  const pendingReferences = Number(operations.data?.pendingReferenceDocuments || 0);
  const reviewKnowledge = Number(operations.data?.reviewOnlyKnowledgeDocuments || 0);
  const pendingToolRuns = Number(toolMetrics.data?.byApproval?.pending || 0);
  const databaseAvailable = readiness.data?.details?.database?.available === true;
  const sourceCount = Number(sourceStats.data?.totalSources || 0);

  const actionCards = [
    {
      title: "المساعد",
      description: "ابدأ سؤالًا وقفيًا، افتح المصادر والاستشهادات، وانتقل إلى الأدوات من داخل مسار العمل.",
      href: APP_ROUTES.adminAssistant,
      icon: Bot,
    },
    {
      title: "مساحة المعرفة",
      description: "راجع الطابور، استلم مهمة، ثم افتح ملف التحقق أو نتيجة الأداة.",
      href: APP_ROUTES.adminKnowledgeWorkspace,
      icon: BookOpen,
    },
    {
      title: "الأدوات الذكية",
      description: "تلخيص، استخراج، تصنيف، مقارنة، سوابق وتوقع مع سجل تشغيل محفوظ.",
      href: APP_ROUTES.adminTools,
      icon: Sparkles,
    },
    {
      title: "البحث الموحد",
      description: "ابحث في المعرفة والمصادر وتشغيلات الأدوات من نقطة واحدة.",
      href: APP_ROUTES.adminOperationsSearch,
      icon: Search,
    },
  ];

  return (
    <AdminPage className="production-operations-home">
      <header className="rounded-[28px] border bg-card/90 p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">R10 — تشغيل يومي</Badge>
              <Badge variant={databaseAvailable ? "outline" : "destructive"}>
                <HeartPulse className="ml-1 h-3.5 w-3.5" />
                {databaseAvailable ? "قاعدة البيانات متاحة" : "قاعدة البيانات غير متاحة"}
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight">مركز العمل</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              ابدأ من العمل الذي يحتاج قرارًا أو تنفيذًا الآن. تفاصيل السياسات والأدلة والأمن موجودة في مركز الحوكمة عند الحاجة فقط.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lastWorkHref ? (
              <Button onClick={() => navigate(lastWorkHref)}>
                متابعة آخر عمل <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : null}
            <Button variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`ml-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="مهام تحتاج عملاً">
          <div className="text-4xl font-black">{openTasks}</div>
          <p className="mt-2 text-sm text-muted-foreground">مهام مراجعة مفتوحة أو جارية.</p>
        </AdminCard>
        <AdminCard title="مراجع قيد التحقق">
          <div className="text-4xl font-black">{pendingReferences}</div>
          <p className="mt-2 text-sm text-muted-foreground">مراجع لم تغلق بوابة التحقق بعد.</p>
        </AdminCard>
        <AdminCard title="معرفة قيد المراجعة">
          <div className="text-4xl font-black">{reviewKnowledge}</div>
          <p className="mt-2 text-sm text-muted-foreground">وثائق معرفة تحتاج قرارًا بشريًا.</p>
        </AdminCard>
        <AdminCard title="نتائج أدوات تنتظر مراجعة">
          <div className="text-4xl font-black">{pendingToolRuns}</div>
          <p className="mt-2 text-sm text-muted-foreground">تشغيلات محفوظة لم تعتمد بعد.</p>
        </AdminCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionCards.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.href}
              onClick={() => navigate(item.href)}
              className="group rounded-[24px] border bg-card p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-bold">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-primary">
                فتح <ArrowLeft className="mr-1 h-4 w-4 transition group-hover:-translate-x-1" />
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminCard
          title="ما الذي يحتاج إلى عمل الآن؟"
          description="عينة تشغيلية من طابور المراجعة الحالي. افتح مساحة المعرفة لاستلام المهمة وتنفيذها."
        >
          {!canReview ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              مؤشرات المراجعة محجوبة لأن الحساب الحالي لا يحمل نطاق المراجعة.
            </div>
          ) : reviewTasks.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">جارٍ تحميل الطابور…</div>
          ) : activeTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              لا توجد مهام ظاهرة في الصفحة الحالية.
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task: any) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate(APP_ROUTES.adminKnowledgeWorkspace)}
                  className="flex w-full flex-col gap-2 rounded-2xl border p-4 text-right transition hover:border-primary/40 hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{stageLabel[task.workflow_stage] || task.workflow_stage}</Badge>
                      <Badge variant={task.status === "in_progress" ? "secondary" : "outline"}>
                        {statusLabel[task.status] || task.status}
                      </Badge>
                      <Badge variant="outline">{task.priority || "normal"}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">مهمة مراجعة محفوظة في الطابور التشغيلي.</p>
                  </div>
                  <FileCheck className="h-5 w-5 shrink-0 text-primary" />
                </button>
              ))}
              <Button className="w-full" variant="outline" onClick={() => navigate(APP_ROUTES.adminKnowledgeWorkspace)}>
                فتح مساحة العمل الكاملة
              </Button>
            </div>
          )}
        </AdminCard>

        <AdminCard
          title="آخر تشغيلات الأدوات"
          description="نتائج حقيقية محفوظة في سجل التشغيل. افتح أي تشغيل لمراجعة الناتج والأحداث والروابط."
        >
          {recentRuns.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">جارٍ تحميل التشغيلات…</div>
          ) : recent.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              لا توجد تشغيلات محفوظة.
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((run: any) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => navigate(`${APP_ROUTES.adminToolsRuns}?runId=${encodeURIComponent(run.id)}`)}
                  className="w-full rounded-2xl border p-4 text-right transition hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{run.title || run.tool_key || "تشغيل أداة"}</div>
                    <Badge variant={run.run_status === "failed" ? "destructive" : "secondary"}>
                      {run.run_status === "completed" ? "مكتمل" : run.run_status === "failed" ? "فشل" : run.run_status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{run.tool_key}</span>
                    <span>•</span>
                    <span>{formatArabicDateTime(run.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <AdminCard title="المصادر المسجلة">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black">{sourceCount}</div>
            <FileSearch className="h-6 w-6 text-primary" />
          </div>
        </AdminCard>
        <AdminCard title="تشغيلات الأدوات">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black">{Number(toolMetrics.data?.total || 0)}</div>
            <Inbox className="h-6 w-6 text-primary" />
          </div>
        </AdminCard>
        <AdminCard title="تشغيلات مكتملة">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black">{Number(toolMetrics.data?.byRunStatus?.completed || 0)}</div>
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
        </AdminCard>
      </section>

      <p className="text-xs leading-6 text-muted-foreground">
        الحوكمة لا تختفي من النظام؛ فقط نُقلت من مسار العمل اليومي إلى مركز الحوكمة. لا تعتمد هذه الصفحة أي معرفة أو نتيجة تلقائيًا.
      </p>
    </AdminPage>
  );
}
