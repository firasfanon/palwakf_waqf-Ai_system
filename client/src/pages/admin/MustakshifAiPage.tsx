import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { APP_ROUTES } from "@/lib/appRoutes";

export default function MustakshifAiPage() {
  return (
    <main className="space-y-5" dir="rtl" aria-labelledby="mustakshif-title">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="mustakshif-title" className="text-2xl font-black text-foreground">
            مستكشف الأراضي + AI
          </h1>
          <StatusBadge tone="warning">مؤجل بقرار منتج</StatusBadge>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          هذا السطح ليس وظيفة مكتملة ولا placeholder محسوبًا ضمن القبول. جرى تأجيله صراحةً
          إلى مسار GIS/الأصول حتى يتوفر عقد البيانات والمكوّن الخرائطي المعتمد. لا ينفذ
          هذا السطح أي تحليل أو حفظ أو استنتاج تلقائي.
        </p>
      </header>

      <div className="ds-review-grid">
        <Card>
          <CardHeader>
            <CardTitle>المسار التشغيلي الحالي للأصول</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              إدارة العقارات الوقفية هي السطح الحالي للبيانات الإدارية المرتبطة بالأصل.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/properties">فتح إدارة العقارات</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المسار البحثي الحالي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              البحث في المصادر والمراجع والأدلة والتحقق البشري يستمر داخل مساحة العمل
              المعرفي المحكومة.
            </p>
            <Button asChild>
              <Link href={APP_ROUTES.adminKnowledgeWorkspace}>فتح مساحة العمل المعرفي</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>شروط إعادة فتح المستكشف</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pe-5 text-sm text-muted-foreground">
            <li>عقد GIS/الأصول المعتمد ومصدر الحقيقة المكاني.</li>
            <li>مكوّن خريطة معتمد ومتوافق مع RTL وإمكانية الوصول.</li>
            <li>ربط واضح بين الأصل والقطعة/الحوض والمصدر التاريخي أو القانوني.</li>
            <li>اختبارات صلاحية تمنع عرض البيانات الحساسة لغير المخولين.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
