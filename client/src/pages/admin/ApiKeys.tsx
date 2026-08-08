import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Key, ShieldCheck } from "lucide-react";

export default function ApiKeys() {
  const { data } = trpc.admin.operations.apiKeysSnapshot.useQuery();
  const providers = data?.providers || [];

  return (
    <AdminPage>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold"><Key className="h-8 w-8" />مفاتيح API</h1>
        <p className="mt-2 text-muted-foreground">فحص metadata فقط لحالة المفاتيح؛ لا يتم عرض أي قيمة سرية في الواجهة.</p>
      </div>

      <AdminCard title="سياسة الأسرار" description={data?.mode || "read_metadata_only_no_secret_values"}>
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /><span>الأسرار المعروضة: {data?.exposedSecrets ?? 0}</span></div>
      </AdminCard>

      <AdminCard title="المزوّدون" description="قراءة حالة الإعداد فقط">
        <div className="space-y-3">
          {providers.map((provider: any) => (
            <div key={provider.key} className="flex items-center justify-between rounded-xl border p-4">
              <div className="font-semibold">{provider.key}</div>
              <Badge variant={provider.configured ? "default" : "outline"}>{provider.configured ? "مهيأ" : "غير مهيأ"}</Badge>
            </div>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
