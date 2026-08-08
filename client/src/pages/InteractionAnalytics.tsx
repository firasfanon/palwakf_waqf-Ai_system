import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Star, Bell, TrendingUp, BarChart3, PieChart, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function InteractionAnalytics() {
  const { data: stats, isLoading: statsLoading } = trpc.interaction.getStats.useQuery();
  const { data: commentsOverTime, isLoading: commentsLoading } = trpc.interaction.getCommentsOverTime.useQuery();
  const { data: ratingsDistribution, isLoading: ratingsLoading } = trpc.interaction.getRatingsDistribution.useQuery();
  const { data: notificationsByType, isLoading: notificationsLoading } = trpc.interaction.getNotificationsByType.useQuery();
  const { data: recentComments, isLoading: recentLoading } = trpc.interaction.getRecentComments.useQuery();
  const { data: commentsByEntity, isLoading: commentsByEntityLoading } = trpc.interaction.getCommentsByEntityType.useQuery();
  const { data: ratingsByEntity, isLoading: ratingsByEntityLoading } = trpc.interaction.getRatingsByEntityType.useQuery();

  if (statsLoading) {
    return (
      <div className="container py-8" dir="rtl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate safe values with fallbacks
  const totalComments = Number(stats?.totalComments || 0);
  const totalRatings = Number(stats?.totalRatings || 0);
  const totalNotifications = Number(stats?.totalNotifications || 0);
  const avgRating = Number(stats?.avgRating || 0);
  const interactionRate = Number(stats?.interactionRate || 0);

  // Entity type translations
  const entityTypeLabels: Record<string, string> = {
    knowledge: "قاعدة المعرفة",
    faq: "الأسئلة الشائعة",
    property: "العقارات الوقفية",
    case: "القضايا الوقفية",
    ruling: "الأحكام القضائية",
    instruction: "التعليمات الوزارية",
  };

  // Notification type translations
  const notificationTypeLabels: Record<string, string> = {
    comment: "تعليق جديد",
    rating: "تقييم جديد",
    reply: "رد على تعليق",
    mention: "إشارة",
    system: "إشعار نظام",
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">إحصائيات التفاعل</h1>
        <p className="text-muted-foreground">
          تحليل شامل لتفاعلات المستخدمين مع المحتوى (التعليقات، التقييمات، الإشعارات)
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التعليقات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              جميع التعليقات على المحتوى
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التقييمات</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRatings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              متوسط: {avgRating.toFixed(1)} ⭐
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإشعارات</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              جميع الإشعارات المرسلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التفاعل</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactionRate.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              تفاعل/يوم (آخر 30 يوم)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Comments Over Time Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              التعليقات خلال آخر 30 يوم
            </CardTitle>
            <CardDescription>عدد التعليقات اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            {commentsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : commentsOverTime && commentsOverTime.length > 0 ? (
              <div className="space-y-2">
                <div className="h-64 flex items-end justify-between gap-1">
                  {commentsOverTime.map((item, index) => {
                    const maxCount = Math.max(...commentsOverTime.map(d => d.count), 1);
                    const height = (item.count / maxCount) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? "4px" : "0" }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {new Date(item.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}: {item.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  من {commentsOverTime[0]?.date} إلى {commentsOverTime[commentsOverTime.length - 1]?.date}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ratings Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع التقييمات
            </CardTitle>
            <CardDescription>عدد التقييمات حسب النجوم</CardDescription>
          </CardHeader>
          <CardContent>
            {ratingsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : ratingsDistribution && ratingsDistribution.length > 0 ? (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const item = ratingsDistribution.find(r => r.rating === star);
                  const count = item?.count || 0;
                  const maxCount = Math.max(...ratingsDistribution.map(r => r.count), 1);
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={star} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          {star} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entity Type Statistics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Comments by Entity Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              التعليقات حسب نوع المحتوى
            </CardTitle>
            <CardDescription>توزيع التعليقات على أنواع المحتوى المختلفة</CardDescription>
          </CardHeader>
          <CardContent>
            {commentsByEntityLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : commentsByEntity && commentsByEntity.length > 0 ? (
              <div className="space-y-3">
                {commentsByEntity.map((item, index) => {
                  const maxCount = Math.max(...commentsByEntity.map(c => c.count), 1);
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{entityTypeLabels[item.entityType] || item.entityType}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ratings by Entity Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              التقييمات حسب نوع المحتوى
            </CardTitle>
            <CardDescription>متوسط التقييمات لكل نوع محتوى</CardDescription>
          </CardHeader>
          <CardContent>
            {ratingsByEntityLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : ratingsByEntity && ratingsByEntity.length > 0 ? (
              <div className="space-y-3">
                {ratingsByEntity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm">{entityTypeLabels[item.entityType] || item.entityType}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.count} تقييم</span>
                      <Badge variant="outline" className="gap-1">
                        {item.avgRating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            الإشعارات حسب النوع
          </CardTitle>
          <CardDescription>توزيع الإشعارات المرسلة حسب النوع</CardDescription>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notificationsByType && notificationsByType.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notificationsByType.map((item, index) => {
                const total = notificationsByType.reduce((sum, n) => sum + n.count, 0);
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={index} className="p-4 bg-secondary/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {notificationTypeLabels[item.type] || item.type}
                      </span>
                      <Badge>{percentage}%</Badge>
                    </div>
                    <div className="text-2xl font-bold">{item.count.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            أحدث التعليقات
          </CardTitle>
          <CardDescription>آخر 20 تعليق تم إضافتها</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentComments && recentComments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">المحتوى</TableHead>
                    <TableHead className="text-center">نوع المحتوى</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="max-w-md">
                        <p className="truncate">{comment.content}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {entityTypeLabels[comment.entityType] || comment.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comment.isApproved ? "default" : "secondary"}>
                          {comment.isApproved ? "موافق عليه" : "قيد المراجعة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              لا توجد تعليقات بعد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
