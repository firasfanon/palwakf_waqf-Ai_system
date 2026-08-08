import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  FileSearch,
  Scale,
  TrendingUp,
  Target,
  AlertCircle,
  Sparkles,
  BookOpen,
  ShieldCheck,
  ClipboardList,
  Network,
  CheckCircle2,
  Clock3,
  Inbox,
  Workflow,
} from "lucide-react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { APP_ROUTES, getAdminToolRoute } from "@/lib/appRoutes";
import { formatArabicDateTime } from "@/lib/dateFormat";
import { hasAdminToolsAccess } from "@/lib/access";
import { trpc } from "@/lib/trpc";

function backendStatusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "degraded") return "destructive";
  if (status === "active_with_warnings") return "secondary";
  return "outline";
}


export default function AITools() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const metricsQuery = trpc.aiTools.getRunMetrics.useQuery(undefined, { enabled: !!user && hasAdminToolsAccess(user) });
  const activationQuery = trpc.aiTools.getBackendActivationSnapshot.useQuery(undefined, {
    enabled: !!user && hasAdminToolsAccess(user),
  });

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAdminToolsAccess(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى الأدوات الذكية</p>
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة للصفحة الرئيسية</Button>
      </div>
    );
  }

  const metrics = metricsQuery.data || {
    total: 0,
    byTool: {},
    byApproval: { pending: 0, approved: 0, rejected: 0 },
    byRunStatus: { completed: 0, failed: 0, draft: 0, archived: 0 },
  };
  const activationSnapshot = activationQuery.data;

  const tools = [
    {
      title: "التصنيف التلقائي",
      description: "تصنيف الوثائق والقضايا تلقائيًا حسب النوع والفئة مع حفظ التشغيل ومراجعة النتيجة.",
      icon: FileText,
      href: getAdminToolRoute("classify"),
      color: "text-blue-500",
      count: metrics.byTool?.classify || 0,
    },
    {
      title: "استخراج المعلومات",
      description: "استخراج الكيانات والمعطيات القانونية وربط الناتج مباشرة بمسار المعرفة.",
      icon: Search,
      href: getAdminToolRoute("extract"),
      color: "text-green-500",
      count: metrics.byTool?.extract || 0,
    },
    {
      title: "التلخيص الذكي",
      description: "تلخيص الوثائق الطويلة واستخراج النقاط الرئيسية والتوصيات التشغيلية.",
      icon: FileSearch,
      href: getAdminToolRoute("summarize"),
      color: "text-purple-500",
      count: metrics.byTool?.summarize || 0,
    },
    {
      title: "مقارنة الأحكام",
      description: "تحليل أوجه التشابه والاختلاف بين حكمين مع إمكانية حفظ الخلاصة معرفيًا.",
      icon: Scale,
      href: getAdminToolRoute("compare"),
      color: "text-orange-500",
      count: metrics.byTool?.compare || 0,
    },
    {
      title: "تحليل السوابق",
      description: "استخراج الاتجاهات والأنماط من السوابق وتحويلها إلى مسودة معرفة عند الحاجة.",
      icon: TrendingUp,
      href: getAdminToolRoute("precedents"),
      color: "text-pink-500",
      count: metrics.byTool?.precedents || 0,
    },
    {
      title: "توقع النتائج",
      description: "تقدير أولي لنتائج القضايا مع عوامل التأثير والفرص والمخاطر والتوصيات.",
      icon: Target,
      href: getAdminToolRoute("predict"),
      color: "text-red-500",
      count: metrics.byTool?.predict || 0,
    },
  ];

  const summaryCards = [
    {
      title: "إجمالي التشغيلات",
      value: metrics.total,
      description: "كل تشغيلات الأدوات الذكية المحفوظة سياديًا.",
      icon: Network,
    },
    {
      title: "بانتظار الاعتماد",
      value: metrics.byApproval?.pending || 0,
      description: "تشغيلات بحاجة إلى مراجعة واعتماد قبل الاعتماد المؤسسي.",
      icon: Clock3,
    },
    {
      title: "تشغيلات معتمدة",
      value: metrics.byApproval?.approved || 0,
      description: "نتائج اعتمدت وأصبحت صالحة كمرجع داخلي أو معرفة قابلة للربط.",
      icon: CheckCircle2,
    },
    {
      title: "دليل وتصنيف الصفحات",
      value: "جاهز",
      description: "تقرير فرز صفحات الإدارة لتحديد ما يعمل فعليًا وما يحتاج backend أو صلاحيات.",
      icon: ClipboardList,
      href: APP_ROUTES.adminPagesClassification,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        <Breadcrumbs items={[
          { label: "إدارة النظام", href: APP_ROUTES.adminDashboard },
          { label: "الأدوات الذكية" },
        ]} />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">مركز الأدوات الذكية</h1>
              <p className="text-muted-foreground mt-2">
                تشغيل الأدوات الست، متابعة نتائجها المحفوظة، ثم نقل المخرجات إلى المراجعة والربط المعرفي دون اعتماد تلقائي.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate(APP_ROUTES.adminToolsRuns)}>
              <ShieldCheck className="ml-2 h-4 w-4" />
              فتح سجل التشغيل والاعتماد
            </Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsGuide)}>
              <BookOpen className="ml-2 h-4 w-4" />
              دليل الاستخدام
            </Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsOutputIntake)}>
              <Inbox className="ml-2 h-4 w-4" />
              صندوق المخرجات
            </Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminKnowledgeWorkspace)}>
              <Workflow className="ml-2 h-4 w-4" />
              مساحة المعرفة
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className={card.href ? "cursor-pointer hover:border-primary/40" : ""} onClick={card.href ? () => navigate(card.href) : undefined}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  لوحة تفعيل Backend للأدوات
                </CardTitle>
                <CardDescription className="mt-2 leading-7">
                  هذه اللوحة تقرأ فعليًا من سجل التشغيلات والأحداث والروابط لتحديد إن كانت كل أداة مفعّلة سياديًا أو تحتاج دليل تشغيل/ربط معرفة/إغلاق أخطاء.
                </CardDescription>
              </div>
              {activationSnapshot?.generatedAt ? (
                <Badge variant="outline">آخر قراءة: {formatArabicDateTime(activationSnapshot.generatedAt)}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activationQuery.isLoading ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                جارٍ تحميل حالة backend للأدوات...
              </div>
            ) : activationQuery.error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-7 text-destructive">
                تعذر تحميل لوحة التفعيل: {activationQuery.error.message}
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-bold">{activationSnapshot?.totals?.active ?? 0}</div><p className="mt-1 text-sm text-muted-foreground">مفعلة سياديًا</p></div>
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-bold">{activationSnapshot?.totals?.activeWithWarnings ?? 0}</div><p className="mt-1 text-sm text-muted-foreground">مفعلة مع ملاحظات</p></div>
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-bold">{activationSnapshot?.totals?.pendingEvidence ?? 0}</div><p className="mt-1 text-sm text-muted-foreground">بانتظار دليل</p></div>
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-bold">{activationSnapshot?.totals?.degraded ?? 0}</div><p className="mt-1 text-sm text-muted-foreground">متعطلة/متدهورة</p></div>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {(activationSnapshot?.records || []).map((record: any) => (
                    <div key={record.toolKey} className="rounded-2xl border p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold">{record.toolLabel}</div>
                        <Badge variant={backendStatusVariant(record.backendStatus)}>{record.backendStatusLabel}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                        <div className="rounded-xl bg-accent/40 p-2"><div className="text-lg font-bold text-foreground">{record.completedRuns}</div>مكتملة</div>
                        <div className="rounded-xl bg-accent/40 p-2"><div className="text-lg font-bold text-foreground">{record.knowledgeLinks}</div>روابط معرفة</div>
                        <div className="rounded-xl bg-accent/40 p-2"><div className="text-lg font-bold text-foreground">{record.pendingReviewRuns}</div>مراجعة</div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{record.nextAction}</p>
                      {record.latestRunAt ? <p className="mt-2 text-xs text-muted-foreground">آخر تشغيل: {formatArabicDateTime(record.latestRunAt)}</p> : null}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.href}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => navigate(tool.href)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-accent ${tool.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                    </div>
                    <Badge variant="outline">{tool.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-7">{tool.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              قاعدة التشغيل الحالية
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-7 md:grid-cols-2">
            <p className="rounded-xl border bg-background/70 p-3">كل تشغيل يُحفظ في السجل السيادي مع أحداثه وروابطه قبل أي اعتماد.</p>
            <p className="rounded-xl border bg-background/70 p-3">المخرج المكتمل يبقى قابلًا للمراجعة ولا يصبح معرفة نهائية تلقائيًا.</p>
            <p className="rounded-xl border bg-background/70 p-3">الاعتماد الداخلي لا يفتح Chat أو النشر العام دون بوابات المصدر والاستشهاد.</p>
            <p className="rounded-xl border bg-background/70 p-3">صندوق المخرجات ومساحة المعرفة هما مسارا الاستلام والربط التشغيلي.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
