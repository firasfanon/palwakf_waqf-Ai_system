import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  Database, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Activity,
  Globe,
  BarChart3,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = {
  wikipedia: "hsl(var(--primary))",
  rss: "hsl(var(--secondary))",
  scraper: "hsl(var(--secondary))",
  pdf_url: "hsl(var(--destructive))",
  api: "hsl(var(--accent))",
};

const TYPE_LABELS: Record<string, string> = {
  wikipedia: "ويكيبيديا",
  rss: "RSS",
  scraper: "مستخرج ويب",
  pdf_url: "PDF",
  api: "API",
};

export default function KnowledgeDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.knowledgeSources.stats.useQuery();
  const { data: topActive, isLoading: topLoading } = trpc.knowledgeSources.topActive.useQuery({ limit: 5 });
  const { data: fetchActivity, isLoading: activityLoading } = trpc.knowledgeSources.fetchActivity.useQuery();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare data for charts
  const sourceTypeData = stats?.sourcesByType 
    ? Object.entries(stats.sourcesByType).map(([type, count]) => ({
        name: TYPE_LABELS[type] || type,
        value: count as unknown as number,
        color: COLORS[type as keyof typeof COLORS] || "hsl(var(--muted-foreground))",
      }))
    : [];

  const successVsErrorData = [
    { name: "نجح", value: stats?.totalSuccess || 0, fill: "hsl(var(--secondary))" },
    { name: "فشل", value: stats?.totalErrors || 0, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">لوحة معلومات مصادر المعرفة</h1>
        <p className="text-muted-foreground mt-2">
          نظرة شاملة على أداء نظام جلب المعرفة
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصادر</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSources || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeSources || 0} نشط • {stats?.inactiveSources || 0} غير نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العناصر المجلوبة</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي المحتوى المجلوب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats?.totalSuccess || 0}
              </span>
              <span className="text-xs text-red-600 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {stats?.totalErrors || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نشاط حديث</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentFetches || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              عمليات جلب خلال 24 ساعة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Source Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المصادر حسب النوع</CardTitle>
            <CardDescription>عدد المصادر لكل نوع</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="hsl(var(--accent))"
                    dataKey="value"
                  >
                    {sourceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات لعرضها
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success vs Errors */}
        <Card>
          <CardHeader>
            <CardTitle>النجاح مقابل الفشل</CardTitle>
            <CardDescription>إجمالي عمليات الجلب</CardDescription>
          </CardHeader>
          <CardContent>
            {(stats?.totalSuccess || 0) + (stats?.totalErrors || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={successVsErrorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات لعرضها
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fetch Activity Chart */}
      {!activityLoading && fetchActivity && fetchActivity.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>نشاط الجلب خلال آخر 7 أيام</CardTitle>
            <CardDescription>عدد عمليات الجلب اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fetchActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), "dd/MM", { locale: ar })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), "PPP", { locale: ar })}
                />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="hsl(var(--secondary))" name="نجح" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" name="فشل" strokeWidth={2} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="الإجمالي" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Active Sources */}
      <Card>
        <CardHeader>
          <CardTitle>أكثر المصادر نشاطاً</CardTitle>
          <CardDescription>المصادر الأكثر إنتاجية</CardDescription>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : topActive && topActive.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">الاسم</TableHead>
                  <TableHead className="text-center">النوع</TableHead>
                  <TableHead className="text-center">العناصر</TableHead>
                  <TableHead className="text-center">النجاحات</TableHead>
                  <TableHead className="text-center">الأخطاء</TableHead>
                  <TableHead className="text-center">آخر جلب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topActive.map((source: any) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[source.type] || source.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{source.itemsCount || 0}</TableCell>
                    <TableCell className="text-center text-green-600">
                      {source.successCount || 0}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      {source.errorCount || 0}
                    </TableCell>
                    <TableCell>
                      {source.lastFetchAt 
                        ? format(new Date(source.lastFetchAt), "PPp", { locale: ar })
                        : "لم يتم الجلب بعد"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مصادر نشطة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Fetch Info */}
      {stats?.lastFetchDate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              آخر عملية جلب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {format(new Date(stats.lastFetchDate), "PPPp", { locale: ar })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
