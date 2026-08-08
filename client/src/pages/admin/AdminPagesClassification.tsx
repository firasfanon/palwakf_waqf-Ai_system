import { APP_ROUTES } from "@/lib/appRoutes";
import { adminPageClassificationRecords, type AdminPageClassificationRecord } from "@/config/adminRegistryV2";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Layers3, Link2, ShieldAlert, DatabaseZap } from "lucide-react";
import { trpc } from "@/lib/trpc";

const lifecycleLabelMap: Record<AdminPageClassificationRecord["lifecycle"], string> = {
  operational: "تعمل فعليًا",
  empty_state_ready: "جاهزة مع Empty State",
  backend_pending: "تحتاج Backend",
  stub_page: "واجهة Placeholder",
  access_restricted: "مقيدة بصلاحيات",
};

const dataStateLabelMap: Record<AdminPageClassificationRecord["dataState"], string> = {
  connected: "مرتبطة",
  empty: "فارغة آمنة",
  pending_backend: "بانتظار ربط",
  static_stub: "ثابتة/Stub",
  restricted: "محجوبة",
};

const lifecycleVariantMap: Record<AdminPageClassificationRecord["lifecycle"], "default" | "secondary" | "destructive" | "outline"> = {
  operational: "default",
  empty_state_ready: "secondary",
  backend_pending: "outline",
  stub_page: "outline",
  access_restricted: "destructive",
};

export default function AdminPagesClassification() {
  const backendSnapshotQuery = trpc.admin.backendActivationSnapshot.useQuery();
  const backendRecords = (backendSnapshotQuery.data?.records || []) as Array<{
    href: string;
    operation: string;
    backendRoute: string;
  }>;
  const backendByHref = new Map<string, { href: string; operation: string; backendRoute: string }>(
    backendRecords.map((record) => [record.href, record])
  );

  const grouped = adminPageClassificationRecords.reduce<Record<string, AdminPageClassificationRecord[]>>((acc, item) => {
    acc[item.sectionTitle] = acc[item.sectionTitle] || [];
    acc[item.sectionTitle].push(item);
    return acc;
  }, {});

  const totals = adminPageClassificationRecords.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.lifecycle] += 1;
      return acc;
    },
    {
      total: 0,
      operational: 0,
      empty_state_ready: 0,
      backend_pending: 0,
      stub_page: 0,
      access_restricted: 0,
    }
  );

  const summaryCards = [
    {
      title: "صفحات عاملة",
      value: totals.operational,
      description: "مسارات مستقرة وظيفيًا وتفتح بدون crash.",
      icon: ClipboardCheck,
    },
    {
      title: "تحتاج Backend",
      value: totals.backend_pending,
      description: "واجهات موجودة لكن ربطها البياني أو العملياتي لم يُغلق بعد.",
      icon: Link2,
    },
    {
      title: "واجهات Placeholder أو محجوبة",
      value: totals.stub_page + totals.access_restricted,
      description: "إما صفحات stub أو مسارات ما زالت تحتاج توحيد صلاحيات.",
      icon: ShieldAlert,
    },
    {
      title: "إجمالي الصفحات المفروزة",
      value: totals.total,
      description: "ناتج Pass 24 لتوضيح خارطة الإدارة قبل أي توسع إضافي.",
      icon: Layers3,
    },
    {
      title: "Backend مفعّل",
      value: backendRecords.length,
      description: "صفحات أُغلقت لها endpoints فعلية ضمن Mega Batch 27B و27D.",
      icon: DatabaseZap,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumbs items={[
          { label: "لوحة الإدارة", href: APP_ROUTES.adminDashboard },
          { label: "التقارير والتحليلات", href: "/admin/reports" },
          { label: "تصنيف صفحات الإدارة" },
        ]} />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">تصنيف صفحات الإدارة</h1>
          <p className="text-muted-foreground leading-7">
            لوحة فرز تشغيلية توضّح ما الذي يعمل فعليًا، وما الذي يعرض Empty State آمنًا، وما الذي ما زال يحتاج backend أو توحيد صلاحيات.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
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
            <CardTitle>منهجية التصنيف</CardTitle>
            <CardDescription>
              هذا التصنيف ليس شكليًا. الغرض منه منع اعتبار الصفحة منجزة لمجرد أنها تفتح، وتمييز الصفحات المرتبطة فعليًا عن الصفحات placeholder أو الصفحات التي ما زالت مقيدة أو تنتظر backend.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-5">
          {Object.entries(grouped).map(([sectionTitle, records]) => (
            <Card key={sectionTitle}>
              <CardHeader>
                <CardTitle>{sectionTitle}</CardTitle>
                <CardDescription>
                  عدد الصفحات في هذا القسم: {records.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {records.map((record) => (
                  <div key={record.href} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{record.title}</h3>
                          <Badge variant={lifecycleVariantMap[record.lifecycle]}>{lifecycleLabelMap[record.lifecycle]}</Badge>
                          <Badge variant="outline">{dataStateLabelMap[record.dataState]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{record.href}</p>
                        <p className="text-sm leading-7">{record.note}</p>
                        {backendByHref.has(record.href) ? (
                          <div className="mt-3 rounded-xl border bg-primary/5 p-3 text-sm leading-7">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="default">Backend 27B/27D</Badge>
                              <Badge variant="outline">{backendByHref.get(record.href)?.operation}</Badge>
                            </div>
                            <p className="mt-2 text-muted-foreground">{backendByHref.get(record.href)?.backendRoute}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
