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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, Play, ExternalLink, Database } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import AdminPage from "@/components/admin/ui/AdminPage";
import AdminTable from "@/components/admin/ui/AdminTable";

export default function KnowledgeSourcesManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "wikipedia" as "wikipedia" | "rss" | "scraper" | "pdf_url" | "api",
    url: "",
    config: "",
    fetchFrequency: "manual" as "manual" | "daily" | "weekly" | "monthly",
  });

  // Queries
  const { data: sources, isLoading, refetch } = trpc.knowledgeSources.list.useQuery();

  // Mutations
  const createMutation = trpc.knowledgeSources.create.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إضافة المصدر بنجاح");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("❌ فشل إضافة المصدر", {
        description: error.message,
      });
    },
  });

  const updateMutation = trpc.knowledgeSources.update.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث المصدر بنجاح");
      setIsEditDialogOpen(false);
      setSelectedSource(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("❌ فشل تحديث المصدر", {
        description: error.message,
      });
    },
  });

  const deleteMutation = trpc.knowledgeSources.delete.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف المصدر بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("❌ فشل حذف المصدر", {
        description: error.message,
      });
    },
  });

  const toggleActiveMutation = trpc.knowledgeSources.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث حالة المصدر");
      refetch();
    },
    onError: (error) => {
      toast.error("❌ فشل تحديث الحالة", {
        description: error.message,
      });
    },
  });

  const fetchMutation = trpc.knowledgeSources.fetch.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ نجح الجلب", {
          description: `تم جلب ${data.itemsFetched} عنصر`,
        });
      } else {
        toast.error("❌ فشل الجلب", {
          description: data.errors?.join(", ") || "حدث خطأ",
        });
      }
      refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ في الجلب", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "wikipedia",
      url: "",
      config: "",
      fetchFrequency: "manual",
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.url) {
      toast.error("❌ يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (source: any) => {
    setSelectedSource(source);
    setFormData({
      name: source.name,
      type: source.type,
      url: source.url,
      config: source.config || "",
      fetchFrequency: source.fetchFrequency,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSource || !formData.name || !formData.url) {
      toast.error("❌ يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    updateMutation.mutate({
      id: selectedSource.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المصدر؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const handleFetch = (id: number) => {
    if (confirm("هل تريد بدء عملية الجلب من هذا المصدر؟")) {
      fetchMutation.mutate({ id });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      wikipedia: "ويكيبيديا",
      rss: "RSS",
      scraper: "مستخرج ويب",
      pdf_url: "رابط PDF",
      api: "API",
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      manual: "يدوي",
      daily: "يومي",
      weekly: "أسبوعي",
      monthly: "شهري",
    };
    return labels[frequency] || frequency;
  };

  const sourcesCount = useMemo(() => (sources?.length ?? 0), [sources]);
  const isEmpty = !isLoading && (!sources || sources.length === 0);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">جارٍ تحميل مصادر المعرفة…</div>
    );
  }

  return (
    <AdminPage>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">مصادر المعرفة</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            إضافة وإدارة المصادر التي يتم جلب المحتوى منها تلقائيًا
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="h-10">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مصدر
        </Button>
      </div>

      <AdminTable
        title="المصادر المتاحة"
        description={`${sourcesCount} مصدر مسجل`}
        empty={isEmpty}
        emptyTitle="لا توجد مصادر"
        emptyDescription="قم بإضافة مصدر جديد للبدء."
        emptyAction={
          <Button onClick={() => setIsCreateDialogOpen(true)} className="h-10">
            <Plus className="w-4 h-4 ml-2" />
            إضافة مصدر
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">الاسم</TableHead>
              <TableHead className="text-center">النوع</TableHead>
              <TableHead className="text-center">الرابط</TableHead>
              <TableHead className="text-center">تكرار الجلب</TableHead>
              <TableHead className="text-center">آخر جلب</TableHead>
              <TableHead className="text-center">العناصر</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources?.map((source: any) => (
              <TableRow key={source.id}>
                <TableCell className="text-center font-medium">{source.name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{getTypeLabel(source.type)}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[260px] items-center justify-center gap-1 text-primary hover:underline"
                  >
                    <span className="truncate">{source.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{getFrequencyLabel(source.fetchFrequency)}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {source.lastFetchAt
                    ? format(new Date(source.lastFetchAt), "PPp", { locale: ar })
                    : "لم يتم الجلب بعد"}
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex flex-col items-center gap-1 text-sm">
                    <span>✅ {source.successCount || 0}</span>
                    <span>❌ {source.errorCount || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex items-center justify-center">
                    <Switch
                      checked={source.isActive === 1}
                      onCheckedChange={(checked) => handleToggleActive(source.id, checked)}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFetch(source.id)}
                      disabled={fetchMutation.isPending}
                      className="h-9"
                      title="جلب"
                    >
                      {fetchMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(source)}
                      className="h-9"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(source.id)}
                      disabled={deleteMutation.isPending}
                      className="h-9"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTable>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة مصدر جديد</DialogTitle>
            <DialogDescription>أدخل معلومات المصدر الذي تريد جلب المحتوى منه</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم المصدر *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: ويكيبيديا العربية - الأوقاف"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">نوع المصدر *</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wikipedia">ويكيبيديا</SelectItem>
                  <SelectItem value="rss">RSS</SelectItem>
                  <SelectItem value="scraper">مستخرج ويب</SelectItem>
                  <SelectItem value="pdf_url">رابط PDF</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">الرابط *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frequency">تكرار الجلب</Label>
              <Select
                value={formData.fetchFrequency}
                onValueChange={(value: any) => setFormData({ ...formData, fetchFrequency: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config">إعدادات إضافية (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                placeholder='{"maxItems": 10, "category": "law"}'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="h-10">
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="h-10">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المصدر</DialogTitle>
            <DialogDescription>قم بتعديل معلومات المصدر</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">اسم المصدر *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">نوع المصدر *</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wikipedia">ويكيبيديا</SelectItem>
                  <SelectItem value="rss">RSS</SelectItem>
                  <SelectItem value="scraper">مستخرج ويب</SelectItem>
                  <SelectItem value="pdf_url">رابط PDF</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">الرابط *</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-frequency">تكرار الجلب</Label>
              <Select
                value={formData.fetchFrequency}
                onValueChange={(value: any) => setFormData({ ...formData, fetchFrequency: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-config">إعدادات إضافية (JSON)</Label>
              <Textarea
                id="edit-config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="h-10">
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="h-10">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
              تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
