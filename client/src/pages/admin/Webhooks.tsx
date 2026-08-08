import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Webhook } from "lucide-react";

export default function Webhooks() {
  const snapshotQuery = trpc.admin.operations.webhooksSnapshot.useQuery();
  const snapshot = snapshotQuery.data;

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Webhook className="h-8 w-8" />
            Webhooks
          </h1>
          <p className="mt-2 text-muted-foreground">خريطة أحداث backend داخلية للأدوات والمعرفة دون تفعيل إرسال خارجي غير معتمد.</p>
        </div>
        <Button variant="outline" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching}>
          <RefreshCw className={`ml-2 h-4 w-4 ${snapshotQuery.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قنوات الأحداث</CardTitle>
          <CardDescription>{snapshot?.title || "تحميل خريطة الأحداث..."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(snapshot?.events || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">لا توجد أحداث معرفة.</div>
          ) : snapshot!.events.map((item: any) => (
            <div key={item.event} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">{item.event}</p>
                  <p className="text-sm text-muted-foreground">المصدر: {item.source}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">{item.enabled ? "مفعل داخليًا" : "معطل"}</Badge>
                  <Badge variant="outline">{item.mode}</Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
