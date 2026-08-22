import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck,
  Inbox,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
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

type SelectedWork =
  | { kind: "review"; item: any }
  | { kind: "run"; item: any }
  | null;

export default function KnowledgeOperationsWorkspace() {
  const [, navigate] = useLocation();
  const [selectedWork, setSelectedWork] = useState<SelectedWork>(null);

  const access = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReview = access.data?.canReview === true;
  const snapshot = trpc.knowledgeTrust.operationsSnapshot.useQuery(
    undefined,
    { enabled: canReview, retry: false },
  );
  const tasks = trpc.knowledgeTrust.reviewTasks.useQuery(
    { limit: 100, offset: 0 },
    { enabled: canReview, retry: false },
  );
  const sourceStats = trpc.knowledgeSources.stats.useQuery(undefined, { retry: false });
  const runs = trpc.aiTools.listRuns.useQuery({ limit: 30 }, { retry: false });
  const metrics = trpc.aiTools.getRunMetrics.useQuery(undefined, { retry: false });

  const claim = trpc.knowledgeTrust.claimReviewTask.useMutation({
    onSuccess: async () => {
      toast.success("تم استلام المهمة للمراجع الحالي.");
      await Promise.all([tasks.refetch(), snapshot.refetch()]);
    },
    onError: (error: any) => toast.error(error?.message || "تعذر استلام المهمة."),
  });

  const reviewQueue = useMemo(
    () =>
      (tasks.data?.results || [])
        .filter((task: any) => !["completed", "cancelled"].includes(String(task.status)))
        .slice(0, 18),
    [tasks.data],
  );

  const toolQueue = useMemo(
    () =>
      (runs.data || [])
        .filter((run: any) => run.approval_status === "pending" || run.run_status === "failed")
        .slice(0, 12),
    [runs.data],
  );

  const selectedReview = selectedWork?.kind === "review" ? selectedWork.item : null;
  const selectedRun = selectedWork?.kind === "run" ? selectedWork.item : null;

  return (
    <AdminPage className="production-knowledge-workbench">
      <header className="rounded-[26px] border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-black">مساحة المعرفة</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              طابور واحد للمراجعة ونتائج الأدوات. اختر عملاً من اليمين، راجع سياقه في اللوحة المقابلة، ثم استلمه أو افتح مساره الكامل.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminOperationsSearch)}>
              <Search className="ml-2 h-4 w-4" /> بحث
            </Button>
            <Button onClick={() => navigate(APP_ROUTES.adminTools)}>
              <Sparkles className="ml-2 h-4 w-4" /> تشغيل أداة
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="مهام مفتوحة">
          <div className="text-3xl font-black">{Number(snapshot.data?.reviewTasksOpen || 0)}</div>
        </AdminCard>
        <AdminCard title="مراجع قيد التحقق">
          <div className="text-3xl font-black">{Number(snapshot.data?.pendingReferenceDocuments || 0)}</div>
        </AdminCard>
        <AdminCard title="معرفة قيد المراجعة">
          <div className="text-3xl font-black">{Number(snapshot.data?.reviewOnlyKnowledgeDocuments || 0)}</div>
        </AdminCard>
        <AdminCard title="نتائج أدوات تنتظر اعتمادًا">
          <div className="text-3xl font-black">{Number(metrics.data?.byApproval?.pending || 0)}</div>
        </AdminCard>
      </section>

      {!access.isLoading && !canReview ? (
        <AdminCard title="الوصول إلى طابور المراجعة غير متاح">
          <p className="text-sm text-muted-foreground">
            تبقى نتائج الأدوات ومساحات البحث متاحة حسب الصلاحيات، لكن استلام مهام المعرفة يحتاج نطاق assistant.review.
          </p>
        </AdminCard>
      ) : null}

      <section className="grid min-h-[620px] gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <AdminCard
            title="طابور المراجعة"
            description={`${reviewQueue.length} مهمة ظاهرة من الصفحة التشغيلية الحالية.`}
          >
            {tasks.isLoading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
            ) : reviewQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">لا توجد مهام قابلة للعمل في الصفحة الحالية.</div>
            ) : (
              <div className="max-h-[330px] space-y-2 overflow-y-auto pl-1">
                {reviewQueue.map((task: any) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedWork({ kind: "review", item: task })}
                    className={`w-full rounded-2xl border p-3 text-right transition hover:border-primary/40 ${selectedReview?.id === task.id ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{stageLabel[task.workflow_stage] || task.workflow_stage}</Badge>
                      <Badge variant={task.status === "in_progress" ? "secondary" : "outline"}>{task.status}</Badge>
                      <Badge variant="outline">{task.priority || "normal"}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{formatArabicDateTime(task.created_at)}</p>
                  </button>
                ))}
              </div>
            )}
          </AdminCard>

          <AdminCard
            title="نتائج الأدوات التي تحتاج متابعة"
            description="Pending approval أو Failed فقط."
          >
            {runs.isLoading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
            ) : toolQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">لا توجد نتائج تحتاج متابعة.</div>
            ) : (
              <div className="max-h-[280px] space-y-2 overflow-y-auto pl-1">
                {toolQueue.map((run: any) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setSelectedWork({ kind: "run", item: run })}
                    className={`w-full rounded-2xl border p-3 text-right transition hover:border-primary/40 ${selectedRun?.id === run.id ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{run.title || run.tool_key}</div>
                      <Badge variant={run.run_status === "failed" ? "destructive" : "secondary"}>
                        {run.run_status === "failed" ? "فشل" : "بانتظار الاعتماد"}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{run.input_text || "لا يوجد نص إدخال."}</p>
                  </button>
                ))}
              </div>
            )}
          </AdminCard>
        </div>

        <AdminCard
          title="تفاصيل العمل المحدد"
          description="الإجراءات هنا مرتبطة بالسجلات الحقيقية ولا تنشئ نجاحًا وهميًا."
        >
          {!selectedWork ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-bold">اختر مهمة أو نتيجة أداة</h2>
              <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                سيظهر هنا الإجراء التالي المناسب، مع انتقال مباشر إلى شاشة المراجعة أو سجل التشغيل.
              </p>
            </div>
          ) : selectedReview ? (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/20 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{stageLabel[selectedReview.workflow_stage] || selectedReview.workflow_stage}</Badge>
                  <Badge variant={selectedReview.status === "in_progress" ? "secondary" : "outline"}>{selectedReview.status}</Badge>
                </div>
                <h2 className="mt-4 text-xl font-bold">مهمة مراجعة معرفة</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">الأولوية</dt><dd className="mt-1 font-medium">{selectedReview.priority || "normal"}</dd></div>
                  <div><dt className="text-muted-foreground">الإنشاء</dt><dd className="mt-1 font-medium">{formatArabicDateTime(selectedReview.created_at)}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-muted-foreground">المعرّف</dt><dd className="mt-1 break-all font-mono text-xs">{selectedReview.id}</dd></div>
                </dl>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  disabled={selectedReview.status !== "open" || claim.isPending}
                  onClick={() => claim.mutate({ taskId: selectedReview.id })}
                >
                  <FileCheck className="ml-2 h-4 w-4" />
                  {claim.isPending ? "جارٍ الاستلام…" : selectedReview.status === "open" ? "استلام المهمة" : "المهمة مستلمة"}
                </Button>
                <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminKnowledgeReviewOperations)}>
                  فتح ملف المراجعة <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs leading-6 text-muted-foreground">
                الاستلام يكتب على سجل المهمة الحقيقي عبر knowledgeTrust.claimReviewTask. تنفيذ التحقق نفسه يتم داخل شاشة المراجعة البشرية.
              </p>
            </div>
          ) : selectedRun ? (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/20 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedRun.tool_key}</Badge>
                  <Badge variant={selectedRun.run_status === "failed" ? "destructive" : "secondary"}>{selectedRun.run_status}</Badge>
                  <Badge variant="outline">{selectedRun.approval_status}</Badge>
                </div>
                <h2 className="mt-4 text-xl font-bold">{selectedRun.title || "تشغيل أداة"}</h2>
                <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {selectedRun.output_text || selectedRun.error_message || selectedRun.input_text || "لا توجد معاينة نصية."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-4 w-4" /> {formatArabicDateTime(selectedRun.created_at)}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => navigate(`${APP_ROUTES.adminToolsRuns}?runId=${encodeURIComponent(selectedRun.id)}`)}
              >
                فتح النتيجة وسجل الأحداث <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </AdminCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminCard title="المصادر">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black">{Number(sourceStats.data?.totalSources || 0)}</div>
            <Database className="h-6 w-6 text-primary" />
          </div>
        </AdminCard>
        <AdminCard title="تشغيلات الأدوات">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black">{Number(metrics.data?.total || 0)}</div>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </AdminCard>
        <AdminCard title="تشغيلات معتمدة">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black">{Number(metrics.data?.byApproval?.approved || 0)}</div>
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
        </AdminCard>
      </section>
    </AdminPage>
  );
}
