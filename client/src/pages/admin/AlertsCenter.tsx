'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import AdminTable from "@/components/admin/ui/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { WatchlistTemplatesModal } from "@/components/alerts/WatchlistTemplatesModal";
import type { WatchlistTemplate } from "@/data/watchlistTemplates";

type AlertRowLike = {
  id: string | number;
  title?: string | null;
  url?: string | null;
  status?: string | null;
  score?: number | null;
  created_at?: string | null;
  createdAt?: string | null;
  matched_on?: string[] | string | null;
  matchedOn?: string[] | string | null;
  watchlist_name?: string | null;
  watchlistName?: string | null;
  watchlist?: { name?: string | null } | string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ar', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWatchlistName(alert: AlertRowLike) {
  if (typeof alert.watchlist === 'string') return alert.watchlist;
  if (alert.watchlist && typeof alert.watchlist === 'object' && 'name' in alert.watchlist) {
    return alert.watchlist.name || '—';
  }
  return alert.watchlist_name || alert.watchlistName || '—';
}

function getMatchedOn(alert: AlertRowLike) {
  const raw = alert.matched_on ?? alert.matchedOn;
  if (!raw) return '—';
  if (Array.isArray(raw)) return raw.join(', ');
  return String(raw);
}

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'seen':
      return 'bg-yellow-100 text-yellow-800';
    case 'done':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// CSV Helper Functions
function csvValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function normalizeCsvDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || '';
  return d.toLocaleString('ar', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildAlertsCsv(alerts: any[]): string {
  const headers = ['العنوان', 'الرابط', 'قائمة المراقبة', 'النقاط', 'الحالة', 'التاريخ', 'المطابقة'];
  const rows = alerts.map(alert => [
    csvValue(alert.alert?.title || alert.title || ''),
    csvValue(alert.alert?.url || alert.url || ''),
    csvValue(getWatchlistName(alert)),
    csvValue(alert.alert?.score || alert.score || ''),
    csvValue(alert.alert?.status || alert.status || ''),
    csvValue(normalizeCsvDate(alert.alert?.created_at || alert.created_at)),
    csvValue(getMatchedOn(alert)),
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

function downloadCsvFile(content: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function makeCsvFileName(prefix: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `${prefix}_${date}_${time}.csv`;
}

export default function AlertsCenter() {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPublicTemplatesModal, setShowPublicTemplatesModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertRowLike | null>(null);
  const [selectedWatchlist, setSelectedWatchlist] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const openAlertDetails = (alert: AlertRowLike) => {
    setSelectedAlert(alert);
  };

  const closeAlertDetails = () => {
    setSelectedAlert(null);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedAlert) {
        closeAlertDetails();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedAlert]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    query: "",
    categories: "",
    sourceTypes: "",
    statuses: "pending,approved",
  });

  const handleApplyTemplate = (template: WatchlistTemplate) => {
    setFormData({
      name: template.name,
      query: template.query,
      categories: template.categories || "",
      sourceTypes: template.sourceTypes || "",
      statuses: template.statuses || "pending,approved",
    });
    setShowCreateModal(true);
  };

  // Filters state
  const [filters, setFilters] = useState({
    status: "all",
    watchlistId: "all",
    q: "",
    minScore: 0,
    dateFrom: "",
    dateTo: "",
  });

  const [currentOffset, setCurrentOffset] = useState(0);

  // Queries
  const statsQuery = trpc.alerts.getStats.useQuery();
  const trendQuery = trpc.alerts.get7DayTrend.useQuery();
  const templatesQuery = trpc.alerts.templates.list.useQuery();
  const publicTemplatesQuery = trpc.alerts.templates.getPublic.useQuery();
  const watchlistsQuery = trpc.alerts.watchlists.list.useQuery();
  const alertsQuery = trpc.alerts.list.useQuery({
    status: filters.status === "all" ? undefined : filters.status,
    watchlistId: filters.watchlistId === "all" ? undefined : parseInt(filters.watchlistId),
    q: filters.q || undefined,
    minScore: filters.minScore > 0 ? filters.minScore : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    offset: currentOffset,
    limit: 50,
  });

  const alerts = alertsQuery.data?.items || [];
  const hasMore = alertsQuery.data?.hasMore || false;

  // Mutations
  const createTemplateMutation = trpc.alerts.templates.create.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حفظ القالب");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const deleteTemplateMutation = trpc.alerts.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف القالب");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const runWatchlistsMutation = trpc.alerts.run.useMutation({
    onSuccess: (data) => {
      toast.success("✅ تم تشغيل قوائم المراقبة", {
        description: `تم إنشاء ${data.createdCount} تنبيه من أصل ${data.totalMatches} مطابقة`,
      });
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const createWatchlistMutation = trpc.alerts.watchlists.create.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إنشاء قائمة المراقبة");
      setShowCreateModal(false);
      setFormData({
        name: "",
        query: "",
        categories: "",
        sourceTypes: "",
        statuses: "pending,approved",
      });
      watchlistsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const updateWatchlistMutation = trpc.alerts.watchlists.update.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث قائمة المراقبة");
      setShowEditModal(false);
      setFormData({
        name: "",
        query: "",
        categories: "",
        sourceTypes: "",
        statuses: "pending,approved",
      });
      watchlistsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const deleteWatchlistMutation = trpc.alerts.watchlists.delete.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف قائمة المراقبة");
      setShowDeleteModal(false);
      watchlistsQuery.refetch();
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const markSeenMutation = trpc.alerts.markSeen.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث الحالة");
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const markDoneMutation = trpc.alerts.markDone.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث الحالة");
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const bulkMarkSeenMutation = trpc.alerts.bulkMarkSeen.useMutation({
    onSuccess: (data) => {
      toast.success("✅ تم تحديث الحالة", {
        description: `تم تحديث ${data.updatedCount} تنبيه`,
      });
      setSelectedIds(new Set());
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const bulkMarkDoneMutation = trpc.alerts.bulkMarkDone.useMutation({
    onSuccess: (data) => {
      toast.success("✅ تم تحديث الحالة", {
        description: `تم تحديث ${data.updatedCount} تنبيه`,
      });
      setSelectedIds(new Set());
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const bulkDeleteMutation = trpc.alerts.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success("✅ تم حذف التنبيهات", {
        description: `تم حذف ${data.deletedCount} تنبيه`,
      });
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      alertsQuery.refetch();
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const handleCreateWatchlist = () => {
    if (!formData.name || !formData.query) {
      toast.error("❌ خطأ", {
        description: "يرجى ملء الاسم والاستعلام",
      });
      return;
    }
    createWatchlistMutation.mutate(formData);
  };

  const handleEditWatchlist = () => {
    if (!formData.name || !formData.query) {
      toast.error("❌ خطأ", {
        description: "يرجى ملء الاسم والاستعلام",
      });
      return;
    }
    updateWatchlistMutation.mutate({
      id: selectedWatchlist.id,
      ...formData,
    });
  };

  const openEditModal = (watchlist: any) => {
    setSelectedWatchlist(watchlist);
    setFormData({
      name: watchlist.name,
      query: watchlist.query,
      categories: watchlist.categories || "",
      sourceTypes: watchlist.sourceTypes || "",
      statuses: watchlist.statuses || "pending,approved",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (watchlist: any) => {
    setSelectedWatchlist(watchlist);
    setShowDeleteModal(true);
  };

  const handleDeleteWatchlist = () => {
    deleteWatchlistMutation.mutate({ id: selectedWatchlist.id });
  };

  const handleSelectAlert = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === alerts.length && alerts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alerts.map((a: any) => a.alert?.id || a.id)));
    }
  };

  const selectedAlertsForExport = alerts.filter((a: any) => selectedIds.has(a.alert?.id || a.id));
  const allAlertsForExport = alerts;

  const handleExportCsv = (itemsToExport: any[], type: 'filtered' | 'selected') => {
    if (!itemsToExport.length) {
      toast.error("❌ لا توجد عناصر للتصدير");
      return;
    }
    const csv = buildAlertsCsv(itemsToExport);
    const filename = makeCsvFileName(type === 'filtered' ? 'alerts_filtered' : 'alerts_selected');
    downloadCsvFile(csv, filename);
    toast.success("✅ تم تحميل الملف");
  };

  return (
    <AdminPage title="مركز التنبيهات والمراقبة">
      <WatchlistTemplatesModal
        open={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      {/* Create/Edit Watchlist Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? "تعديل قائمة المراقبة" : "إنشاء قائمة مراقبة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الاسم</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم قائمة المراقبة"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الاستعلام</label>
              <Input
                value={formData.query}
                onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                placeholder="استعلام البحث"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الفئات (اختياري)</label>
              <Input
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                placeholder="مثال: religion,charity"
              />
            </div>
            <div>
              <label className="text-sm font-medium">أنواع المصادر (اختياري)</label>
              <Input
                value={formData.sourceTypes}
                onChange={(e) => setFormData({ ...formData, sourceTypes: e.target.value })}
                placeholder="مثال: news,article"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الحالات</label>
              <Input
                value={formData.statuses}
                onChange={(e) => setFormData({ ...formData, statuses: e.target.value })}
                placeholder="مثال: pending,approved"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={showEditModal ? handleEditWatchlist : handleCreateWatchlist}
                disabled={updateWatchlistMutation.isPending || createWatchlistMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {showEditModal ? "حفظ التعديلات" : "إنشاء"}
              </Button>
              <Button
                onClick={() => {
                  if (!formData.name.trim()) {
                    toast.error("❌ خطأ", { description: "يرجى إدخال اسم القالب" });
                    return;
                  }
                  createTemplateMutation.mutate({
                    name: formData.name,
                    description: `قالب من ${new Date().toLocaleDateString('ar')}`,
                    query: formData.query,
                    categories: formData.categories || undefined,
                    sourceTypes: formData.sourceTypes || undefined,
                    statuses: formData.statuses,
                  });
                }}
                disabled={createTemplateMutation.isPending}
                variant="secondary"
              >
                💾 حفظ كقالب
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Watchlist Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-sm">هل أنت متأكد من رغبتك في حذف قائمة المراقبة "{selectedWatchlist?.name}"؟</p>
          <div className="flex gap-2">
            <Button
              onClick={handleDeleteWatchlist}
              disabled={deleteWatchlistMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Modal */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف متعدد</DialogTitle>
          </DialogHeader>
          <p className="text-sm">هل أنت متأكد من رغبتك في حذف {selectedIds.size} تنبيه؟</p>
          <div className="flex gap-2">
            <Button
              onClick={() => bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) })}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </Button>
            <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Details Modal */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && closeAlertDetails()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل التنبيه</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">العنوان:</span>
                <p className="mt-1 text-muted-foreground break-words">{selectedAlert.title || '—'}</p>
              </div>
              <div>
                <span className="font-semibold">الرابط:</span>
                {selectedAlert.url ? (
                  <a href={selectedAlert.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block mt-1">
                    {selectedAlert.url}
                  </a>
                ) : (
                  <p className="mt-1 text-muted-foreground">—</p>
                )}
              </div>
              <div>
                <span className="font-semibold">قائمة المراقبة:</span>
                <p className="mt-1 text-muted-foreground">{getWatchlistName(selectedAlert)}</p>
              </div>
              <div>
                <span className="font-semibold">النقاط:</span>
                <p className="mt-1 text-muted-foreground">{selectedAlert.score || '—'}</p>
              </div>
              <div>
                <span className="font-semibold">المطابقة:</span>
                <p className="mt-1 text-muted-foreground">{getMatchedOn(selectedAlert)}</p>
              </div>
              <div>
                <span className="font-semibold">التاريخ:</span>
                <p className="mt-1 text-muted-foreground">{formatDateTime(selectedAlert.created_at || selectedAlert.createdAt)}</p>
              </div>
              <div>
                <span className="font-semibold">الحالة:</span>
                <p className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${statusBadgeClass(selectedAlert.status)}`}>
                  {selectedAlert.status || '—'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Statistics Section */}
      {statsQuery.data && (
        <AdminCard title="إحصائيات التنبيهات">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-muted-foreground">إجمالي التنبيهات</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">{statsQuery.data.totalAlerts}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-xs text-muted-foreground">جديد</div>
              <div className="text-2xl font-bold text-yellow-700 mt-1">{statsQuery.data.newAlerts}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded border border-orange-200">
              <div className="text-xs text-muted-foreground">مشاهد</div>
              <div className="text-2xl font-bold text-orange-700 mt-1">{statsQuery.data.seenAlerts}</div>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-muted-foreground">منتهي</div>
              <div className="text-2xl font-bold text-green-700 mt-1">{statsQuery.data.doneAlerts}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <div className="text-xs text-muted-foreground">قوائم نشطة</div>
              <div className="text-2xl font-bold text-purple-700 mt-1">{watchlistsQuery.data?.length || 0}</div>
            </div>
          </div>
          {statsQuery.data.topWatchlists.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm font-semibold mb-2">أفضل قوائم المراقبة</div>
              <div className="space-y-2">
                {statsQuery.data.topWatchlists.map((w, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                    <span>{w.name}</span>
                    <span className="font-semibold text-blue-600">{w.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AdminCard>
      )}

      {/* 7-Day Trend Section */}
      {trendQuery.data && (
        <AdminCard title="ملخص آخر 7 أيام">
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {trendQuery.data.days.map((day) => (
                <div key={day.date} className="p-2 bg-slate-50 rounded border border-slate-200 text-center">
                  <div className="text-xs text-muted-foreground">{day.date.split('-').slice(1).join('/')}</div>
                  <div className="text-lg font-bold text-slate-700 mt-1">{day.count}</div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">إجمالي الـ 7 أيام:</span>
                <span className="font-semibold text-blue-600">{trendQuery.data.totalCreated}</span>
              </div>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Control Panel */}
      <AdminCard title="لوحة التحكم">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => runWatchlistsMutation.mutate({})}
              disabled={runWatchlistsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {runWatchlistsMutation.isPending ? "جاري التشغيل..." : "تشغيل قوائم المراقبة"}
            </Button>

            <Button
              size="sm"
              onClick={() => setShowTemplatesModal(true)}
              variant="outline"
            >
              من قالب
            </Button>

            <Button
              size="sm"
              onClick={() => setShowPublicTemplatesModal(true)}
              variant="outline"
            >
              🌐 قوالب عامة
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setShowCreateModal(true);
                setSelectedWatchlist(null);
                setFormData({
                  name: "",
                  query: "",
                  categories: "",
                  sourceTypes: "",
                  statuses: "pending,approved",
                });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              إنشاء قائمة مراقبة جديدة
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            عدد قوائم المراقبة: {watchlistsQuery.data?.length || 0}
          </div>
        </div>
      </AdminCard>

      {/* Watchlists List */}
      {watchlistsQuery.data && watchlistsQuery.data.length > 0 && (
        <AdminCard title="قوائم المراقبة النشطة">
          <div className="space-y-2">
            {watchlistsQuery.data.map((w: any) => (
              <div
                key={w.id}
                className="p-3 bg-card border border-border rounded flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-sm text-muted-foreground">الاستعلام: {w.query}</div>
                  {w.categories && (
                    <div className="text-xs text-muted-foreground">الفئات: {w.categories}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(w)}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDeleteModal(w)}
                  >
                    حذف
                  </Button>
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    {w.isActive ? "✓ نشط" : "✗ معطل"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleExportCsv(allAlertsForExport, 'filtered')}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={() => handleExportCsv(selectedAlertsForExport, 'selected')}
          disabled={!selectedAlertsForExport.length}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export Selected CSV
        </button>
      </div>

      {/* Filters */}
      <AdminCard title="الفلاتر والبحث">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">البحث</label>
              <Input
                value={filters.q}
                onChange={(e) => {
                  setFilters({ ...filters, q: e.target.value });
                  setCurrentOffset(0);
                }}
                placeholder="ابحث عن عنوان أو رابط..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setCurrentOffset(0);
                }}
                className="w-full px-3 py-2 border border-border rounded"
              >
                <option value="all">الكل</option>
                <option value="new">جديد</option>
                <option value="seen">مشاهد</option>
                <option value="done">منتهي</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">قائمة المراقبة</label>
              <select
                value={filters.watchlistId}
                onChange={(e) => {
                  setFilters({ ...filters, watchlistId: e.target.value });
                  setCurrentOffset(0);
                }}
                className="w-full px-3 py-2 border border-border rounded"
              >
                <option value="all">الكل</option>
                {watchlistsQuery.data?.map((w: any) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">الحد الأدنى للنقاط</label>
              <Input
                type="number"
                value={filters.minScore}
                onChange={(e) => {
                  setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 });
                  setCurrentOffset(0);
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">من التاريخ</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters({ ...filters, dateFrom: e.target.value });
                  setCurrentOffset(0);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">إلى التاريخ</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters({ ...filters, dateTo: e.target.value });
                  setCurrentOffset(0);
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setFilters({
                  status: "all",
                  watchlistId: "all",
                  q: "",
                  minScore: 0,
                  dateFrom: "",
                  dateTo: "",
                });
                setCurrentOffset(0);
              }}
              variant="outline"
            >
              إعادة تعيين
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded flex justify-between items-center mb-4">
          <span className="text-sm font-medium">تم تحديد {selectedIds.size} عنصر</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => bulkMarkSeenMutation.mutate({ ids: Array.from(selectedIds) })}
              disabled={bulkMarkSeenMutation.isPending}
            >
              تحديد كمشاهد
            </Button>
            <Button
              size="sm"
              onClick={() => bulkMarkDoneMutation.mutate({ ids: Array.from(selectedIds) })}
              disabled={bulkMarkDoneMutation.isPending}
            >
              تحديد كمنتهي
            </Button>
            <Button
              size="sm"
              onClick={() => setShowBulkDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </Button>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      <AdminCard title={`التنبيهات (${alerts.length})`}>
        {alertsQuery.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد تنبيهات حالياً
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right p-3 w-12">
                      <Checkbox
                        checked={selectedIds.size === alerts.length && alerts.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3">قائمة المراقبة</th>
                    <th className="text-right p-3">العنوان</th>
                    <th className="text-right p-3">النقاط</th>
                    <th className="text-right p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert: any) => (
                    <tr key={alert.alert.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 w-12">
                        <Checkbox
                          checked={selectedIds.has(alert.alert.id)}
                          onChange={() => handleSelectAlert(alert.alert.id)}
                        />
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${statusBadgeClass(
                            alert.alert.status
                          )}`}
                        >
                          {alert.alert.status || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{getWatchlistName(alert)}</td>
                      <td className="p-3 text-sm max-w-xs truncate">
                        <button
                          onClick={() => openAlertDetails(alert.alert)}
                          className="text-blue-600 hover:underline"
                        >
                          {alert.alert.title || '—'}
                        </button>
                      </td>
                      <td className="p-3 text-sm">{alert.alert.score || '—'}</td>
                      <td className="p-3 text-sm space-x-2">
                        <button
                          onClick={() => markSeenMutation.mutate({ id: alert.alert.id })}
                          className="text-blue-600 hover:underline"
                        >
                          مشاهد
                        </button>
                        <button
                          onClick={() => markDoneMutation.mutate({ id: alert.alert.id })}
                          className="text-green-600 hover:underline"
                        >
                          منتهي
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => setCurrentOffset(Math.max(0, currentOffset - 50))}
                disabled={currentOffset === 0}
                variant="outline"
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                الصفحة {Math.floor(currentOffset / 50) + 1}
              </span>
              <Button
                onClick={() => setCurrentOffset(currentOffset + 50)}
                disabled={!hasMore}
                variant="outline"
              >
                التالي
              </Button>
            </div>
          </>
        )}
      </AdminCard>

      {/* Public Templates Gallery Modal */}
      <Dialog open={showPublicTemplatesModal} onOpenChange={setShowPublicTemplatesModal}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🌐 معرض القوالب العامة</DialogTitle>
          </DialogHeader>
          {publicTemplatesQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (publicTemplatesQuery.data || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد قوالب عامة</div>
          ) : (
            <div className="space-y-3">
              {(publicTemplatesQuery.data || []).map((template: any) => (
                <div key={template.id} className="border border-border rounded-lg p-3 hover:bg-muted/50">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">الاستعلام: {template.query}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setFormData({
                          name: template.name,
                          query: template.query,
                          categories: template.categories || "",
                          sourceTypes: template.sourceTypes || "",
                          statuses: template.statuses || "pending,approved",
                        });
                        setShowPublicTemplatesModal(false);
                        setShowCreateModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      استخدم
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
