import { useMemo, useState } from "react";
import { Loader2, Network, Search, ShieldCheck } from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const methodMeta: Record<string, { label: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  exact_legacy_key: { label: "مفتاح موروث مطابق", tone: "default" },
  exact_content_fingerprint: { label: "بصمة محتوى مطابقة", tone: "default" },
  exact_title_and_url: { label: "عنوان + رابط مطابقان", tone: "default" },
  exact_title_unique_valid_url_candidate: { label: "عنوان + رابط مرشح واحد", tone: "secondary" },
  exact_title_without_url_candidate: { label: "عنوان بلا رابط صالح", tone: "outline" },
  no_deterministic_candidate: { label: "لا مرشح حتمي", tone: "destructive" },
};

const stateMeta: Record<string, { label: string; detail: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  deterministic_lineage_with_unique_url: { label: "lineage حتمي + رابط واحد", detail: "رابط محفوظ للمراجعة؛ ليس اعتمادًا أو تحققًا حيًا.", tone: "secondary" },
  deterministic_lineage_multiple_evidence: { label: "lineage حتمي متعدد الأدلة", detail: "المسار التاريخي مثبت، لكن الجهة/الرابط النهائيان يحتاجان قرارًا بشريًا.", tone: "outline" },
  title_unique_valid_url_candidate: { label: "مرشح عنوان/رابط", detail: "مرشح قوي لا يرقى إلى مصدر رسمي تلقائيًا.", tone: "outline" },
  title_only_review: { label: "عنوان فقط", detail: "الدليل غير كافٍ لاعتماد مصدر أو رابط.", tone: "destructive" },
  manual_containment_required: { label: "تحقيق أو احتواء", detail: "لا يوجد ربط حتمي قابل للاعتماد في الـLedger.", tone: "destructive" },
  test_artifact_excluded: { label: "أثر اختبار مستبعد", detail: "تم استبعاد روابط الاختبار من مسار الترشيح ولا يجوز اعتمادها.", tone: "destructive" },
};

const queues = [
  { state: "deterministic_lineage_with_unique_url", label: "رابط حتمي", description: "مرشح رابط محفوظ يحتاج تحققًا بشريًا." },
  { state: "deterministic_lineage_multiple_evidence", label: "استعادة بلا رابط", description: "lineage مثبت مع أدلة متعددة بلا رابط نهائي." },
  { state: "title_unique_valid_url_candidate", label: "عنوان + رابط", description: "مرشح عنوان/رابط يحتاج مراجعة." },
  { state: "title_only_review", label: "عنوان فقط", description: "حالة استثناء تحتاج دليلًا إضافيًا." },
  { state: "manual_containment_required", label: "احتواء يدوي", description: "لا يجوز اعتبارها مصدرًا أو رابطًا حتميًا." },
  { state: "test_artifact_excluded", label: "آثار اختبار", description: "قرائية فقط؛ لا قرار provenance عليها." },
] as const;

const decisions = [
  ["official_source_candidate_confirmed", "تأكيد مرشح مصدر رسمي — غير معتمد"],
  ["institutional_source_candidate_confirmed", "تأكيد مرشح مصدر مؤسسي — غير معتمد"],
  ["metadata_insufficient", "البيانات غير كافية"],
  ["needs_external_research", "يتطلب تحققًا خارجيًا موثقًا"],
  ["not_authoritative", "ليس مصدر سلطة"],
  ["duplicate_or_contained", "مكرر أو يحتاج احتواء"],
] as const;

function rows(value: unknown): any[] { return Array.isArray(value) ? value as any[] : []; }
function num(value: unknown): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function taskStatusLabel(status: unknown): string {
  const labels: Record<string, string> = { open: "مفتوحة", assigned: "مستلمة", in_progress: "قيد العمل", blocked: "محجوبة", completed: "مكتملة", cancelled: "ملغاة" };
  return labels[String(status || "")] || "غير معروفة";
}

export default function LegacyProvenanceResolutionCenter() {
  const access = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReview = access.data?.canReview === true;
  const [selectedQueue, setSelectedQueue] = useState<(typeof queues)[number]["state"]>("deterministic_lineage_with_unique_url");
  const snapshot = trpc.legacyProvenance.snapshot.useQuery(undefined, { enabled: canReview, retry: false });
  const groups = trpc.legacyProvenance.groups.useQuery({ limit: 60 }, { enabled: canReview && Boolean(snapshot.data?.latestRunId), retry: false });
  const items = trpc.legacyProvenance.items.useQuery({ state: selectedQueue, limit: 500 }, { enabled: canReview && Boolean(snapshot.data?.latestRunId), retry: false });
  const sourceTasksFirstPage = trpc.knowledgeTrust.reviewTasks.useQuery({ workflowStage: "source_verification", limit: 500, offset: 0 }, { enabled: canReview, retry: false });
  const sourceTasksSecondPage = trpc.knowledgeTrust.reviewTasks.useQuery({ workflowStage: "source_verification", limit: 500, offset: 500 }, { enabled: canReview, retry: false });
  const duplicateTasks = trpc.legacyProvenance.duplicateCitationTasks.useQuery({ limit: 40 }, { enabled: canReview, retry: false });
  const [decisionTarget, setDecisionTarget] = useState<any | null>(null);
  const [decisionCode, setDecisionCode] = useState<string>("metadata_insufficient");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [candidateUrl, setCandidateUrl] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTaskId = decisionTarget?.sourceTaskId || "00000000-0000-4000-8000-000000000000";
  const selectedTaskCase = trpc.knowledgeTrust.reviewTaskCase.useQuery(
    { taskId: selectedTaskId },
    { enabled: canReview && Boolean(decisionTarget?.sourceTaskId), retry: false },
  );

  const refreshOperationalData = () => Promise.all([
    snapshot.refetch(),
    groups.refetch(),
    items.refetch(),
    sourceTasksFirstPage.refetch(),
    sourceTasksSecondPage.refetch(),
    selectedTaskCase.refetch(),
  ]);

  const run = trpc.legacyProvenance.runReconstruction.useMutation({
    onSuccess: () => { toast.success("اكتملت إعادة بناء lineage الموروث V1.1 دون اعتماد مصدر أو فتح Chat."); void refreshOperationalData(); },
    onError: (error) => toast.error(error.message || "تعذر تشغيل إعادة بناء المنشأ V1.1."),
  });
  const claim = trpc.knowledgeTrust.claimReviewTask.useMutation({
    onSuccess: () => { toast.success("تم استلام مهمة التحقق من المصدر للمراجع الحالي."); void refreshOperationalData(); },
    onError: (error) => toast.error(error.message || "تعذر استلام مهمة التحقق من المصدر."),
  });
  const recordDecision = trpc.legacyProvenance.recordDecision.useMutation({
    onSuccess: () => { toast.success("تم تسجيل قرار المراجع داخل الـLedger فقط."); setDecisionTarget(null); setEvidenceReference(""); setCandidateUrl(""); setIssuerName(""); setNotes(""); void refreshOperationalData(); },
    onError: (error) => toast.error(error.message || "تعذر تسجيل القرار."),
  });
  const reconcile = trpc.legacyProvenance.reconcileDuplicateCitationTask.useMutation({
    onSuccess: () => { toast.success("تمت تسوية مهمة citation زائدة فقط مع حفظ الأثر."); duplicateTasks.refetch(); },
    onError: (error) => toast.error(error.message || "تعذر تسوية الازدواج."),
  });

  const summary = useMemo(() => ({
    total: num(snapshot.data?.summary?.total_items),
    deterministic: num(snapshot.data?.summary?.deterministic_lineage_items),
    review: num(snapshot.data?.summary?.review_required_items),
    excluded: num(snapshot.data?.summary?.test_artifact_items),
    duplicates: num(snapshot.data?.summary?.duplicate_citation_task_groups),
  }), [snapshot.data]);
  const sourceTasks = useMemo(() => [
    ...rows(sourceTasksFirstPage.data?.results),
    ...rows(sourceTasksSecondPage.data?.results),
  ], [sourceTasksFirstPage.data, sourceTasksSecondPage.data]);
  const sourceTaskByReferenceDocumentId = useMemo(() => {
    const result = new Map<string, any>();
    for (const task of sourceTasks) {
      const targetId = String(task?.target_id || "");
      if (!targetId || ["completed", "cancelled"].includes(String(task?.status || ""))) continue;
      if (!result.has(targetId)) result.set(targetId, task);
    }
    return result;
  }, [sourceTasks]);
  const busy = run.isPending || claim.isPending || recordDecision.isPending || reconcile.isPending;
  const visibleGroups = rows(groups.data?.groups);
  const visibleItems = rows(items.data?.items);
  const duplicateGroups = rows(duplicateTasks.data?.groups);
  const selectedQueueMeta = queues.find((queue) => queue.state === selectedQueue) || queues[0];
  const currentTaskClaimedByReviewer = (selectedTaskCase.data as any)?.task?.taskClaimedByCurrentReviewer === true;
  const currentTaskStatus = String((selectedTaskCase.data as any)?.task?.status || decisionTarget?.sourceTaskStatus || "");

  if (access.isLoading) return <AdminPage><div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-3 text-sm text-muted-foreground">جارٍ التحقق من الصلاحية…</p></div></AdminPage>;
  if (!canReview) return <AdminPage><AdminCard title="الوصول غير متاح" description="يتطلب هذا المركز نطاق assistant.review."><p className="text-sm text-muted-foreground">لا تظهر أدلة المصدر أو قرارات المراجعة دون نطاق فعال.</p></AdminCard></AdminPage>;

  const openDecision = (item: any) => {
    if (item.provenance_state === "test_artifact_excluded") {
      toast.error("أثر الاختبار مستبعد ولا يقبل قرار منشأ.");
      return;
    }
    const referenceDocumentId = String(item.reference_document_id || "");
    const sourceTask = referenceDocumentId ? sourceTaskByReferenceDocumentId.get(referenceDocumentId) : null;
    if (!referenceDocumentId || !sourceTask?.id) {
      toast.error("لا توجد مهمة source_verification مطابقة لهذا العنصر؛ لا يمكن تسجيل القرار.");
      return;
    }
    setDecisionTarget({ ...item, sourceTaskId: String(sourceTask.id), sourceTaskStatus: String(sourceTask.status || "") });
    setDecisionCode("metadata_insufficient");
    setEvidenceReference("");
    setCandidateUrl(item.candidate_url || "");
    setIssuerName("");
    setNotes("");
  };
  const submitDecision = () => {
    if (!decisionTarget?.sourceTaskId || !currentTaskClaimedByReviewer) {
      toast.error("يجب استلام مهمة source_verification المطابقة قبل حفظ القرار.");
      return;
    }
    recordDecision.mutate({
      itemId: decisionTarget.id,
      taskId: decisionTarget.sourceTaskId,
      decisionCode: decisionCode as any,
      evidenceReference: evidenceReference.trim(),
      candidateUrl: candidateUrl.trim() || undefined,
      issuerName: issuerName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return <AdminPage className="space-y-5">
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2"><div className="flex items-center gap-2"><Network className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">إعادة بناء منشأ المعرفة — V1.1</h1></div><p className="max-w-4xl text-sm leading-7 text-muted-foreground">يفصل هذا المركز بين lineage موروث قابل للتتبع، ومرشح مصدر يحتاج قرارًا بشريًا، وأثر اختبار مستبعد. وعاء الاستيراد لا يتحول إلى مصدر رسمي، والربط الحتمي لا يساوي تحققًا من المصدر أو اعتمادًا للنشر.</p></div>
        <Button size="lg" disabled={busy} onClick={() => run.mutate({ note: "operator-triggered-v1-1-nested-evidence-deterministic-crosswalk" })}>{run.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Search className="ml-2 h-4 w-4" />}تشغيل V1.1</Button>
      </div>
    </section>

    {snapshot.isError ? <AdminCard title="Ledger V1.1 لم يُطبق بعد" description="تحتاج الصفحة SQL V1.1 قبل التشغيل."><p className="text-sm text-muted-foreground">{snapshot.error.message}</p></AdminCard> : null}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><AdminCard title="إجمالي العناصر"><div className="text-3xl font-bold">{summary.total || "—"}</div><p className="mt-2 text-sm text-muted-foreground">source verification في آخر audit.</p></AdminCard><AdminCard title="lineage حتمي"><div className="text-3xl font-bold">{summary.deterministic || 0}</div><p className="mt-2 text-sm text-muted-foreground">ليس اعتماد مصدر رسمي.</p></AdminCard><AdminCard title="قرار مراجعة"><div className="text-3xl font-bold">{summary.review || 0}</div><p className="mt-2 text-sm text-muted-foreground">دليل غير كافٍ أو مرشح فقط.</p></AdminCard><AdminCard title="أثر اختبار"><div className="text-3xl font-bold">{summary.excluded || 0}</div><p className="mt-2 text-sm text-muted-foreground">مستبعد من الترشيح.</p></AdminCard><AdminCard title="ازدواج citation"><div className="text-3xl font-bold">{summary.duplicates || 0}</div><p className="mt-2 text-sm text-muted-foreground">يدوي فقط.</p></AdminCard></section>

    <section className="grid gap-4 xl:grid-cols-2"><AdminCard title="مجموعات lineage والدليل" description="النطاق أو الرابط مجرد دليل للمراجع ولا يمثل تصنيف سلطة آليًا.">{visibleGroups.length === 0 ? <p className="text-sm text-muted-foreground">شغّل V1.1 لعرض المجموعات.</p> : <div className="space-y-3">{visibleGroups.slice(0, 16).map((group) => { const method = methodMeta[group.binding_method] || { label: group.binding_method || "غير مصنف", tone: "outline" as const }; const state = stateMeta[group.provenance_state] || { label: group.provenance_state || "غير مصنف", detail: "راجع الدليل.", tone: "outline" as const }; return <div key={group.candidate_group_key} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{group.candidate_host_category || "دليل بلا نطاق"}</p><p className="mt-1 text-xs text-muted-foreground">{group.affected_documents || 0} وثيقة · {group.binding_method || "—"}</p>{group.candidate_url ? <p className="mt-1 break-all text-xs text-muted-foreground">{group.candidate_url}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{state.detail}</p></div><div className="flex flex-col items-end gap-1"><Badge variant={method.tone}>{method.label}</Badge><Badge variant={state.tone}>{state.label}</Badge></div></div></div>; })}</div>}</AdminCard>
      <AdminCard title="طوابير قرار المنشأ" description="لا يفتح القرار إلا مع مهمة source_verification مطابقة ومستلمة للمراجع الحالي."><div className="mb-4 flex flex-wrap gap-2">{queues.map((queue) => <Button key={queue.state} size="sm" variant={queue.state === selectedQueue ? "default" : "outline"} disabled={busy} onClick={() => setSelectedQueue(queue.state)}>{queue.label}</Button>)}</div><p className="mb-3 text-sm text-muted-foreground">{selectedQueueMeta.description} · العناصر المعروضة: {visibleItems.length}.</p>{visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد عناصر في هذا الطابور.</p> : <div className="max-h-[42rem] space-y-3 overflow-y-auto pr-1">{visibleItems.map((item) => { const method = methodMeta[item.binding_method] || { label: item.binding_method || "غير مصنف", tone: "outline" as const }; const state = stateMeta[item.provenance_state] || { label: item.provenance_state || "غير مصنف", detail: "راجع الدليل.", tone: "outline" as const }; const sourceTask = item.reference_document_id ? sourceTaskByReferenceDocumentId.get(String(item.reference_document_id)) : null; const isTestArtifact = item.provenance_state === "test_artifact_excluded"; return <div key={item.id} className="rounded-xl border p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{item.title || "وثيقة بلا عنوان"}</p><p className="mt-1 text-xs text-muted-foreground">{method.label} · {item.candidate_host_category || "لا تصنيف نطاق"}</p>{item.candidate_url ? <p className="mt-1 break-all text-xs text-muted-foreground">{item.candidate_url}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{state.detail}</p><p className="mt-1 text-xs text-muted-foreground">مهمة المصدر: {sourceTask ? taskStatusLabel(sourceTask.status) : "لا توجد مهمة مطابقة"}</p></div><div className="flex items-center gap-2"><Badge variant={state.tone}>{state.label}</Badge><Button size="sm" variant="outline" disabled={busy || isTestArtifact || !sourceTask} onClick={() => openDecision(item)}>{isTestArtifact ? "مستبعد" : sourceTask ? "إجراء مراجعة" : "لا مهمة"}</Button></div></div></div>; })}</div>}</AdminCard></section>

    <AdminCard title="ازدواج مهام الاستشهاد الموروثة" description="لا توجد تسوية آلية؛ بعد مراجعة زوج متطابق فقط يمكن إلغاء النسخة الزائدة.">{duplicateGroups.length === 0 ? <p className="text-sm text-muted-foreground">لا يظهر ازدواج نشط ضمن الحدود المعروضة.</p> : <div className="space-y-3">{duplicateGroups.slice(0, 8).map((group) => { const ids = Array.isArray(group.task_ids) ? group.task_ids.map(String) : []; return <div key={group.target_id} className="rounded-xl border p-3"><p className="text-sm font-semibold">وثيقة {String(group.target_id).slice(0, 8)}…</p><p className="mt-1 text-xs text-muted-foreground">مهام نشطة: {group.active_task_count}.</p>{ids.length >= 2 ? <Button className="mt-2" size="sm" variant="outline" disabled={busy} onClick={() => { const rationale = window.prompt("سبب الإبقاء على المهمة الأولى وإلغاء الثانية:"); if (rationale && rationale.trim().length >= 8) reconcile.mutate({ keepTaskId: ids[0], cancelTaskId: ids[1], rationale: rationale.trim() }); }}>تسوية أول زوج</Button> : null}</div>; })}</div>}</AdminCard>

    <Dialog open={Boolean(decisionTarget)} onOpenChange={(open) => { if (!open) setDecisionTarget(null); }}><DialogContent><DialogHeader><DialogTitle>تسجيل قرار منشأ V1.1</DialogTitle><DialogDescription>هذا الإجراء يسجل دليلًا وقرارًا داخل الـLedger فقط. لا يثبت مصدرًا رسميًا ولا يغير حالة النشر أو Chat.</DialogDescription></DialogHeader><p className="rounded-lg border p-3 text-sm font-medium">{decisionTarget?.title || "وثيقة"}</p><p className="rounded-lg border p-3 text-sm text-muted-foreground">حالة مهمة المصدر: {taskStatusLabel(currentTaskStatus)}{currentTaskClaimedByReviewer ? " — مستلمة للمراجع الحالي" : " — يجب استلامها للمراجع الحالي قبل الحفظ"}</p>{currentTaskStatus === "open" ? <Button disabled={busy || !decisionTarget?.sourceTaskId} onClick={() => claim.mutate({ taskId: decisionTarget.sourceTaskId })}><ShieldCheck className="ml-2 h-4 w-4" />استلام مهمة التحقق من المصدر</Button> : null}<label className="text-sm font-medium">نوع القرار</label><select className="h-10 rounded-md border bg-background px-3 text-sm" value={decisionCode} onChange={(event) => setDecisionCode(event.target.value)}>{decisions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Input value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} placeholder="مرجع دليل مؤسسي أو رابط/رقم ملف قابل للمراجعة…" /><Input value={candidateUrl} onChange={(event) => setCandidateUrl(event.target.value)} placeholder="رابط المصدر المرشح (HTTPS عند تأكيد رسمي)" /><Input value={issuerName} onChange={(event) => setIssuerName(event.target.value)} placeholder="الجهة المصدرة المرشحة" /><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="ملاحظات وحدود القرار…" /><DialogFooter><Button variant="outline" onClick={() => setDecisionTarget(null)}>إلغاء</Button><Button disabled={busy || !currentTaskClaimedByReviewer || evidenceReference.trim().length < 5} onClick={submitDecision}><ShieldCheck className="ml-2 h-4 w-4" />تسجيل القرار</Button></DialogFooter></DialogContent></Dialog>
  </AdminPage>;
}
