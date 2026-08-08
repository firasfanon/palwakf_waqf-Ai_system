import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { APP_ROUTES, getAdminToolRoute } from "@/lib/appRoutes";
import { queryParamFromHybridAddress } from "@/lib/hybridLocationPath";
import { formatArabicDateTime } from "@/lib/dateFormat";
import { hasAdminToolsAccess } from "@/lib/access";
import { AlertCircle, CheckCircle2, Clock3, Eye, Inbox, Loader2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const toolLabels: Record<string, string> = {
  extract: "الاستخراج",
  summarize: "التلخيص",
  classify: "التصنيف",
  compare: "مقارنة الأحكام",
  precedents: "تحليل السوابق",
  predict: "توقع النتائج",
};

function approvalVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function runIdFromBrowserAddress() {
  if (typeof window === "undefined") return null;

  const candidate = queryParamFromHybridAddress(
    window.location.hash || "",
    window.location.search || "",
    "runId",
  ) || "";

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : null;
}

export default function AIToolRuns() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [toolKey, setToolKey] = useState<string>("");
  const [approvalStatus, setApprovalStatus] = useState<string>("");
  const [runStatus, setRunStatus] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(() => runIdFromBrowserAddress());
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    const syncSelectedRunFromAddress = () => {
      setSelectedRunId(runIdFromBrowserAddress());
    };

    syncSelectedRunFromAddress();
    window.addEventListener("hashchange", syncSelectedRunFromAddress);
    window.addEventListener("popstate", syncSelectedRunFromAddress);

    return () => {
      window.removeEventListener("hashchange", syncSelectedRunFromAddress);
      window.removeEventListener("popstate", syncSelectedRunFromAddress);
    };
  }, []);

  const metricsQuery = trpc.aiTools.getRunMetrics.useQuery(undefined, { enabled: !!user && hasAdminToolsAccess(user) });
  const listQuery = trpc.aiTools.listRuns.useQuery({
    toolKey: toolKey ? (toolKey as any) : undefined,
    approvalStatus: approvalStatus ? (approvalStatus as any) : undefined,
    runStatus: runStatus ? (runStatus as any) : undefined,
    searchText: searchText.trim() || undefined,
    limit: 100,
  });

  const detailsQuery = trpc.aiTools.getRunDetails.useQuery(
    { toolRunId: selectedRunId || "00000000-0000-0000-0000-000000000000" },
    { enabled: !!selectedRunId }
  );

  const reviewMutation = trpc.aiTools.reviewRun.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الاعتماد");
      void listQuery.refetch();
      void detailsQuery.refetch();
      void metricsQuery.refetch();
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast.error(`تعذر تحديث الحالة: ${error.message}`);
    },
  });

  const reopenMutation = trpc.aiTools.reopenRun.useMutation({
    onSuccess: () => {
      toast.success("تمت إعادة فتح التشغيل وإعادته إلى بانتظار الاعتماد");
      void listQuery.refetch();
      void detailsQuery.refetch();
      void metricsQuery.refetch();
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast.error(`تعذر إعادة فتح التشغيل: ${error.message}`);
    },
  });

  const summary = useMemo(() => {
    const metrics = metricsQuery.data;
    if (metrics) {
      return {
        total: metrics.total || 0,
        pending: metrics.byApproval?.pending || 0,
        approved: metrics.byApproval?.approved || 0,
        rejected: metrics.byApproval?.rejected || 0,
        failed: metrics.byRunStatus?.failed || 0,
      };
    }
    const runs = listQuery.data || [];
    return {
      total: runs.length,
      pending: runs.filter((item: any) => item.approval_status === "pending").length,
      approved: runs.filter((item: any) => item.approval_status === "approved").length,
      rejected: runs.filter((item: any) => item.approval_status === "rejected").length,
      failed: runs.filter((item: any) => item.run_status === "failed").length,
    };
  }, [listQuery.data, metricsQuery.data]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAdminToolsAccess(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة</Button>
      </div>
    );
  }

  const selectedRun = detailsQuery.data?.run;
  const selectedLinks = detailsQuery.data?.links || [];
  const selectedEvents = detailsQuery.data?.events || [];
  const selectedQuality = detailsQuery.data?.quality;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              مركز تشغيل الأدوات الذكية
            </div>
            <h1 className="text-3xl font-bold">سجل التشغيل والاعتماد</h1>
            <p className="text-muted-foreground">
              عرض نتائج الأدوات الذكية المخزنة سياديًا في <code>assistant.ai_tool_runs</code> مع الأحداث والروابط وإجراءات الاعتماد وإعادة الفتح.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>
              العودة للأدوات
            </Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsOutputIntake)}>
              <Inbox className="ml-2 h-4 w-4" />
              صندوق المخرجات
            </Button>
            <Button onClick={() => navigate(getAdminToolRoute("extract"))}>
              تشغيل أداة جديدة
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{summary.total}</div><p className="text-sm text-muted-foreground mt-2">إجمالي التشغيلات</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{summary.pending}</div><p className="text-sm text-muted-foreground mt-2">بانتظار الاعتماد</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{summary.approved}</div><p className="text-sm text-muted-foreground mt-2">معتمدة</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{summary.rejected}</div><p className="text-sm text-muted-foreground mt-2">مرفوضة</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{summary.failed}</div><p className="text-sm text-muted-foreground mt-2">تشغيلات فاشلة</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>مرشحات السجل</CardTitle>
            <CardDescription>فلترة التشغيلات حسب الأداة أو الاعتماد أو حالة التنفيذ أو نص الإدخال.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={toolKey} onChange={(e) => setToolKey(e.target.value)}>
              <option value="">كل الأدوات</option>
              {Object.entries(toolLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
              <option value="">كل حالات الاعتماد</option>
              <option value="pending">بانتظار الاعتماد</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={runStatus} onChange={(e) => setRunStatus(e.target.value)}>
              <option value="">كل حالات التشغيل</option>
              <option value="completed">مكتمل</option>
              <option value="failed">فاشل</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </select>
            <Input placeholder="بحث في العنوان أو الإدخال" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>سجل التشغيلات</CardTitle>
              <CardDescription>انقر على أي تشغيل لعرض التفاصيل والأحداث والروابط. يمكن إعادة فتح التشغيلات المرفوضة أو المعتمدة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {listQuery.isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (listQuery.data || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                  لا توجد تشغيلات مطابقة للمرشحات الحالية.
                </div>
              ) : (
                (listQuery.data || []).map((run: any) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => {
                      setSelectedRunId(run.id);
                      navigate(`${APP_ROUTES.adminToolsRuns}?runId=${encodeURIComponent(run.id)}`);
                    }}
                    className={`w-full rounded-2xl border p-4 text-right transition hover:border-primary/40 hover:bg-accent/30 ${selectedRunId === run.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{toolLabels[run.tool_key] || run.tool_key}</Badge>
                          <Badge variant={approvalVariant(run.approval_status)}>
                            {run.approval_status === "approved" ? "معتمد" : run.approval_status === "rejected" ? "مرفوض" : "بانتظار الاعتماد"}
                          </Badge>
                          <Badge variant={run.run_status === "failed" ? "destructive" : "secondary"}>
                            {run.run_status === "completed" ? "مكتمل" : run.run_status === "failed" ? "فاشل" : run.run_status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{run.title || "تشغيل بدون عنوان"}</h3>
                        <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{run.input_text || "لا يوجد نص إدخال محفوظ."}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {formatArabicDateTime(run.created_at)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل التشغيل المحدد</CardTitle>
              <CardDescription>المخرجات، الروابط، وسجل الأحداث مع إمكانية اعتماد النتيجة أو رفضها أو إعادة فتحها.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRunId ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                  اختر تشغيلًا من القائمة لعرض التفاصيل.
                </div>
              ) : detailsQuery.isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !selectedRun ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">تعذر تحميل تفاصيل التشغيل.</div>
              ) : (
                <>
                  <div className="space-y-2 rounded-2xl bg-accent/40 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{toolLabels[selectedRun.tool_key] || selectedRun.tool_key}</Badge>
                      <Badge variant={approvalVariant(selectedRun.approval_status)}>{selectedRun.approval_status}</Badge>
                      {selectedQuality ? <Badge variant={selectedQuality.score >= 85 ? "default" : selectedQuality.score >= 65 ? "secondary" : "destructive"}>جودة: {selectedQuality.grade} / {selectedQuality.score}</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">المعرف: {selectedRun.id}</p>
                    <p className="text-sm leading-7"><strong>الإدخال:</strong> {selectedRun.input_text || "—"}</p>
                    <p className="text-sm leading-7"><strong>ملخص الناتج:</strong> {selectedRun.output_text || selectedRun.error_message || "—"}</p>
                  </div>

                  {selectedQuality ? (
                    <div className="space-y-2 rounded-2xl border p-4">
                      <h3 className="font-semibold">فحص جودة التشغيل</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl bg-accent/40 p-3 text-sm">الأثر السيادي: {selectedQuality.hasCreatedEvent && selectedQuality.hasTerminalEvent ? "مكتمل" : "ناقص"}</div>
                        <div className="rounded-xl bg-accent/40 p-3 text-sm">اللغة العربية: {selectedQuality.hasArabicOutput === null ? "لا يوجد ناتج" : selectedQuality.hasArabicOutput ? "مقبولة" : "تحتاج مراجعة"}</div>
                        <div className="rounded-xl bg-accent/40 p-3 text-sm">ربط المعرفة: {selectedQuality.hasKnowledgeLink ? "موجود" : "غير مثبت"}</div>
                        <div className="rounded-xl bg-accent/40 p-3 text-sm">درجة الجاهزية: {selectedQuality.score}/100</div>
                      </div>
                      {selectedQuality.warnings?.length ? (
                        <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-7">
                          {selectedQuality.warnings.map((warning: string) => <p key={warning}>• {warning}</p>)}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">لا توجد ملاحظات جودة آلية على هذا التشغيل.</p>
                      )}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <h3 className="font-semibold">الأحداث</h3>
                    <div className="max-h-56 space-y-2 overflow-auto pr-1">
                      {selectedEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد أحداث مرتبطة.</p>
                      ) : selectedEvents.map((event: any) => (
                        <div key={event.id} className="rounded-xl border p-3 text-sm">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="font-medium">{event.event_type}</span>
                            <span className="text-xs text-muted-foreground">{formatArabicDateTime(event.created_at)}</span>
                          </div>
                          <pre className="overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">{JSON.stringify(event.event_payload || {}, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">الروابط</h3>
                    {selectedLinks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">لا توجد روابط معرفة/محادثة مرتبطة بهذا التشغيل بعد.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedLinks.map((link: any) => (
                          <div key={link.id} className="rounded-xl border p-3 text-sm leading-7">
                            <div className="mb-1 flex items-center gap-2">
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="font-medium">{link.link_type}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {link.knowledge_document_id ? <p>وثيقة معرفة: {link.knowledge_document_id}</p> : null}
                              {link.reference_document_id ? <p>مرجع: {link.reference_document_id}</p> : null}
                              {link.reference_file_id ? <p>ملف مرجعي: {link.reference_file_id}</p> : null}
                              {link.conversation_id ? <p>محادثة: {link.conversation_id}</p> : null}
                              {link.message_id ? <p>رسالة: {link.message_id}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-2xl border p-4">
                    <h3 className="font-semibold">قرار الاعتماد</h3>
                    <Textarea
                      placeholder="ملاحظات الاعتماد أو سبب الرفض أو سبب إعادة الفتح"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button
                        onClick={() => reviewMutation.mutate({ toolRunId: selectedRun.id, approvalStatus: "approved", notes: reviewNotes || undefined })}
                        disabled={reviewMutation.isPending || reopenMutation.isPending}
                      >
                        {reviewMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
                        اعتماد
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => reviewMutation.mutate({ toolRunId: selectedRun.id, approvalStatus: "rejected", notes: reviewNotes || undefined })}
                        disabled={reviewMutation.isPending || reopenMutation.isPending}
                      >
                        {reviewMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <XCircle className="ml-2 h-4 w-4" />}
                        رفض
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => reopenMutation.mutate({ toolRunId: selectedRun.id, notes: reviewNotes || undefined })}
                        disabled={reviewMutation.isPending || reopenMutation.isPending || selectedRun.approval_status === "pending"}
                      >
                        {reopenMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <RotateCcw className="ml-2 h-4 w-4" />}
                        إعادة فتح
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
