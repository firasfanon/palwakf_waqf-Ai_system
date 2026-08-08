import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Database, HardDrive, RefreshCw, CheckCircle, Clock, Server, AlertCircle } from "lucide-react";

function formatUptime(seconds?: number) {
  const s = Number(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h} ساعة ${m} دقيقة`;
}

export default function Maintenance() {
  const { data, isLoading, refetch } = trpc.admin.operations.maintenanceSnapshot.useQuery();
  const cacheMetrics = data?.cache?.metrics || { totalCached: 0, totalHits: 0, avgRating: 0 };

  return (
    <AdminPage>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">صيانة النظام</h1>
          <p className="mt-2 text-muted-foreground">قراءة تشغيلية آمنة لحالة الخادم وقاعدة البيانات والذاكرة المؤقتة.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="ml-2 h-4 w-4" /> تحديث
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <AdminCard title="حالة الخادم">
          <div className="flex items-center gap-3"><Server className="h-6 w-6" /><div><Badge>{data?.server?.running ? "يعمل" : "غير معروف"}</Badge><p className="mt-2 text-sm text-muted-foreground">{data?.server?.environment || "development"}</p></div></div>
        </AdminCard>
        <AdminCard title="قاعدة البيانات">
          <div className="space-y-2">
            <div className="flex items-center gap-3">{data?.database?.available ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}<Badge variant={data?.database?.available ? "default" : "outline"}>{data?.database?.available ? "متصلة" : "غير متاحة"}</Badge></div>
            <p className="text-xs text-muted-foreground">{data?.database?.provider || "database"}{data?.database?.latencyMs != null ? ` · ${data.database.latencyMs}ms` : ""}</p>
          </div>
        </AdminCard>
        <AdminCard title="مزود الذكاء">
          <div className="space-y-2">
            <div className="flex items-center gap-3">{data?.llm?.available ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}<Badge variant={data?.llm?.available ? "default" : "outline"}>{data?.llm?.available ? "متصل" : "غير متصل"}</Badge></div>
            <p className="text-xs text-muted-foreground">{data?.llm?.provider || "llm"} · {data?.llm?.model || "غير محدد"}</p>
          </div>
        </AdminCard>
        <AdminCard title="وقت التشغيل">
          <div className="flex items-center gap-3"><Clock className="h-6 w-6" /><span className="font-semibold">{formatUptime(data?.server?.uptimeSeconds)}</span></div>
        </AdminCard>
      </div>

      <AdminCard title="ذاكرة التخزين المؤقت" description="قراءة من backend دون عمليات حذف تلقائية من الواجهة">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4"><div className="text-sm text-muted-foreground">إجمالي المحفوظ</div><div className="text-2xl font-bold">{cacheMetrics.totalCached}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-muted-foreground">إجمالي الاستخدام</div><div className="text-2xl font-bold">{cacheMetrics.totalHits}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-muted-foreground">متوسط التقييم</div><div className="text-2xl font-bold">{Number(cacheMetrics.avgRating || 0).toFixed(1)}</div></div>
        </div>
      </AdminCard>

      <AdminCard title="إجراءات الصيانة" description="الإجراءات الحساسة تُحوّل إلى manifest أو snapshot بدل dump/restore هدّام">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled><HardDrive className="ml-2 h-4 w-4" /> تحسين قاعدة البيانات — يتطلب اعتماد إنتاجي</Button>
          <Button variant="outline" disabled><Database className="ml-2 h-4 w-4" /> تنظيف شامل — محجوب حوكميًا</Button>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
