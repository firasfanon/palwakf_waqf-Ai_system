import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, Rocket, ShieldCheck } from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { APP_ROUTES } from "@/lib/appRoutes";
import { toast } from "sonner";

const bucketMeta: Record<string, { label: string; detail: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  chat_eligible: { label: "متاح للاستخدام", detail: "وثيقة مكتملة الشروط وتدخل بوابة الاسترجاع المعتمدة.", tone: "default" },
  release_ready: { label: "جاهزة لقرار الاعتماد", detail: "المصدر والاستشهاد مكتملان؛ يلزم قرار publish بشري صريح.", tone: "secondary" },
  source_verification_required: { label: "يتطلب توثيق المصدر", detail: "ثبت الجهة والرابط القانوني قبل أي اعتماد.", tone: "outline" },
  citation_verification_required: { label: "يتطلب توثيق الاستشهاد", detail: "أضف محددًا واضحًا ومقتطفًا قابلًا للمراجعة.", tone: "outline" },
  mapping_required: { label: "يتطلب ربطًا سياديًا", detail: "اربط الوثيقة بالمرجع والمصدر الصحيحين؛ لا توجد مطابقة تلقائية.", tone: "destructive" },
  authority_alignment_required: { label: "يتطلب ضبط سلطة المصدر", detail: "لا يفتح الإنتاج قبل إثبات المصدر الرسمي أو إعادة تصنيف الوثيقة.", tone: "outline" },
  containment_required: { label: "يتطلب قرار احتواء", detail: "وثيقة اختبار أو تكرار أو حجر؛ تبقى خارج Chat.", tone: "destructive" },
};

function asArray<T = any>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
function numberValue(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? n : 0; }

export default function KnowledgeActivationCenter() {
  const [, navigate] = useLocation();
  const access = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReview = access.data?.canReview === true;
  const canPublish = access.data?.canPublish === true;
  const snapshot = trpc.knowledgeActivation.snapshot.useQuery(undefined, { enabled: canReview, retry: false });
  const items = trpc.knowledgeActivation.items.useQuery({ limit: 60 }, { enabled: canReview && Boolean(snapshot.data?.latestRunId), retry: false });
  const [releaseTarget, setReleaseTarget] = useState<any | null>(null);
  const [releaseNotes, setReleaseNotes] = useState("");

  const runAudit = trpc.knowledgeActivation.runFullAudit.useMutation({
    onSuccess: () => {
      toast.success("اكتمل تدقيق corpus المعرفي وتم تحديث طوابير المراجعة.");
      snapshot.refetch();
      items.refetch();
    },
    onError: (error) => toast.error(error.message || "تعذر تنفيذ التدقيق الشامل."),
  });

  const release = trpc.knowledgeActivation.releaseCandidate.useMutation({
    onSuccess: () => {
      toast.success("تم تحرير الوثيقة المعتمدة ضمن بوابة المعرفة الرسمية.");
      setReleaseTarget(null);
      setReleaseNotes("");
      snapshot.refetch();
      items.refetch();
    },
    onError: (error) => toast.error(error.message || "تعذر تحرير الوثيقة. تحقق من شروط المصدر والاستشهاد والصلاحية."),
  });

  const counts = useMemo(() => ({
    total: numberValue(snapshot.data?.summary?.total_documents),
    ready: numberValue(snapshot.data?.summary?.release_ready),
    usable: numberValue(snapshot.data?.summary?.chat_eligible),
    review: numberValue(snapshot.data?.summary?.review_required),
  }), [snapshot.data]);

  const visibleItems = asArray<any>(items.data?.items);
  const releaseItems = visibleItems.filter((item) => item.lifecycle_bucket === "release_ready");
  const busy = runAudit.isPending || release.isPending;

  if (access.isLoading) return <AdminPage><div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-3 text-sm text-muted-foreground">جارٍ التحقق من صلاحية التشغيل…</p></div></AdminPage>;

  if (!canReview) return <AdminPage><AdminCard title="الوصول غير متاح" description="يتطلب مركز التفعيل نطاق assistant.review لقراءة تدقيق المعرفة."><p className="text-sm text-muted-foreground">لا يتم عرض corpus أو قرارات الاعتماد عند غياب النطاق.</p></AdminCard></AdminPage>;

  return (
    <AdminPage className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Rocket className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">تفعيل المعرفة والإنتاجية</h1></div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">مسار واحد لتدقيق كل المعرفة الموجودة، فرز فجواتها، مراجعتها، ثم تحرير corpus المستوفي لشروط المصدر والاستشهاد والاعتماد.</p>
          </div>
          <Button size="lg" disabled={busy} onClick={() => runAudit.mutate({ note: "operator-triggered-full-corpus-audit" })}>
            {runAudit.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="ml-2 h-4 w-4" />}
            بدء تدقيق شامل للمعرفة الموجودة
          </Button>
        </div>
      </section>

      {snapshot.isError ? <AdminCard title="طبقة التفعيل غير متاحة" description="تعذر قراءة طبقة التفعيل الحالية. لا تشغّل تدقيقًا أو قرار اعتماد قبل استعادة الاتصال والتحقق من الصلاحيات."><p className="text-sm text-muted-foreground">{snapshot.error.message}</p></AdminCard> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="إجمالي وثائق المعرفة"><div className="text-3xl font-bold">{counts.total || "—"}</div><p className="mt-2 text-sm text-muted-foreground">يشمل كامل corpus في آخر تدقيق.</p></AdminCard>
        <AdminCard title="جاهزة لقرار الاعتماد"><div className="text-3xl font-bold">{counts.ready || 0}</div><p className="mt-2 text-sm text-muted-foreground">لا تحتاج مصدرًا أو استشهادًا جديدًا؛ تحتاج قرار publish.</p></AdminCard>
        <AdminCard title="متاحة ضمن البوابة"><div className="text-3xl font-bold">{counts.usable || 0}</div><p className="mt-2 text-sm text-muted-foreground">معرفة مكتملة الشروط للقراءة المعتمدة.</p></AdminCard>
        <AdminCard title="تحتاج معالجة"><div className="text-3xl font-bold">{counts.review || 0}</div><p className="mt-2 text-sm text-muted-foreground">توزع تلقائيًا على المصدر أو الاستشهاد أو الربط أو الاحتواء.</p></AdminCard>
      </section>

      <AdminCard title="قرار العمل الحالي" description="لا توجد حاجة للتخمين أو التنقل بين طبقات متفرقة.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-7 text-muted-foreground">ابدأ التدقيق مرة واحدة. بعده افتح طابور المراجعة للوثائق المحجوبة، أو حرر وثيقة من قائمة الجاهزين عند توافر صلاحية النشر.</p>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigate(APP_ROUTES.adminKnowledgeReviewOperations)}>فتح طابور المراجعة <ArrowLeft className="mr-2 h-4 w-4" /></Button><Button variant="outline" onClick={() => navigate(APP_ROUTES.adminSourceProvenanceRights)}>سجل المصدر والحقوق <ArrowLeft className="mr-2 h-4 w-4" /></Button></div>
        </div>
      </AdminCard>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminCard title="مرشحو قرار الاعتماد" description="لا يظهر هذا القسم إلا للوثائق التي استوفت المصدر والاستشهاد والحالة الآمنة.">
          {releaseItems.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد وثيقة جاهزة لقرار اعتماد في آخر تدقيق.</p> : <div className="space-y-3">{releaseItems.map((item) => <div key={item.knowledge_document_id} className="rounded-xl border p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.title || "وثيقة بلا عنوان"}</p><p className="text-xs text-muted-foreground">{item.reference_title || "مرجع منظم"}</p></div>{canPublish ? <Button size="sm" onClick={() => setReleaseTarget(item)}><CheckCircle2 className="ml-2 h-4 w-4" />قرار الاعتماد</Button> : <Badge variant="outline">يتطلب assistant.publish</Badge>}</div></div>)}</div>}
        </AdminCard>
        <AdminCard title="فجوات corpus" description="كل وثيقة تظهر في bucket واحد واضح؛ لا يوجد قبول صامت أو نشر تلقائي.">
          {visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">شغّل التدقيق أو انتظر تحميل آخر snapshot.</p> : <div className="space-y-3">{visibleItems.slice(0, 12).map((item) => { const meta = bucketMeta[item.lifecycle_bucket] || { label: item.lifecycle_bucket, detail: "راجع سجل التدقيق.", tone: "outline" as const }; return <div key={item.id || item.knowledge_document_id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.title || "وثيقة بلا عنوان"}</p><p className="mt-1 text-xs text-muted-foreground">{meta.detail}</p></div><Badge variant={meta.tone}>{meta.label}</Badge></div></div>; })}</div>}
        </AdminCard>
      </section>

      <Dialog open={Boolean(releaseTarget)} onOpenChange={(open) => { if (!open) { setReleaseTarget(null); setReleaseNotes(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>اعتماد وإطلاق وثيقة معرفة</DialogTitle><DialogDescription>هذا القرار يمر عبر بوابة المصدر الرسمي والاستشهاد الموثق. لا يمكن تجاوزها.</DialogDescription></DialogHeader>
          <p className="rounded-lg border p-3 text-sm font-medium">{releaseTarget?.title}</p>
          <Textarea value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} placeholder="سبب الاعتماد وحدود الاستخدام ومصدر القرار…" />
          <DialogFooter><Button variant="outline" onClick={() => setReleaseTarget(null)}>إلغاء</Button><Button disabled={releaseNotes.trim().length < 5 || busy} onClick={() => release.mutate({ knowledgeDocumentId: releaseTarget.knowledge_document_id, releaseNotes: releaseNotes.trim() })}><ShieldCheck className="ml-2 h-4 w-4" />اعتماد وإطلاق</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
