import { useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpen, Database, FileSearch, FolderOpen, ListChecks, Search, ShieldCheck, Sparkles } from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const workspaces = [
  {
    title: "المصادر الأصلية",
    description: "إدارة الجهات والروابط المرجعية التي تبنى عليها المعرفة.",
    href: "/admin/knowledge-sources",
    icon: Database,
    lifecycle: "مصدر → مرجع",
  },
  {
    title: "المراجع والملفات",
    description: "تنظيم الملفات والمراجع القابلة للربط والاقتباس.",
    href: "/admin/files",
    icon: FolderOpen,
    lifecycle: "مرجع قابل للاقتباس",
  },
  {
    title: "وثائق المعرفة",
    description: "إدارة المعرفة المشتقة والمنظمة قبل أي استخدام تشغيلي.",
    href: "/admin/knowledge",
    icon: BookOpen,
    lifecycle: "معرفة منظمة",
  },
  {
    title: "البحث والاستكشاف",
    description: "العثور على المعرفة والمراجع عبر مسار بحث يومي.",
    href: "/admin/knowledge-search",
    icon: Search,
    lifecycle: "اكتشاف واستخدام",
  },
  {
    title: "المراجعة البشرية",
    description: "استلام وتنفيذ إجراء مراجعة واحد مطابق للمرحلة فقط.",
    href: "/admin/knowledge-review-operations",
    icon: ListChecks,
    lifecycle: "مراجعة محكومة",
  },
  {
    title: "مخرجات الأدوات الذكية",
    description: "فرز المخرجات القابلة للمراجعة دون اعتبارها معرفة نهائية تلقائيًا.",
    href: "/admin/tools/output-intake",
    icon: Sparkles,
    lifecycle: "مخرج قابل للمراجعة",
  },
  {
    title: "مرشحو KB08B المحدودون",
    description: "عرض عينة العشرة المرشحة فقط؛ لا يوجد تطبيق Mapping من هذه الصفحة.",
    href: "/admin/kb08b-pilot",
    icon: ShieldCheck,
    lifecycle: "Pilot / no apply",
  },
] as const;

export default function KnowledgeOperationsWorkspace() {
  const [, navigate] = useLocation();
  const access = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReview = access.data?.canReview === true;
  const snapshot = trpc.knowledgeTrust.operationsSnapshot.useQuery(undefined, { enabled: canReview, retry: false });

  const summary = useMemo(() => ({
    sources: 10,
    references: snapshot.data?.pendingReferenceDocuments ?? 0,
    inReview: snapshot.data?.reviewOnlyKnowledgeDocuments ?? 0,
    mapping: snapshot.data?.needsMappingRows ?? 0,
  }), [snapshot.data]);

  return (
    <AdminPage className="knowledge-operations-workspace">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">مساحة العمل المعرفي</h1>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          نقطة العمل اليومية لدورة المعرفة: مصدر، مرجع، معرفة منظمة، مراجعة، ثم استخدام محكوم داخل المساعد.
          لا تعرض هذه الصفحة إعدادات النشر أو الأدلة أو الصلاحيات التفصيلية.
        </p>
      </div>

      {!access.isLoading && !canReview ? (
        <AdminCard title="الوصول التشغيلي غير متاح" description="هذه المساحة تتطلب نطاق assistant.review لقراءة مؤشرات العمل المعرفي.">
          <p className="text-sm text-muted-foreground">لا يتم تحميل طوابير المراجعة أو بيانات KB08B عند غياب النطاق.</p>
        </AdminCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="المصادر الأصلية"><div className="text-3xl font-bold">{summary.sources}</div><p className="mt-2 text-sm text-muted-foreground">سجل مصدر قائم في الجرد الحي.</p></AdminCard>
        <AdminCard title="مراجع قيد التحقق"><div className="text-3xl font-bold">{summary.references}</div><p className="mt-2 text-sm text-muted-foreground">تبقى خارج أي إطلاق تلقائي.</p></AdminCard>
        <AdminCard title="معرفة قيد المراجعة"><div className="text-3xl font-bold">{summary.inReview}</div><p className="mt-2 text-sm text-muted-foreground">تحتاج مسار مراجعة واعتماد.</p></AdminCard>
        <AdminCard title="KB08B بحاجة مطابقة"><div className="text-3xl font-bold">{summary.mapping}</div><p className="mt-2 text-sm text-muted-foreground">العينة الحالية مقيدة بعشرة سجلات فقط.</p></AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[1200px]:grid-cols-2 2xl:grid-cols-3">
        {workspaces.map((item) => {
          const Icon = item.icon;
          return (
            <AdminCard key={item.href} title={item.title} description={item.description}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Badge variant="outline" className="max-w-full whitespace-normal text-center">{item.lifecycle}</Badge>
                <Button className="w-full max-w-full justify-center whitespace-normal sm:w-auto" variant="outline" onClick={() => navigate(item.href)}>
                  فتح مساحة العمل <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                </Button>
              </div>
            </AdminCard>
          );
        })}
      </div>

      <AdminCard title="قاعدة التشغيل" description="ضابط ثابت داخل Mega Batch B.">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>لا تتحول مخرجات الأدوات إلى معرفة أو أهلية محادثة تلقائيًا.</li>
          <li>لا يجري KB08B أي Mapping أو Promotion من واجهة العينة.</li>
          <li>لا يكون الاعتماد الداخلي أو وجود السجل كافيًا لإطلاقه في المحادثة.</li>
        </ul>
      </AdminCard>
    </AdminPage>
  );
}
