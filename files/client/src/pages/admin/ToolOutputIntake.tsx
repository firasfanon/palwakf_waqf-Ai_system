import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Inbox, Loader2, Sparkles } from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const toolLabels: Record<string, string> = {
  extract: "استخراج",
  summarize: "تلخيص",
  classify: "تصنيف",
  compare: "مقارنة",
  precedents: "تحليل سوابق",
  predict: "توقع",
};

type IntakeBucket = "all" | "reviewable" | "approved_linkable" | "failed_diagnostic" | "pending_not_knowledge";

type ToolRunSummary = {
  id: string;
  tool_key: string;
  run_status: string;
  approval_status: string;
  title?: string | null;
  output_text?: string | null;
  error_message?: string | null;
};

function classifyBucket(run: any): Exclude<IntakeBucket, "all"> {
  if (run.run_status === "failed") return "failed_diagnostic";
  if (run.approval_status === "approved") return "approved_linkable";
  if (run.run_status === "completed") return "reviewable";
  return "pending_not_knowledge";
}

const bucketMeta: Record<Exclude<IntakeBucket, "all">, { label: string; description: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  reviewable: { label: "مكتمل قابل للمراجعة", description: "مخرج مكتمل لكنه لا يمثل معرفة نهائية.", variant: "secondary" },
  approved_linkable: { label: "معتمد قابل للربط", description: "يمكن فحص ربطه بسياق معرفة، دون إطلاق محادثة تلقائي.", variant: "default" },
  failed_diagnostic: { label: "فشل يحتاج تشخيصًا", description: "ليس مادة معرفة ولا مسار اعتماد.", variant: "destructive" },
  pending_not_knowledge: { label: "قيد الانتظار", description: "لا يجوز اعتباره معرفة أو تشغيلًا صالحًا.", variant: "outline" },
};

export default function ToolOutputIntake() {
  const [, navigate] = useLocation();
  const [bucket, setBucket] = useState<IntakeBucket>("all");
  const runs = trpc.aiTools.listRuns.useQuery({ limit: 100 }, { retry: false });

  const grouped = useMemo(() => {
    const all: ToolRunSummary[] = Array.isArray(runs.data)
      ? (runs.data as ToolRunSummary[])
      : [];
    const counts = all.reduce<Record<Exclude<IntakeBucket, "all">, number>>((acc, run) => {
      const key = classifyBucket(run);
      acc[key] += 1;
      return acc;
    }, { reviewable: 0, approved_linkable: 0, failed_diagnostic: 0, pending_not_knowledge: 0 });
    const shown = bucket === "all" ? all : all.filter((run) => classifyBucket(run) === bucket);
    return { all, counts, shown };
  }, [bucket, runs.data]);

  return (
    <AdminPage>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2"><Inbox className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">صندوق مخرجات الأدوات الذكية</h1></div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">فرز يومي لمخرجات الأدوات، مع فصل واضح بين التشغيل المكتمل، الاعتماد، الفشل، وإمكانية الربط. لا تنشئ هذه الصفحة وثيقة معرفة ولا تغير أهلية المحادثة.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(bucketMeta) as Array<Exclude<IntakeBucket, "all">>).map((key) => (
          <button key={key} type="button" className="text-right" onClick={() => setBucket(key)}>
            <AdminCard title={bucketMeta[key].label} description={bucketMeta[key].description} className={bucket === key ? "ring-2 ring-primary/30" : undefined}>
              <div className="text-3xl font-bold">{grouped.counts[key]}</div>
            </AdminCard>
          </button>
        ))}
      </div>

      <AdminCard title="قائمة الاستلام" description="انقر على تشغيل لفتحه في سجل التفاصيل الحالي؛ لا يوجد زر اعتماد أو إنشاء معرفة داخل هذا الصندوق.">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant={bucket === "all" ? "default" : "outline"} size="sm" onClick={() => setBucket("all")}>كل المخرجات ({grouped.all.length})</Button>
          {(Object.keys(bucketMeta) as Array<Exclude<IntakeBucket, "all">>).map((key) => <Button key={key} variant={bucket === key ? "default" : "outline"} size="sm" onClick={() => setBucket(key)}>{bucketMeta[key].label}</Button>)}
        </div>

        {runs.isLoading ? <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /></div> : null}
        {runs.error ? <div className="rounded-lg border border-destructive/40 p-4 text-sm text-muted-foreground">تعذر تحميل مخرجات الأدوات من المسار التشغيلي.</div> : null}
        {!runs.isLoading && !runs.error && grouped.shown.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد مخرجات ضمن هذا التصنيف.</div> : null}

        <div className="space-y-3">
          {grouped.shown.map((run) => {
            const state = classifyBucket(run);
            const meta = bucketMeta[state];
            return (
              <div key={run.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{toolLabels[run.tool_key] || run.tool_key}</Badge><Badge variant={meta.variant}>{meta.label}</Badge></div>
                    <div className="font-semibold">{run.title || "تشغيل بلا عنوان"}</div>
                    <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{run.output_text || run.error_message || "لا يوجد ملخص محفوظ للمخرج."}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/admin/tools/runs")}><Eye className="ml-2 h-4 w-4" />فتح السجل</Button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard title="قاعدة المعرفة" description="التصنيف هنا لا يبدل حالة أي سجل.">
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /><span>المعتمد يمكن فحص ربطه فقط، ولا يصبح Chat Eligible تلقائيًا.</span></div>
          <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>المعلق أو المكتمل غير المعتمد يبقى مخرجًا قابلًا للمراجعة.</span></div>
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" /><span>الفاشل مسار تشخيص، وليس مصدرًا أو مرجعًا أو معرفة.</span></div>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
