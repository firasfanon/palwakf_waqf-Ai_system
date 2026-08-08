import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatArabicDateTime } from "@/lib/dateFormat";
import { Database, FileCheck2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Backup() {
  const [manifest, setManifest] = useState<any>(null);
  const snapshotQuery = trpc.admin.operations.backupSnapshot.useQuery();
  const createManifest = trpc.admin.operations.createBackupManifest.useMutation({
    onSuccess: (data) => {
      setManifest(data);
      toast.success("تم إنشاء manifest حوكمي للنسخ الاحتياطي");
    },
    onError: (error) => toast.error(error.message),
  });
  const snapshot = snapshotQuery.data;
  const metrics = snapshot?.metrics || {};

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Database className="h-8 w-8" />
            النسخ الاحتياطي
          </h1>
          <p className="mt-2 text-muted-foreground">تفعيل آمن كـ manifest تشغيلية دون تنفيذ dump أو استعادة هدّامة من الواجهة.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching}>
            <RefreshCw className={`ml-2 h-4 w-4 ${snapshotQuery.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button onClick={() => createManifest.mutate()} disabled={createManifest.isPending}>
            <FileCheck2 className="ml-2 h-4 w-4" />
            إنشاء Manifest
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(metrics).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{String(value)}</div>
              <p className="mt-2 text-sm text-muted-foreground">{key}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>نطاقات النسخ المشمولة</CardTitle>
          <CardDescription>{snapshot?.title || "تحميل snapshot النسخ الاحتياطي..."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(snapshot?.includedScopes || []).map((scope: string) => <Badge key={scope} variant="outline">{scope}</Badge>)}
        </CardContent>
      </Card>

      {manifest ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>آخر Manifest</CardTitle>
            <CardDescription>هذا ليس dump فعليًا؛ هو سجل نطاقات وأعداد للتحقق قبل تشغيل نسخ احتياطي خارجي.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>المعرف:</strong> {manifest.manifestId}</p>
            <p><strong>وقت الإنشاء:</strong> {formatArabicDateTime(manifest.createdAt)}</p>
            <p><strong>النمط:</strong> {manifest.mode}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
