import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Link2, Database, ShieldCheck, Building2, Landmark, FolderTree } from "lucide-react";

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? "default" : "destructive"} className="rounded-full px-3 py-1">
      {ok ? "متصل" : "غير متصل"}
    </Badge>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function JsonCell({ value }: { value: unknown }) {
  if (value == null || value === "") return <span className="text-muted-foreground">—</span>;
  return <span className="break-words">{String(value)}</span>;
}

export default function PlatformBridgePage() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(20);

  const filters = useMemo(() => ({ search: search.trim() || undefined, limit }), [search, limit]);

  const { data: status, isLoading: statusLoading } = trpc.platformBridge.status.useQuery();
  const { data: connectivity, isLoading: connectivityLoading } = trpc.platformBridge.connectivity.useQuery();
  const { data: matrix, isLoading: matrixLoading } = trpc.platformBridge.sourceOfTruthMatrix.useQuery();

  const { data: adminUsers, isLoading: adminUsersLoading } = trpc.platformBridge.adminUsers.useQuery(filters);
  const { data: orgUnits, isLoading: orgUnitsLoading } = trpc.platformBridge.orgUnits.useQuery(filters);
  const { data: waqfAssets, isLoading: waqfAssetsLoading } = trpc.platformBridge.waqfAssets.useQuery(filters);
  const { data: endowments, isLoading: endowmentsLoading } = trpc.platformBridge.endowments.useQuery(filters);

  const isLoading = statusLoading || connectivityLoading || matrixLoading;

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">جسر المنصة — قراءة سيادية فقط</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            معاينة اتصال المشروع بكيانات PalWakf السيادية دون أي كتابة أو cutover.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث سريع في البيانات المطَبَّعة" />
          <Input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Math.min(Math.max(Number(e.target.value || 20), 1), 100))}
            placeholder="الحد"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Link2 className="h-4 w-4" /> حالة الجسر</CardTitle>
            <CardDescription>التكوين العام وإتاحة الربط</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="flex items-center justify-between"><span>مفعّل</span><StatusBadge ok={Boolean(status?.enabled)} /></div>
                <div className="flex items-center justify-between"><span>مهيأ</span><StatusBadge ok={Boolean(status?.configured)} /></div>
                <div className="flex items-center justify-between"><span>وضع صارم</span><StatusBadge ok={Boolean(status?.strict)} /></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4" /> الاتصال</CardTitle>
            <CardDescription>فحص القراءة من المصدر السيادي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {connectivityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="flex items-center justify-between"><span>الحالة</span><StatusBadge ok={Boolean(connectivity?.ok)} /></div>
                <div className="flex items-center justify-between"><span>العدد</span><span>{connectivity?.count ?? "—"}</span></div>
                <div className="text-xs text-muted-foreground">{connectivity?.error || "لا توجد أخطاء"}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> مصفوفة المصدر</CardTitle>
            <CardDescription>قرار الدمج ومصدر الحقيقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {matrixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="flex items-center justify-between"><span>إجمالي الكيانات</span><span>{matrix?.summary?.total ?? "—"}</span></div>
                <div className="flex items-center justify-between"><span>كيانات المنصة</span><span>{matrix?.summary?.sourceOfTruth?.platform ?? "—"}</span></div>
                <div className="flex items-center justify-between"><span>محلية/تشغيلية</span><span>{matrix?.summary?.sourceOfTruth?.assistant_local ?? "—"}</span></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="adminUsers" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-2xl bg-muted p-1 md:grid-cols-4">
          <TabsTrigger value="adminUsers" className="rounded-xl">المستخدمون</TabsTrigger>
          <TabsTrigger value="orgUnits" className="rounded-xl">الوحدات</TabsTrigger>
          <TabsTrigger value="waqfAssets" className="rounded-xl">الأصول الوقفية</TabsTrigger>
          <TabsTrigger value="endowments" className="rounded-xl">الأوقاف المرجعية</TabsTrigger>
        </TabsList>

        <TabsContent value="adminUsers">
          <EntityCard
            icon={ShieldCheck}
            title="admin_users"
            description="قراءة فقط من مصدر الهوية الإداري والسيادي"
            data={adminUsers}
            isLoading={adminUsersLoading}
            columns={[
              ["email", "البريد"],
              ["name", "الاسم"],
              ["role", "الدور"],
              ["unitId", "الوحدة"],
              ["isActive", "نشط"],
            ]}
          />
        </TabsContent>

        <TabsContent value="orgUnits">
          <EntityCard
            icon={FolderTree}
            title="core.org_units"
            description="الوحدات التنظيمية السيادية المستخدمة كسياق وصلاحيات"
            data={orgUnits}
            isLoading={orgUnitsLoading}
            columns={[
              ["slug", "Slug"],
              ["code", "الرمز"],
              ["nameAr", "الاسم العربي"],
              ["unitType", "النوع"],
              ["parentId", "الأصل"],
            ]}
          />
        </TabsContent>

        <TabsContent value="waqfAssets">
          <EntityCard
            icon={Building2}
            title="waqf_assets"
            description="الكيان التشغيلي المركزي الذي يجب استهلاكه دون إعادة تعريفه"
            data={waqfAssets}
            isLoading={waqfAssetsLoading}
            columns={[
              ["nationalAssetCode", "الرمز الوطني"],
              ["nameAr", "الاسم"],
              ["endowmentName", "الوقف المرجعي"],
              ["status", "الحالة"],
              ["assetType", "النوع"],
            ]}
          />
        </TabsContent>

        <TabsContent value="endowments">
          <EntityCard
            icon={Landmark}
            title="endowment_names"
            description="مرجع الوقف الأم الذي يستهلكه المساعد كسياق فقط"
            data={endowments}
            isLoading={endowmentsLoading}
            columns={[
              ["nameAr", "الاسم العربي"],
              ["nameEn", "الاسم الإنجليزي"],
              ["status", "الحالة"],
              ["type", "النوع"],
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type EntityCardProps = {
  icon: typeof Database;
  title: string;
  description: string;
  data: any;
  isLoading: boolean;
  columns: [string, string][];
};

function EntityCard({ icon: Icon, title, description, data, isLoading, columns }: EntityCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-4 w-4" /> {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">الإجمالي: {data?.total ?? "—"}</Badge>
          <Badge variant="outline">المعروض: {data?.filtered ?? "—"}</Badge>
          <Badge variant="outline">الجدول: {data?.schema ? `${data.schema}.${data.table}` : "غير مهيأ"}</Badge>
        </div>

        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : data?.error ? (
          <EmptyState text={data.error} />
        ) : !data?.items?.length ? (
          <EmptyState text="لا توجد بيانات مطابقة حاليًا." />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(([key, label]) => (
                    <TableHead key={key}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((row: Record<string, unknown>, index: number) => (
                  <TableRow key={`${title}-${index}`}>
                    {columns.map(([key]) => (
                      <TableCell key={key}><JsonCell value={row[key]} /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
