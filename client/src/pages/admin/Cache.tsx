import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { HardDrive, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";

export default function Cache() {
  const snapshotQuery = trpc.admin.operations.cacheSnapshot.useQuery();
  const snapshot = snapshotQuery.data;
  const metrics = snapshot?.metrics || { totalCached: 0, totalHits: 0, avgRating: 0, aiToolRuns: 0 };

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <HardDrive className="h-8 w-8" />
            إدارة الذاكرة المؤقتة
          </h1>
          <p className="mt-2 text-muted-foreground">
            قراءة تشغيلية فعلية لحالة Cache ومؤشرات استخدامه ضمن مسار الإدارة.
          </p>
        </div>
        <Button variant="outline" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching}>
          <RefreshCw className={`ml-2 h-4 w-4 ${snapshotQuery.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>حالة backend</CardTitle>
              <CardDescription>{snapshot?.title || "تحميل حالة الربط..."}</CardDescription>
            </div>
            <Badge variant="default" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {snapshot?.status === "connected" ? "مربوط" : "بانتظار التحقق"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["إجمالي الإجابات المحفوظة", metrics.totalCached],
          ["إجمالي الاستخدام", metrics.totalHits],
          ["متوسط التقييم", Number(metrics.avgRating || 0).toFixed(1)],
          ["تشغيلات الأدوات", metrics.aiToolRuns],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardContent className="pt-6">
              {snapshotQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-bold">{String(value)}</div>}
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أكثر الأسئلة استخدامًا في Cache
          </CardTitle>
          <CardDescription>تعرض من backend عند توفر قاعدة cache، وتعود إلى Empty State آمن عند عدم وجود بيانات.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(snapshot?.topQuestions || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              لا توجد عناصر Cache مسجلة حاليًا.
            </div>
          ) : (
            snapshot!.topQuestions.map((item: any, index: number) => (
              <div key={`${item.question}-${index}`} className="flex items-center justify-between rounded-2xl border p-4">
                <p className="line-clamp-2 text-sm">{item.question}</p>
                <Badge variant="secondary">{item.hitCount}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
