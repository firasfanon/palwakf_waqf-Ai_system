import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, FileText, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const stageLabel = {
  source_verification: "تحقق المصدر",
  citation_verification: "تحقق الاستشهاد",
  content_classification: "تصنيف المحتوى",
} as const;

const statusLabel: Record<string, string> = {
  open: "مفتوحة",
  assigned: "مسندة",
  in_progress: "قيد التنفيذ",
  blocked: "محجوبة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

type ReviewWorkflowStage = keyof typeof stageLabel;
type ReviewActionMode = "source" | "citation" | "classification" | null;

const actionModeByStage: Record<ReviewWorkflowStage, Exclude<ReviewActionMode, null>> = {
  source_verification: "source",
  citation_verification: "citation",
  content_classification: "classification",
};

const stageActionLabel: Record<ReviewWorkflowStage, string> = {
  source_verification: "توثيق المصدر",
  citation_verification: "توثيق الاستشهاد",
  content_classification: "قرار احتوائي",
};

function asReviewWorkflowStage(value: unknown): ReviewWorkflowStage | null {
  const stage = String(value ?? "");
  return stage === "source_verification" || stage === "citation_verification" || stage === "content_classification" ? stage : null;
}

function compactDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar");
}

function SafeText({ value, empty = "—" }: { value: unknown; empty?: string }) {
  const text = String(value ?? "").trim();
  return <span className="break-words [overflow-wrap:anywhere]">{text || empty}</span>;
}

function isSafeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function toReviewErrorMessage(error: unknown, fallback: string) {
  const raw = String((error as any)?.message ?? error ?? "").trim();
  if (!raw || raw.startsWith("{") || raw.startsWith("[") || /(?:zod|too small|minimum|expected string|invalid input|validation)/i.test(raw) || raw.length > 240) return fallback;
  return raw;
}

export default function KnowledgeReviewOperations() {
  const access = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReview = access.data?.canReview === true;
  const queryOptions = { enabled: canReview, retry: false };
  const tasks = trpc.knowledgeTrust.reviewTasks.useQuery({ limit: 100, offset: 0 }, queryOptions);

  const [stageFilter, setStageFilter] = useState<ReviewWorkflowStage>("content_classification");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [actionMode, setActionMode] = useState<ReviewActionMode>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [issuer, setIssuer] = useState("");
  const [locator, setLocator] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [classificationDecision, setClassificationDecision] = useState<"confirm_test" | "confirm_duplicate" | "confirm_quarantine" | "defer">("defer");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [actionFormError, setActionFormError] = useState<string | null>(null);

  const selectedTaskId = selectedTask?.id || "00000000-0000-4000-8000-000000000000";
  const reviewCase = trpc.knowledgeTrust.reviewTaskCase.useQuery({ taskId: selectedTaskId }, { enabled: Boolean(selectedTask?.id) && canReview, retry: false });

  const refreshTaskState = () => Promise.all([tasks.refetch(), reviewCase.refetch()]);
  const claim = trpc.knowledgeTrust.claimReviewTask.useMutation({
    onSuccess: () => { toast.success("تم استلام المهمة للمراجع الحالي."); refreshTaskState(); },
    onError: (error: unknown) => toast.error(toReviewErrorMessage(error, "تعذر استلام المهمة. تأكد من أنها ما زالت مفتوحة.")),
  });
  const verifySource = trpc.knowledgeTrust.verifyOfficialSource.useMutation({
    onSuccess: () => { toast.success("تم توثيق المصدر."); setActionMode(null); refreshTaskState(); },
    onError: (error: unknown) => toast.error(toReviewErrorMessage(error, "تعذر حفظ توثيق المصدر. راجع الرابط واسم الجهة.")),
  });
  const verifyCitation = trpc.knowledgeTrust.verifyCitation.useMutation({
    onSuccess: () => { toast.success("تم توثيق الاستشهاد."); setActionMode(null); refreshTaskState(); },
    onError: (error: unknown) => toast.error(toReviewErrorMessage(error, "تعذر حفظ توثيق الاستشهاد. أدخل موضعًا واضحًا أولًا.")),
  });
  const resolveClassification = trpc.knowledgeTrust.resolveContentClassificationContainment.useMutation({
    onSuccess: () => { toast.success("تم حفظ القرار الاحتوائي."); setActionMode(null); refreshTaskState(); },
    onError: (error: unknown) => toast.error(toReviewErrorMessage(error, "تعذر حفظ القرار. تأكد من استلام المهمة وإدخال السند.")),
  });

  const busy = claim.isPending || verifySource.isPending || verifyCitation.isPending || resolveClassification.isPending;
  const visibleTasks = useMemo(() => (tasks.data?.results || []).filter((task: any) => task.workflow_stage === stageFilter && !["completed", "cancelled"].includes(task.status)), [tasks.data, stageFilter]);

  const caseData = reviewCase.data as any;
  const selectedStage = asReviewWorkflowStage(selectedTask?.workflow_stage);
  const caseStage = asReviewWorkflowStage(caseData?.task?.workflow_stage);
  const stageMismatch = Boolean(selectedStage && caseStage && selectedStage !== caseStage);
  const effectiveWorkflowStage = selectedStage ?? caseStage;
  const expectedActionMode = effectiveWorkflowStage ? actionModeByStage[effectiveWorkflowStage] : null;
  const taskStatus = String(caseData?.task?.status || selectedTask?.status || "");
  const taskClaimedByCurrentReviewer = caseData?.task?.taskClaimedByCurrentReviewer === true;
  const taskOpenForClaim = taskStatus === "open";
  const hasRequiredContext = Boolean(
    effectiveWorkflowStage === "source_verification" ? caseData?.referenceDocument?.id : caseData?.knowledgeDocument?.id,
  );
  const actionReady = Boolean(taskClaimedByCurrentReviewer && expectedActionMode && hasRequiredContext && !stageMismatch && !busy);

  const resetCase = () => {
    setSelectedTask(null);
    setActionMode(null);
    setActionFormError(null);
    setSourceUrl("");
    setIssuer("");
    setLocator("");
    setExcerpt("");
    setEvidenceNote("");
  };

  const openCase = (task: any) => {
    setSelectedTask(task);
    setActionMode(null);
    setActionFormError(null);
    setSourceUrl("");
    setIssuer("");
    setLocator("");
    setExcerpt("");
    setEvidenceNote("");
  };

  const openStageAction = () => {
    if (!effectiveWorkflowStage || !expectedActionMode || stageMismatch) {
      toast.error("تعذر فتح الإجراء لأن مرحلة المهمة غير متطابقة. أغلق الملف ثم أعد فتحه.");
      return;
    }
    if (!taskClaimedByCurrentReviewer) {
      toast.error("استلم المهمة أولًا قبل فتح نموذج الإجراء.");
      return;
    }
    if (!hasRequiredContext) {
      toast.error("سياق الوثيقة المطلوب لهذه المهمة غير متاح حاليًا.");
      return;
    }
    setActionFormError(null);
    setActionMode(expectedActionMode);
  };

  const submitAction = () => {
    if (!selectedTask || !actionMode || !expectedActionMode || actionMode !== expectedActionMode || stageMismatch) {
      setActionFormError("الإجراء لا يطابق مرحلة المهمة الحالية.");
      return;
    }
    if (!taskClaimedByCurrentReviewer) {
      setActionFormError("يجب استلام المهمة صراحةً قبل حفظ أي إجراء.");
      return;
    }
    if (actionMode === "source") {
      if (issuer.trim().length < 2) return setActionFormError("يرجى إدخال اسم الجهة الرسمية.");
      if (!isSafeHttpUrl(sourceUrl.trim())) return setActionFormError("يرجى إدخال رابط رسمي صالح يبدأ بـ http:// أو https://.");
      verifySource.mutate({
        taskId: selectedTask.id,
        referenceDocumentId: caseData?.referenceDocument?.id || selectedTask.target_id,
        canonicalSourceUrl: sourceUrl.trim(),
        issuerName: issuer.trim(),
        evidenceJson: { review_surface: "daily-review-workspace", maturity_phase: "mega_batch_a" },
      });
      return;
    }
    if (actionMode === "citation") {
      if (locator.trim().length < 2) return setActionFormError("يرجى إدخال محدد الاستشهاد، مثل رقم الصفحة أو المادة.");
      verifyCitation.mutate({
        taskId: selectedTask.id,
        knowledgeDocumentId: caseData?.knowledgeDocument?.id || selectedTask.target_id,
        citationId: caseData?.selectedCitation?.id,
        locator: locator.trim(),
        excerpt: excerpt.trim() || undefined,
        evidenceJson: { review_surface: "daily-review-workspace", maturity_phase: "mega_batch_a" },
      });
      return;
    }
    if (evidenceNote.trim().length < 20) return setActionFormError("يرجى إدخال سند للقرار لا يقل عن 20 حرفًا.");
    resolveClassification.mutate({
      taskId: selectedTask.id,
      decision: classificationDecision,
      evidenceNote: evidenceNote.trim(),
      evidenceJson: { review_surface: "daily-review-workspace", containment_only: true, maturity_phase: "mega_batch_a" },
    });
  };

  if (access.isLoading) return <AdminPage><div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-3 text-sm text-muted-foreground">جارٍ تجهيز مساحة المراجعة…</p></div></AdminPage>;
  if (!canReview) return <AdminPage><div className="operational-surface rounded-xl border p-7 text-center"><ShieldAlert className="mx-auto h-9 w-9 text-destructive" /><h1 className="mt-3 text-xl font-bold">وصول المراجعة غير متاح</h1><p className="mt-2 text-sm text-muted-foreground">هذه المساحة تتطلب نطاق المراجعة المعتمد.</p></div></AdminPage>;

  return (
    <AdminPage className="daily-review-workspace">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold">مراجعة المعرفة</h2>
        <p className="text-sm text-muted-foreground">اختر مرحلة، افتح مهمة واحدة، ثم استلمها قبل تنفيذ الإجراء المطلوب.</p>
      </header>

      <section className="operational-surface rounded-xl border p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(stageLabel) as ReviewWorkflowStage[]).map((stage) => <Button key={stage} type="button" variant={stageFilter === stage ? "default" : "outline"} onClick={() => setStageFilter(stage)}>{stageLabel[stage]}</Button>)}
        </div>
      </section>

      <AdminCard title={stageLabel[stageFilter]} description={`${visibleTasks.length} مهمة ظاهرة في هذه المرحلة ضمن الدفعة الحالية.`} className="review-task-card">
        {tasks.isLoading ? <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /></div> : visibleTasks.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد مهام قابلة للعمل ضمن هذه المرحلة في الصفحة الحالية.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b"><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الأولوية</th><th className="p-3 text-right">تاريخ الإنشاء</th><th className="p-3 text-right">الإجراء</th></tr></thead><tbody>{visibleTasks.map((task: any) => <tr key={task.id} className="border-b"><td className="p-3"><Badge variant={task.status === "in_progress" ? "secondary" : "outline"}>{statusLabel[task.status] || task.status}</Badge></td><td className="p-3"><SafeText value={task.priority} /></td><td className="p-3"><SafeText value={compactDate(task.created_at)} /></td><td className="p-3"><Button size="sm" variant="outline" onClick={() => openCase(task)}><FileText className="ml-1 h-4 w-4" />فتح المهمة</Button></td></tr>)}</tbody></table></div>}
      </AdminCard>

      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => !open && resetCase()}>
        <DialogContent className="workflow-dialog w-[calc(100vw-2rem)] max-w-[1120px] gap-0 overflow-hidden p-0 sm:max-w-[1120px]" dir="rtl">
          <div className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col">
            <DialogHeader className="shrink-0 border-b px-5 py-4 sm:px-7"><DialogTitle>ملف المراجعة</DialogTitle><DialogDescription className="mt-1">مسار عمل يومي: قراءة السياق ثم استلام المهمة ثم تنفيذ الإجراء المطابق فقط.</DialogDescription></DialogHeader>
            <div className="workflow-dialog-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {reviewCase.isLoading ? <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin" /></div> : reviewCase.error ? <div className="operational-surface rounded-xl border p-6 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-destructive" /><p className="mt-3 font-semibold">تعذر تحميل سياق المهمة</p><p className="mt-1 text-sm text-muted-foreground">تحقق من الاتصال ثم أغلق الملف وافتحه مجددًا.</p></div> : <div className="space-y-5">
                <section className="workflow-stage-panel rounded-xl border p-4" data-stage-mismatch={stageMismatch ? "true" : "false"}>
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">المرحلة</p><h3 className="mt-1 font-semibold">{effectiveWorkflowStage ? stageLabel[effectiveWorkflowStage] : "مرحلة غير معروفة"}</h3></div><Badge variant={taskClaimedByCurrentReviewer ? "secondary" : "outline"}>{taskClaimedByCurrentReviewer ? "المهمة مستلمة" : statusLabel[taskStatus] || "بانتظار الاستلام"}</Badge></div>
                  {stageMismatch ? <p className="mt-3 text-sm text-destructive">تعارض في مرحلة المهمة بين القائمة والسياق؛ تم حجب أي إجراء. أغلق الملف ثم أعد فتحه.</p> : !taskClaimedByCurrentReviewer ? <p className="mt-3 text-sm text-muted-foreground">اقرأ السياق ثم استلم المهمة. لن يظهر نموذج حفظ قبل الاستلام.</p> : !hasRequiredContext ? <p className="mt-3 text-sm text-destructive">لا يتوفر سياق الوثيقة المطلوب لهذه المرحلة. لا يمكن حفظ إجراء.</p> : <p className="mt-3 text-sm text-muted-foreground">الإجراء المتاح الآن: {effectiveWorkflowStage ? stageActionLabel[effectiveWorkflowStage] : "—"}.</p>}
                </section>
                <section className="review-context-section rounded-xl border p-4"><h3 className="font-semibold">الوثيقة المعرفية</h3><div className="mt-3 grid gap-3 text-sm md:grid-cols-2"><div><span className="font-medium">العنوان: </span><SafeText value={caseData?.knowledgeDocument?.title} empty="غير مرتبط" /></div><div><span className="font-medium">الحالة: </span><SafeText value={caseData?.knowledgeDocument?.status} /></div><div><span className="font-medium">الفئة: </span><SafeText value={caseData?.knowledgeDocument?.category} /></div><div><span className="font-medium">تاريخ الإنشاء: </span><SafeText value={compactDate(caseData?.knowledgeDocument?.created_at)} /></div></div>{caseData?.knowledgeDocument?.summary ? <div className="mt-4 rounded-lg border bg-muted p-3 text-sm leading-7"><SafeText value={caseData.knowledgeDocument.summary} /></div> : null}{caseData?.knowledgeDocument?.content ? <details className="mt-4 rounded-lg border p-3"><summary className="cursor-pointer font-medium">معاينة المحتوى</summary><div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]"><SafeText value={String(caseData.knowledgeDocument.content).slice(0, 12000)} /></div></details> : null}</section>
                <details className="review-context-section rounded-xl border p-4"><summary className="cursor-pointer font-semibold">المصدر والمرجع</summary><div className="mt-3 space-y-2 text-sm"><div><span className="font-medium">المرجع: </span><SafeText value={caseData?.referenceDocument?.title} empty="غير متاح" /></div><div><span className="font-medium">المصدر: </span><SafeText value={caseData?.source?.name} empty="غير متاح" /></div><div><span className="font-medium">الرابط: </span><SafeText value={caseData?.source?.base_url} empty="غير متاح" /></div></div></details>
                <details className="review-context-section rounded-xl border p-4"><summary className="cursor-pointer font-semibold">الاستشهادات المرتبطة ({caseData?.integrity?.citationCount ?? 0})</summary><div className="mt-3 space-y-3">{(caseData?.citations || []).length ? (caseData.citations || []).map((citation: any) => <div key={citation.id} className="rounded-lg border bg-muted p-3 text-sm"><div><span className="font-medium">الموضع: </span><SafeText value={citation.locator} /></div><div className="mt-1"><span className="font-medium">المقتطف: </span><SafeText value={citation.excerpt} /></div></div>) : <p className="text-sm text-muted-foreground">لا توجد استشهادات معروضة.</p>}</div></details>
                <details className="review-context-section rounded-xl border p-4"><summary className="cursor-pointer font-semibold">الملفات المرتبطة ({caseData?.integrity?.fileCount ?? 0})</summary><div className="mt-3 space-y-2">{(caseData?.files || []).length ? (caseData.files || []).map((file: any) => <div key={file.id} className="rounded-lg border p-3 text-sm"><SafeText value={file.original_filename || file.storage_path} /></div>) : <p className="text-sm text-muted-foreground">لا توجد ملفات مرتبطة.</p>}</div></details>
              </div>}
            </div>
            <DialogFooter className="shrink-0 border-t px-5 py-4 sm:px-7"><div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><Button variant="outline" onClick={resetCase}>إغلاق</Button><div className="flex flex-wrap gap-2">{taskOpenForClaim ? <Button variant="outline" disabled={busy} onClick={() => claim.mutate({ taskId: selectedTask.id })}><ClipboardCheck className="ml-1 h-4 w-4" />استلام المهمة</Button> : null}{taskClaimedByCurrentReviewer ? <Button disabled={!actionReady} onClick={openStageAction}>{effectiveWorkflowStage ? stageActionLabel[effectiveWorkflowStage] : "إجراء غير متاح"}</Button> : null}</div></div></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(actionMode)} onOpenChange={(open) => !open && (setActionMode(null), setActionFormError(null))}>
        <DialogContent className="workflow-dialog w-[calc(100vw-2rem)] max-w-[640px] gap-0 overflow-hidden p-0 sm:max-w-[640px]" dir="rtl"><div className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col"><DialogHeader className="shrink-0 border-b px-5 py-4"><DialogTitle>{actionMode === "source" ? "توثيق مصدر رسمي" : actionMode === "citation" ? "توثيق استشهاد" : "قرار احتوائي"}</DialogTitle><DialogDescription className="mt-2">أكمل الحقول المطلوبة ثم احفظ الإجراء.</DialogDescription></DialogHeader><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{actionFormError ? <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{actionFormError}</div> : null}{actionMode === "source" ? <div className="space-y-4"><div><Label htmlFor="issuerName">اسم الجهة الرسمية</Label><Input id="issuerName" value={issuer} onChange={(event) => { setIssuer(event.target.value); setActionFormError(null); }} /></div><div><Label htmlFor="canonicalSourceUrl">الرابط الرسمي</Label><Input id="canonicalSourceUrl" type="url" value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setActionFormError(null); }} placeholder="https://example.ps/..." /></div></div> : null}{actionMode === "citation" ? <div className="space-y-4"><div><Label htmlFor="citationLocator">الموضع أو الصفحة أو المادة</Label><Input id="citationLocator" value={locator} onChange={(event) => { setLocator(event.target.value); setActionFormError(null); }} placeholder="مثال: المادة 12، ص 4" /><p className="mt-1 text-xs text-muted-foreground">هذا الحقل إلزامي.</p></div><div><Label htmlFor="citationExcerpt">مقتطف اختياري</Label><Textarea id="citationExcerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} /></div></div> : null}{actionMode === "classification" ? <div className="space-y-4"><div className="grid gap-2 sm:grid-cols-2">{([["confirm_test", "تأكيد اختبار"], ["confirm_duplicate", "تأكيد تكرار"], ["confirm_quarantine", "تأكيد حجر"], ["defer", "تأجيل محكوم"]] as const).map(([value, label]) => <Button key={value} type="button" variant={classificationDecision === value ? "default" : "outline"} onClick={() => setClassificationDecision(value)}>{label}</Button>)}</div><div><Label htmlFor="classificationEvidence">سند القرار</Label><Textarea id="classificationEvidence" value={evidenceNote} onChange={(event) => { setEvidenceNote(event.target.value); setActionFormError(null); }} placeholder="اشرح سبب القرار وسنده." /><p className="mt-1 text-xs text-muted-foreground">20 حرفًا على الأقل.</p></div></div> : null}</div><DialogFooter className="shrink-0 border-t px-5 py-4"><div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setActionMode(null)}>إلغاء</Button><Button disabled={busy} onClick={submitAction}>{busy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}{actionMode === "classification" ? "حفظ القرار" : "حفظ التحقق"}</Button></div></DialogFooter></div></DialogContent>
      </Dialog>
    </AdminPage>
  );
}
