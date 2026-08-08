import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatArabicDateTime } from "@/lib/dateFormat";
import { FileSearch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuditLogs() {
  const { data, isLoading, refetch } = trpc.admin.operations.auditSnapshot.useQuery();
  const activities = data?.activities || [];

  return (
    <AdminPage>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FileSearch className="h-8 w-8" />
            سجلات التدقيق
          </h1>
          <p className="mt-2 text-muted-foreground">قراءة فعلية لأحدث أنشطة النظام من مصادر تشغيلية داخلية.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="ml-2 h-4 w-4" /> تحديث
        </Button>
      </div>

      <AdminCard title="حالة backend" description="Audit Snapshot ضمن Mega Batch 27D">
        <div className="flex flex-wrap gap-2">
          <Badge>{data?.status || "connected"}</Badge>
          {(data?.sources || []).map((source: string) => <Badge key={source} variant="outline">{source}</Badge>)}
        </div>
      </AdminCard>

      <AdminCard title="آخر الأنشطة" description={`عدد السجلات المعروضة: ${activities.length}`}>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">لا توجد أنشطة مسجلة حاليًا.</div>
          ) : activities.map((item: any) => (
            <div key={`${item.type}-${item.id}`} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{item.title}</div>
                <Badge variant="outline">{item.type}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{item.userName || "النظام"} · {formatArabicDateTime(item.createdAt, "بدون تاريخ")}</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
