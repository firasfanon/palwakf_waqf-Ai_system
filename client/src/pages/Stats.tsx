import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading } = trpc.chat.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="public-page-shell" dir="rtl">
        <section className="public-page-section">
          <div className="container mx-auto space-y-6 py-8">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const totalConversations = stats?.totalConversations || 0;
  const totalMessages = stats?.totalMessages || 0;
  const totalRatings = stats?.totalRatings || 0;
  const positiveRatings = stats?.positiveRatings || 0;
  const positivePercentage = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0;

  return (
    <div className="public-page-shell" dir="rtl">
      <section className="public-page-hero py-16">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="public-page-title-icon mx-auto">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">إحصائيات الاستخدام</h1>
            <p className="text-lg text-muted-foreground">نظرة عامة على استخدام نموذج الذكاء الصناعي للأوقاف ضمن واجهة عامة موحدة.</p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container mx-auto space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["إجمالي المحادثات", totalConversations, MessageSquare, "محادثة مع النموذج"],
              ["إجمالي الرسائل", totalMessages, BarChart3, "رسالة متبادلة"],
              ["التقييمات الإيجابية", `${positivePercentage}%`, ThumbsUp, `${positiveRatings} من ${totalRatings} تقييم`],
              ["معدل الاستخدام", totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0, TrendingUp, "رسالة لكل محادثة"],
            ].map(([title, value, Icon, note]) => {
              const StatIcon = Icon as typeof MessageSquare;
              return (
                <Card key={String(title)} className="public-stat-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <StatIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{String(value)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{String(note)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {stats?.categoryCounts && stats.categoryCounts.length > 0 && (
            <Card className="public-surface-card">
              <CardHeader>
                <CardTitle>المحادثات حسب الفئة</CardTitle>
                <CardDescription>توزيع المحادثات على الفئات المختلفة.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.categoryCounts.map((cat: any) => {
                    const percentage = totalConversations > 0 ? (cat.count / totalConversations) * 100 : 0;
                    const categoryNames: Record<string, string> = {
                      general: "عام",
                      legal: "قانوني",
                      jurisprudence: "فقهي",
                      administrative: "إداري",
                      historical: "تاريخي",
                    };

                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{categoryNames[cat.category] || cat.category}</span>
                          <span className="text-muted-foreground">{cat.count} محادثة</span>
                        </div>
                        <div className="public-meter-track">
                          <div className="public-meter-fill transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
