import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Tag, TrendingUp, MapPin, BarChart3 } from "lucide-react";

export default function WaqfAnalytics() {
  const { data: stats, isLoading } = trpc.waqfAnalytics.getStatistics.useQuery();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">جاري تحميل الإحصائيات...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">لا توجد بيانات متاحة</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إحصائيات الأوقاف</h1>
        <p className="text-muted-foreground mt-2">
          لوحة تحليلية شاملة لبيانات الأوقاف الإسلامية في فلسطين
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأوقاف</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWaqfs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              عدد الأوقاف المسجلة في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التصنيفات</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              عدد التصنيفات المتاحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المحافظات</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waqfsByGovernorate.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              عدد المحافظات المشمولة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النمو</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12%</div>
            <p className="text-xs text-muted-foreground mt-1">
              نمو الأوقاف هذا الشهر
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Waqfs by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع الأوقاف حسب التصنيف
            </CardTitle>
            <CardDescription>
              عدد الأوقاف في كل تصنيف
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.waqfsByCategory.map((item, index) => {
                const percentage = stats.totalWaqfs > 0 
                  ? ((item.count / stats.totalWaqfs) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.categoryName}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.waqfsByCategory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات متاحة
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Waqfs by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع الأوقاف حسب النوع
            </CardTitle>
            <CardDescription>
              خيري، ذري، أو مختلط
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.waqfsByType.map((item, index) => {
                const percentage = stats.totalWaqfs > 0 
                  ? ((item.count / stats.totalWaqfs) * 100).toFixed(1) 
                  : 0;
                const typeLabel = item.type === "charitable" ? "خيري" 
                  : item.type === "family" ? "ذري" 
                  : "مختلط";
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{typeLabel}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Governorate Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waqfs by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع الأوقاف حسب الحالة
            </CardTitle>
            <CardDescription>
              نشط، غير نشط، متنازع عليه، قيد التطوير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.waqfsByStatus.map((item, index) => {
                const percentage = stats.totalWaqfs > 0 
                  ? ((item.count / stats.totalWaqfs) * 100).toFixed(1) 
                  : 0;
                const statusLabel = item.status === "active" ? "نشط" 
                  : item.status === "inactive" ? "غير نشط" 
                  : item.status === "disputed" ? "متنازع عليه" 
                  : "قيد التطوير";
                const statusColor = item.status === "active" ? "bg-green-600" 
                  : item.status === "inactive" ? "bg-gray-400" 
                  : item.status === "disputed" ? "bg-red-600" 
                  : "bg-yellow-600";
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{statusLabel}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColor} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Waqfs by Governorate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              توزيع الأوقاف حسب المحافظة
            </CardTitle>
            <CardDescription>
              أكثر 10 محافظات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.waqfsByGovernorate.slice(0, 10).map((item, index) => {
                const percentage = stats.totalWaqfs > 0 
                  ? ((item.count / stats.totalWaqfs) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.governorate}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
