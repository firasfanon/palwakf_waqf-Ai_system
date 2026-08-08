import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, FileSearch, Info } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import AdminTable from "@/components/admin/ui/AdminTable";
import TableSkeleton from "@/components/TableSkeleton";

type FetchStatus = "running" | "success" | "partial" | "failed";

function statusBadge(status: FetchStatus) {
  const map: Record<FetchStatus, { label: string; variant: any }> = {
    running: { label: "جارٍ التنفيذ", variant: "secondary" },
    success: { label: "نجاح", variant: "default" },
    partial: { label: "جزئي", variant: "default" },
    failed: { label: "فشل", variant: "destructive" },
  };
  const x = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={x.variant}>{x.label}</Badge>;
}

export default function FetchLogsManagement() {
  const [sourceId, setSourceId] = useState<string>("all");
  const [status, setStatus] = useState<"all" | FetchStatus>("all");
  const [preview, setPreview] = useState<any>(null);

  const { data: sources } = trpc.knowledgeSources.list.useQuery();

  const sourcesMap = useMemo(() => {
    const m = new Map<number, any>();
    (sources || []).forEach((s: any) => m.set(s.id, s));
    return m;
  }, [sources]);

  const filters = useMemo(() => {
    const f: any = {};
    if (sourceId !== "all") f.sourceId = Number(sourceId);
    if (status !== "all") f.status = status;
    return f;
  }, [sourceId, status]);

  const { data: logs, isLoading, refetch } = trpc.fetchLogs.list.useQuery(filters);
  const { data: stats } = trpc.fetchLogs.getStats.useQuery(
    sourceId !== "all" ? { sourceId: Number(sourceId) } : undefined
  );

  const isEmpty = !isLoading && (!logs || logs.length === 0);

  return (
    <AdminPage>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">سجل عمليات الجلب</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            تتبّع عمليات الجلب وحالات النجاح/الفشل والأخطاء المرتبطة بكل مصدر.
          </p>
        </div>

        <Button onClick={() => refetch()} className="h-10" variant="outline">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      <AdminCard title="الفلاتر" description="تصفية حسب المصدر والحالة">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="h-10 w-[220px]">
              <SelectValue placeholder="كل المصادر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المصادر</SelectItem>
              {(sources || []).map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="h-10 w-[200px]">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="running">جارٍ التنفيذ</SelectItem>
              <SelectItem value="success">نجاح</SelectItem>
              <SelectItem value="partial">جزئي</SelectItem>
              <SelectItem value="failed">فشل</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground px-2">
            {stats ? (
              <span>
                إجمالي: <b className="text-foreground">{stats.totalFetches}</b> — نجاح: <b className="text-foreground">{stats.successfulFetches}</b> — فشل: <b className="text-foreground">{stats.failedFetches}</b>
              </span>
            ) : null}
          </div>
        </div>
      </AdminCard>

      <AdminTable
        title="السجل"
        description={logs ? `${logs.length} سجل` : ""}
        isLoading={isLoading}
        loadingFallback={<TableSkeleton rows={6} />}
        empty={isEmpty}
        emptyTitle="لا توجد سجلات"
        emptyDescription="لم يتم العثور على سجلات مطابقة للفلاتر الحالية."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">المصدر</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">البداية</TableHead>
              <TableHead className="text-center">الانتهاء</TableHead>
              <TableHead className="text-center">مجلوب</TableHead>
              <TableHead className="text-center">معتمد</TableHead>
              <TableHead className="text-center">مرفوض</TableHead>
              <TableHead className="text-center">تفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs || []).map((log: any) => {
              const src = sourcesMap.get(log.sourceId);
              const started = log.startedAt ? new Date(log.startedAt) : null;
              const completed = log.completedAt ? new Date(log.completedAt) : null;
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-center">
                    <div className="text-sm font-medium">{src?.name ?? `#${log.sourceId}`}</div>
                    <div className="text-xs text-muted-foreground">{src?.type ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-center">{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-center text-sm">
                    {started ? format(started, "PPp", { locale: ar }) : "—"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {completed ? format(completed, "PPp", { locale: ar }) : "—"}
                  </TableCell>
                  <TableCell className="text-center">{log.itemsFetched ?? 0}</TableCell>
                  <TableCell className="text-center">{log.itemsApproved ?? 0}</TableCell>
                  <TableCell className="text-center">{log.itemsRejected ?? 0}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => setPreview(log)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTable>

      <Dialog open={!!preview} onOpenChange={(o) => (!o ? setPreview(null) : null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل السجل</DialogTitle>
            <DialogDescription>
              سجل رقم #{preview?.id} — {preview?.status ? statusBadge(preview.status) : null}
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">المصدر</div>
                  <div className="font-medium">{sourcesMap.get(preview.sourceId)?.name ?? `#${preview.sourceId}`}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">الفترة</div>
                  <div className="font-medium">
                    {preview.startedAt ? format(new Date(preview.startedAt), "PPp", { locale: ar }) : "—"}
                    {preview.completedAt ? ` → ${format(new Date(preview.completedAt), "PPp", { locale: ar })}` : ""}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">مجلوب</div>
                  <div className="text-lg font-bold">{preview.itemsFetched ?? 0}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">معتمد</div>
                  <div className="text-lg font-bold">{preview.itemsApproved ?? 0}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">مرفوض</div>
                  <div className="text-lg font-bold">{preview.itemsRejected ?? 0}</div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <div className="text-muted-foreground mb-1">الأخطاء</div>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
{preview.errors || "لا توجد أخطاء مسجلة."}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
