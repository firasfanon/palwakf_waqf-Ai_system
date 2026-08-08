import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Plug, RefreshCw, XCircle } from "lucide-react";

export default function Integrations() {
  const snapshotQuery = trpc.admin.operations.integrationsSnapshot.useQuery();
  const snapshot = snapshotQuery.data;
  const integrations = snapshot?.integrations || [];

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Plug className="h-8 w-8" />
            التكاملات
          </h1>
          <p className="mt-2 text-muted-foreground">قراءة فعلية لحالة التكاملات من إعدادات النظام والمصادر وبيئة التشغيل.</p>
        </div>
        <Button variant="outline" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching}>
          <RefreshCw className={`ml-2 h-4 w-4 ${snapshotQuery.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{snapshotQuery.isLoading ? <Skeleton className="h-8 w-16" /> : snapshot?.metrics?.configured || 0}</div><p className="mt-2 text-sm text-muted-foreground">تكاملات مهيأة</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{snapshotQuery.isLoading ? <Skeleton className="h-8 w-16" /> : snapshot?.metrics?.activeSources || 0}</div><p className="mt-2 text-sm text-muted-foreground">مصادر معرفة نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-3xl font-bold">{snapshotQuery.isLoading ? <Skeleton className="h-8 w-16" /> : `${snapshot?.metrics?.successRate || 0}%`}</div><p className="mt-2 text-sm text-muted-foreground">نسبة نجاح الجلب</p></CardContent></Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>قائمة التكاملات</CardTitle>
          <CardDescription>{snapshot?.title || "تحميل حالة التكاملات..."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">لا توجد قراءة تكاملات متاحة.</div>
          ) : integrations.map((item: any) => (
            <div key={item.key} className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                {item.configured ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.key}</p>
                </div>
              </div>
              <Badge variant={item.configured ? "default" : "outline"}>{item.configured ? "مهيأ" : "غير مهيأ"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
