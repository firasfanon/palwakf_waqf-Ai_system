import { ClipboardCheck, ShieldAlert } from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";

const pendingAuditItems = [
  { key: "CONTENT_CLASSIFICATION_PRECLAIM_UAT", detail: "فتح مهمة content_classification بحالة open قبل الاستلام وإثبات غياب أي نموذج قرار أو حفظ." },
  { key: "CITATION_VERIFICATION_PRECLAIM_UAT", detail: "فتح مهمة citation_verification بحالة open قبل الاستلام وإثبات غياب نموذج التوثيق القابل للحفظ." },
  { key: "GOVERNANCE_CENTER_SEPARATION_UAT", detail: "إثبات أن مركز الحوكمة مستقل عن مساحة العمل اليومية." },
  { key: "FULL_PAGE_INVENTORY_UAT", detail: "إكمال جرد الصفحات اليومية والحوكمية بعد صقل Mega Batch A." },
] as const;

export default function DeferredMegaBatchAAudit() {
  return (
    <AdminPage>
      <div className="space-y-2"><div className="flex items-center gap-2"><ClipboardCheck className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">سجل التدقيق المؤجل لـ Mega Batch A</h1></div><p className="text-sm leading-7 text-muted-foreground">سجل أدلة منفصل. لا يغير قبول Mega Batch A أو Mega Batch B، ولا يحتوي إجراءات تشغيل للمعرفة.</p></div>
      <AdminCard title="حالة السجل" description="يجب إغلاق هذه البنود قبل اعتماد Mega Batch B النهائي أو قبل الانتقال إلى Mega Batch C، أيهما أسبق.">
        <div className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" /><span>الدفعة A انتقلت بتفويض، لكن لم يعاد تصنيفها كقبول نهائي.</span></div>
      </AdminCard>
      <div className="space-y-3">
        {pendingAuditItems.map((item) => <AdminCard key={item.key} title={item.key} description={item.detail} headerRight={<Badge variant="outline">PENDING</Badge>} />)}
      </div>
    </AdminPage>
  );
}
