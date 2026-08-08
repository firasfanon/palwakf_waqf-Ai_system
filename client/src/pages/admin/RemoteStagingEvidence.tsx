import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import AdminPage from '@/components/admin/ui/AdminPage';
import AdminCard from '@/components/admin/ui/AdminCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type StagingEvidence = {
  contract: string;
  generatedAt: string;
  environment: string;
  deployment: { deploymentRef: string; baselineId: string };
  health: {
    server: boolean;
    database: boolean;
    llm: boolean;
    ready: boolean;
    supabase: { available: boolean; mode: string; latencyMs: number | null; provider: string; probe: { schema: string; table: string } | null };
    databaseConfig: { configured: boolean; provider: string; dialect: string; runtimeCompatible: boolean };
  };
  gate: { readyForBrowserUat: boolean; decision: string; blockers: string[]; productionApproved: false; productionDecision: string };
};

export default function RemoteStagingEvidence() {
  const [data, setData] = useState<StagingEvidence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health/staging-evidence', { cache: 'no-store', headers: { accept: 'application/json' } });
      const payload = await response.json() as StagingEvidence;
      setData(payload);
      if (!response.ok) setError(payload?.gate?.decision || `HTTP ${response.status}`);
    } catch (cause: any) {
      setError(cause?.message || 'staging_evidence_fetch_failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const healthRows = data ? [
    ['الخادم', data.health.server],
    ['قاعدة البيانات', data.health.database],
    ['المزوّد اللغوي', data.health.llm],
    ['Supabase', data.health.supabase.available],
    ['جاهزية Browser UAT', data.gate.readyForBrowserUat],
  ] : [];

  return <AdminPage>
    <div dir="rtl" className="space-y-2">
      <div className="flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">أدلة Staging وRBAC/RLS</h1></div>
      <p className="text-sm text-muted-foreground">لقطة قراءة فقط لـ Mega Batch 29A. لا تعتمد الإنتاج؛ وظيفتها توثيق جاهزية staging قبل اختبار المتصفح والأدوار وRLS.</p>
    </div>

    <div className="mt-5 flex items-center justify-between gap-3"><Badge variant={data?.gate.readyForBrowserUat ? 'secondary' : 'outline'}>{data?.gate.decision || (loading ? 'جارٍ التحميل' : 'لا توجد لقطة')}</Badge><Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw className="ml-2 h-4 w-4" />تحديث اللقطة</Button></div>

    {loading && <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /></div>}
    {!loading && error && <div className="mt-5 rounded-lg border border-destructive/40 p-4 text-sm"><div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-destructive" />بوابة staging غير مكتملة</div><p className="mt-2 text-muted-foreground">{error}</p>{data?.gate.blockers?.length ? <ul className="mt-3 list-disc pr-5 text-muted-foreground">{data.gate.blockers.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>}

    {data && <>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">{healthRows.map(([label, pass]: any) => <AdminCard key={label} title={label}><div className="flex items-center justify-between"><span className="text-lg font-bold">{pass ? 'PASS' : 'BLOCKED'}</span>{pass ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}</div></AdminCard>)}</div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AdminCard title="هوية النشر" description="قيم server-side آمنة؛ لا تشمل أسرارًا أو مفاتيحًا."><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt>البيئة</dt><dd className="font-mono">{data.environment}</dd></div><div className="flex justify-between gap-4"><dt>مرجع النشر</dt><dd className="font-mono">{data.deployment.deploymentRef}</dd></div><div className="flex justify-between gap-4"><dt>Baseline</dt><dd className="font-mono text-xs">{data.deployment.baselineId}</dd></div><div className="flex justify-between gap-4"><dt>وقت اللقطة</dt><dd className="font-mono text-xs">{data.generatedAt}</dd></div></dl></AdminCard>
        <AdminCard title="مسار الإثبات التالي" description="التقاط هذه الصفحة لا يغني عن UAT الأدوار."><ol className="list-decimal space-y-2 pr-5 text-sm text-muted-foreground"><li>التقط JSON الخام من <code>/api/health/staging-evidence</code>.</li><li>اختبر حساب admin وحساب بلا <code>assistant.review</code> على مركز عمليات المعرفة.</li><li>تحقق من رفض القراءة/الكتابة المباشرة لـ <code>assistant.knowledge_review_tasks</code> من المتصفح.</li><li>افحص Network/Storage للتأكد من عدم ظهور service-role key.</li></ol></AdminCard>
      </div>
      <div className="mt-5 rounded-lg border p-4 text-sm text-muted-foreground"><div className="flex items-center gap-2 font-medium text-foreground"><Activity className="h-4 w-4" />قرار الإنتاج</div><p className="mt-2 font-mono text-xs">{data.gate.productionDecision}</p></div>
    </>}
  </AdminPage>;
}
