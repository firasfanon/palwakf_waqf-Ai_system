import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const PILOT_MATRIX = [
  { id: "00a4db6c-e1e9-4f5e-a812-f79dcddc2056", title: "حارة المغاربة - الهدم", decision: "defer", reason: "يتطلب تحقق المصدر والهوية وفحص التكرار قبل أي إدخال." },
  { id: "016d0efa-9eaf-4b9d-ac05-b54c469c118d", title: "Minimal Test Document", decision: "quarantine", reason: "سجل اختبار غير ذي سلطة معرفية." },
  { id: "03bbdcee-38fa-475e-8e65-c07acaa9dc17", title: "اختبار timestamp", decision: "quarantine", reason: "سجل اختبار أو تشغيل وليس محتوى معرفيًا." },
  { id: "057e89eb-0404-4eac-a993-6d4d01bf3f6d", title: "قانون الأراضي العثماني - المادة 3", decision: "defer", reason: "صف مراقب فقط؛ يحتاج أصلًا مرجعيًا كاملًا قبل التنظيم." },
  { id: "05eab4ba-75fc-4dfc-b23d-9cdf7b76bfdb", title: "المجلس الإسلامي الأعلى - الصلاحيات", decision: "defer", reason: "يحتاج تحقق المصدر والهوية وإعادة تصنيف." },
  { id: "064bffa4-d5e9-4ecc-a462-2d2738212396", title: "المغني - ابن قدامة المقدسي", decision: "defer", reason: "يوجد مانع صريح: مصدر مفقود." },
  { id: "0662a525-4fa8-46dd-a0e6-ef3a0146c16e", title: "وقف خاصكي سلطان", decision: "defer", reason: "مرجع داعم يحتاج أصلًا أو ملفًا موثقًا." },
  { id: "0860bc81-7266-418c-a091-72e3992375b9", title: "نظام الأوقاف في التطبيق المعاصر", decision: "defer", reason: "ذو أهمية إدارية ووقفية لكنه بلا مصدر محدد." },
  { id: "0a4ee6fa-c98e-4e3e-ac25-831afecac5fa", title: "Minimal Test Document", decision: "quarantine", reason: "سجل اختبار مكرر من صف مراقب." },
  { id: "0b6f8534-0661-47b3-af64-f9776c4c04fc", title: "الفقه الحنفي - وقف المنقول", decision: "promote_review", reason: "مرشح مشروط لمراجعة مرجعية فقط بعد إثبات المصدر وفحص التكرار." },
] as const;

const decisionLabel: Record<string, string> = {
  map_existing: "مطابقة بسجل قائم",
  promote_review: "ترقية مشروطة إلى مراجعة",
  defer: "تأجيل محكوم",
  quarantine: "عزل",
};

function decisionVariant(decision: string): "default" | "secondary" | "destructive" | "outline" {
  if (decision === "promote_review") return "secondary";
  if (decision === "quarantine") return "destructive";
  return "outline";
}

export default function KB08BPilotCandidate() {
  const access = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReview = access.data?.canReview === true;
  const queue = trpc.knowledgeTrust.mappingQueue.useQuery({ limit: 500, offset: 0 }, { enabled: canReview, retry: false });

  const rows = useMemo(() => {
    const byId = new Map<string, any>((queue.data?.results || []).map((row: any) => [String(row.id), row]));
    return PILOT_MATRIX.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      live: byId.get(candidate.id) || null,
    }));
  }, [queue.data]);

  return (
    <AdminPage>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">مرشحو KB08B المحدودون</h1></div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          عينة فحص من عشرة سجلات محددة بالمعرّف. القرارات أدناه مرشحة للمراجعة فقط ولا تنفذ مطابقة أو ترقية أو إنشاءًا أو حذفًا.
        </p>
      </div>

      <AdminCard title="حالة المسار" description="هذه الواجهة قراءة فقط ضمن Candidate Mega Batch B.">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">10 سجلات فقط</Badge>
          <Badge variant="outline">لا تطبيق Mapping</Badge>
          <Badge variant="outline">لا ترقية تلقائية</Badge>
          <Badge variant="outline">لا أهلية محادثة</Badge>
        </div>
      </AdminCard>

      {!access.isLoading && !canReview ? (
        <AdminCard title="الوصول التشغيلي غير متاح"><p className="text-sm text-muted-foreground">تتطلب قراءة طابور KB08B نطاق assistant.review.</p></AdminCard>
      ) : null}

      {queue.error ? <AdminCard title="تعذر قراءة حالة العينة"><p className="text-sm text-muted-foreground">يظل القرار المرشح معروضًا، لكن التحقق الحي من السجل غير متاح الآن.</p></AdminCard> : null}

      <div className="space-y-3" data-kb08b-pilot-read-only="true">
        {rows.map((row) => (
          <AdminCard key={row.id} title={`${row.rank}. ${row.title}`} description={row.reason}>
            <div className="grid gap-3 text-sm md:grid-cols-[auto_1fr_auto] md:items-center">
              <Badge variant={decisionVariant(row.decision)}>{decisionLabel[row.decision]}</Badge>
              <div className="min-w-0 space-y-1 text-muted-foreground">
                <div className="break-all font-mono text-xs">{row.id}</div>
                <div>{row.live ? "السجل موجود حاليًا في طابور needs_mapping." : queue.isLoading ? "جارٍ التحقق من الطابور." : "لم يظهر السجل في قراءة الطابور الحالية."}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {row.live ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                <span>{row.live?.migration_status || "read-only"}</span>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard title="قيد إلزامي" description="يمنع هذا Candidate تحويل القرار المرشح إلى معاملة قاعدة بيانات.">
        <div className="flex items-start gap-2 text-sm text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" /><span>حتى قرار <strong>promote_review</strong> للسجل العاشر لا يُطبق قبل اعتماد منفصل وحزمة دليل لاحقة.</span></div>
      </AdminCard>
    </AdminPage>
  );
}
