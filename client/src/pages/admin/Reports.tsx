import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatArabicDateTime } from "@/lib/dateFormat";
import { FileBarChart, Users, MessageSquare, BookOpen, Building2 } from "lucide-react";

export default function Reports() {
  const { data, isLoading } = trpc.reports.summary.useQuery();
  const { data: readiness } = trpc.health.readiness.useQuery(undefined, { refetchInterval: 30000 });
  const dashboard = data?.dashboard || {};
  const waqf = data?.waqf || {};

  return (
    <AdminPage>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold"><FileBarChart className="h-8 w-8" />التقارير</h1>
        <p className="mt-2 text-muted-foreground">ملخص backend موحد للتقارير الإدارية، دون توليد ملفات إنتاجية من الواجهة.</p>
      </div>

      <AdminCard title="حالة التقرير" description="reports.summary ضمن Mega Batch 27D + readiness gate ضمن Mega Batch 28">
        <div className="flex flex-wrap gap-2">
          <Badge>{isLoading ? "جاري القراءة" : "مرتبط"}</Badge>
          <Badge variant="outline">read-only summary</Badge>
          <Badge variant={readiness?.ready ? "default" : "outline"}>{readiness?.ready ? "Production-ready" : "Production blocked"}</Badge>
          <Badge variant="outline">DB: {readiness?.database ? "connected" : "fallback"}</Badge>
          <Badge variant="outline">LLM: {readiness?.llm ? "connected" : "fallback"}</Badge>
          {data?.generatedAt ? <Badge variant="outline">{formatArabicDateTime(data.generatedAt)}</Badge> : null}
        </div>
      </AdminCard>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <AdminCard title="المستخدمون"><div className="flex items-center gap-3"><Users className="h-5 w-5" /><span className="text-2xl font-bold">{dashboard.totalUsers || 0}</span></div></AdminCard>
        <AdminCard title="المحادثات"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5" /><span className="text-2xl font-bold">{dashboard.totalConversations || 0}</span></div></AdminCard>
        <AdminCard title="وثائق المعرفة"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5" /><span className="text-2xl font-bold">{dashboard.totalDocuments || 0}</span></div></AdminCard>
        <AdminCard title="الأصول/العقارات"><div className="flex items-center gap-3"><Building2 className="h-5 w-5" /><span className="text-2xl font-bold">{waqf.totalWaqfs || 0}</span></div></AdminCard>
      </div>
    </AdminPage>
  );
}
