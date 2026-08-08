import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Users, KeyRound, Shield } from "lucide-react";

export default function Security() {
  const { data } = trpc.admin.operations.securitySnapshot.useQuery();
  const counts = data?.counts || { users: 0, roles: 0, permissions: 0, rolePermissions: 0 };

  return (
    <AdminPage>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold"><ShieldCheck className="h-8 w-8" />الأمان</h1>
        <p className="mt-2 text-muted-foreground">قراءة حالة الحراس والصلاحيات دون عرض أسرار أو مفاتيح حساسة.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <AdminCard title="المستخدمون"><div className="flex items-center gap-3"><Users className="h-5 w-5" /><span className="text-2xl font-bold">{counts.users}</span></div></AdminCard>
        <AdminCard title="الأدوار"><div className="flex items-center gap-3"><Shield className="h-5 w-5" /><span className="text-2xl font-bold">{counts.roles}</span></div></AdminCard>
        <AdminCard title="الصلاحيات"><div className="flex items-center gap-3"><KeyRound className="h-5 w-5" /><span className="text-2xl font-bold">{counts.permissions}</span></div></AdminCard>
        <AdminCard title="روابط الدور/الصلاحية"><span className="text-2xl font-bold">{counts.rolePermissions}</span></AdminCard>
      </div>

      <AdminCard title="حالة بوابات الجاهزية" description="قراءة DB/LLM ضمن Mega Batch 28 دون عرض أسرار تشغيلية">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Database Health</div>
            <div className="mt-2 flex items-center gap-2"><Badge variant={data?.health?.database?.available ? "default" : "outline"}>{data?.health?.database?.available ? "متصل" : "محجوب"}</Badge><span className="text-xs text-muted-foreground">{data?.health?.database?.provider || "database"}</span></div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Provider Health</div>
            <div className="mt-2 flex items-center gap-2"><Badge variant={data?.health?.llm?.available ? "default" : "outline"}>{data?.health?.llm?.available ? "متصل" : "غير متصل"}</Badge><span className="text-xs text-muted-foreground">{data?.health?.llm?.model || "غير محدد"}</span></div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="حراس الوصول الفعالة" description="مصادر الحماية المستخدمة في runtime">
        <div className="flex flex-wrap gap-2">
          {(data?.guards || []).map((guard: string) => <Badge key={guard} variant="outline">{guard}</Badge>)}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
