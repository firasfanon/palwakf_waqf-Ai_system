import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, Loader2, Sparkles, ThumbsUp, ThumbsDown, Calendar, Filter, X, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import TableSkeleton from "@/components/TableSkeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import AdminPage from "@/components/admin/ui/AdminPage";

export default function FetchedContentReview() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [category, setCategory] = useState<string>("");
  const [sourceId, setSourceId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Smart Processing editor state
  const [editAiCategory, setEditAiCategory] = useState<string>("");
  const [editAiKeywords, setEditAiKeywords] = useState<string>("");
  const [editAiSummary, setEditAiSummary] = useState<string>("");
  const [editTags, setEditTags] = useState<string>("");
  const [editRelevanceScore, setEditRelevanceScore] = useState<number>(50);

  // Sync editor state when previewItem changes
  useEffect(() => {
    if (previewItem) {
      setEditAiCategory(previewItem.aiCategory || "");
      setEditAiKeywords(previewItem.aiKeywords || "");
      setEditAiSummary(previewItem.aiSummary || "");
      setEditTags(previewItem.tags || "");
      setEditRelevanceScore(previewItem.relevanceScore ?? 50);
    }
  }, [previewItem?.id]);

  // Fetch knowledge sources for filter
  const { data: sourcesData } = trpc.knowledgeSources.list.useQuery({});

  // Fetch data
  const { data, isLoading, refetch } = trpc.fetchedContent.list.useQuery({
    status,
    category: (category && category !== 'all_categories') ? category : undefined,
    search: search || undefined,
    sourceId: sourceId && sourceId !== 'all_sources' ? parseInt(sourceId) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit,
    offset: page * limit,
  });
  
  // Debug logging
  useEffect(() => {
    console.log("FetchedContentReview data:", { data, isLoading, status });
  }, [data, isLoading, status]);

  // Mutations
  const approveMutation = trpc.fetchedContent.approve.useMutation({
    onSuccess: () => {
      toast.success("تم نقل المحتوى إلى قاعدة المعرفة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.fetchedContent.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض المحتوى بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveMultipleMutation = trpc.fetchedContent.approveMultiple.useMutation({
    onSuccess: (result) => {
      toast.success(`تمت الموافقة على ${result.successCount} عنصر، فشل ${result.errorCount} عنصر`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMultipleMutation = trpc.fetchedContent.rejectMultiple.useMutation({
    onSuccess: (result) => {
      toast.success(`تم رفض ${result.successCount} عنصر، فشل ${result.errorCount} عنصر`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const classifyItemMutation = trpc.fetchedContent.classifyItem.useMutation({
    onSuccess: (result) => {
      toast.success("تم التصنيف بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const classifyMultipleMutation = trpc.fetchedContent.classifyMultiple.useMutation({
    onSuccess: (result) => {
      toast.success(`تم تصنيف ${result.successCount} عنصر، فشل ${result.errorCount} عنصر`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rateClassificationMutation = trpc.fetchedContent.rateClassification.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ التقييم بنجاح");
      refetch();
      ratingsStatsRefetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Smart Processing mutations
  const processOneMutation = trpc.smartProcessing.processOne.useMutation({
    onSuccess: (result) => {
      toast.success(`تمت المعالجة بنجاح: ${result.category || ""} (${((result.confidence ?? 0) * 100).toFixed(0)}%)`);
      refetch();
      // Update previewItem with new AI data
      if (previewItem) {
        setPreviewItem((prev: any) => ({
          ...prev,
          aiCategory: result.category,
          aiKeywords: result.keywords?.join(", "),
          aiSummary: result.summary,
          aiConfidence: result.confidence,
          aiReasoning: result.reasoning,
        }));
        setEditAiCategory(result.category || "");
        setEditAiKeywords(result.keywords?.join(", ") || "");
        setEditAiSummary(result.summary || "");
        setEditRelevanceScore(result.relevanceScore ?? 50);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const processPendingMutation = trpc.smartProcessing.processPending.useMutation({
    onSuccess: (result) => {
      toast.success(`معالجة مجمّعة: نجح ${result.successCount}، فشل ${result.errorCount}`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateOneMutation = trpc.smartProcessing.updateOne.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ التعديلات بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const extractPdfMutation = trpc.pdfExtraction.extractOne.useMutation({
    onSuccess: (result) => {
      toast.success("تم استخراج حقول PDF بنجاح");
      refetch();
      if (previewItem) {
        setPreviewItem((prev: any) => ({
          ...prev,
          docType: result.fields?.docType,
          docDate: result.fields?.docDate,
          docNumber: result.fields?.docNumber,
          issuer: result.fields?.issuer,
          language: result.fields?.language,
          pageCount: result.fields?.pageCount,
          intakeRoute: result.fields?.intakeRoute,
          intakeReason: result.fields?.intakeReason,
          intakeConfidence: result.fields?.intakeConfidence,
          extractedAt: result.fields?.extractedAt,
          extractionError: result.fields?.extractionError,
        }));
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Fetch ratings statistics
  const { data: ratingsStats, refetch: ratingsStatsRefetch } = trpc.fetchedContent.getRatingsStats.useQuery();
  const { data: reviewEvents } = trpc.fetchedContent.getReviewEvents.useQuery(
    { id: previewItem?.id ?? 0 },
    { enabled: !!previewItem?.id }
  );
  const { data: platformContext, isLoading: platformContextLoading } = trpc.fetchedContent.resolvePlatformContext.useQuery(
    { id: previewItem?.id ?? 0 },
    { enabled: !!previewItem?.id }
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = data?.items.filter(item => item.status === "pending").map(item => item.id) || [];
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("");
    setSourceId("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const hasActiveFilters = search || status !== "all" || category || (sourceId && sourceId !== 'all_sources') || dateFrom || dateTo;

  const getCategoryLabel = (cat: string | null) => {
    const labels: Record<string, string> = {
      law: "قانوني",
      jurisprudence: "فقهي",
      majalla: "مجلة الأحكام",
      historical: "تاريخي",
      administrative: "إداري",
      reference: "مرجع",
    };
    return cat ? labels[cat] || cat : "غير محدد";
  };

  const getIntakeRouteMeta = (route?: string | null) => {
    switch (route) {
      case "knowledge":
        return {
          label: "يدخل قاعدة المعرفة",
          className: "cleanup-surface-success",
        };
      case "review_only":
        return {
          label: "مراجعة فقط",
          className: "cleanup-surface-warning",
        };
      case "reject":
        return {
          label: "يُستبعد من مسار المعرفة",
          className: "cleanup-surface-danger",
        };
      default:
        return null;
    }
  };

  const getReviewEventLabel = (eventType?: string | null) => {
    const labels: Record<string, string> = {
      route: "قرار التوجيه",
      extraction: "استخراج PDF",
      classification: "تصنيف",
      decision: "قرار مراجعة",
      approval: "اعتماد",
      rejection: "رفض",
      manual_update: "تعديل يدوي",
      bulk_action: "إجراء جماعي",
    };
    return eventType ? labels[eventType] || eventType : "حدث";
  };

  const getReviewEventTone = (eventType?: string | null) => {
    switch (eventType) {
      case "approval":
        return "cleanup-surface-success";
      case "rejection":
        return "cleanup-surface-danger";
      case "classification":
      case "extraction":
        return "cleanup-surface-info";
      default:
        return "bg-muted/40 border-border";
    }
  };

  const formatPlatformCardTitle = (item: any) => {
    if (!item) return "";
    return item?.nameAr || item?.nameEn || item?.endowmentName || item?.slug || item?.nationalAssetCode || (item?.id != null ? `#${item.id}` : "");
  };

  const platformMatchesCount =
    (platformContext?.waqfAssets?.length || 0) +
    (platformContext?.endowments?.length || 0) +
    (platformContext?.orgUnits?.length || 0);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "قيد المراجعة",
      approved: "معتمد",
      rejected: "مرفوض",
      processing: "قيد المعالجة",
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "default",
      approved: "success",
      rejected: "destructive",
      processing: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  return (
    <AdminPage>
<div className="container py-8 admin-page-cleanup" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">مراجعة المحتوى المجلوب</h1>
        <p className="text-muted-foreground">
          راجع وافحص المحتوى المجلوب من المصادر الخارجية قبل إضافته إلى قاعدة المعرفة
        </p>

        {/* Classification Ratings Statistics */}
        {ratingsStats && ratingsStats.total > 0 && (
          <div className="mt-4 p-4 rounded-lg cleanup-surface-info">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التقييمات</p>
                  <p className="text-2xl font-bold">{ratingsStats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تقييمات إيجابية</p>
                  <p className="text-2xl font-bold text-green-600">{ratingsStats.positive}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تقييمات سلبية</p>
                  <p className="text-2xl font-bold text-red-600">{ratingsStats.negative}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">معدل الدقة</p>
                  <p className="text-2xl font-bold text-blue-600">{ratingsStats.accuracyRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>الفلاتر المتقدمة</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                <X className="ml-2 h-4 w-4" />
                إعادة تعيين
              </Button>
            )}
          </div>
          <CardDescription>
            استخدم الفلاتر لتضييق نطاق البحث وإيجاد المحتوى المطلوب بسرعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>بحث في العنوان أو المحتوى</Label>
              <Input
                placeholder="ابحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_categories">الكل</SelectItem>
                  <SelectItem value="law">قانوني</SelectItem>
                  <SelectItem value="jurisprudence">فقهي</SelectItem>
                  <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                  <SelectItem value="historical">تاريخي</SelectItem>
                  <SelectItem value="administrative">إداري</SelectItem>
                  <SelectItem value="reference">مرجع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>المصدر</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المصدر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_sources">الكل</SelectItem>
                  {sourcesData?.map((source: any) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Pending Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data && `إجمالي: ${data.total} عنصر`}
        </div>
        <Button
          variant="secondary"
          onClick={() => processPendingMutation.mutate({ limit: 20 })}
          disabled={processPendingMutation.isPending}
        >
          {processPendingMutation.isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="ml-2 h-4 w-4" />
          )}
          معالجة الكل (Pending)
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            تم تحديد {selectedIds.length} عنصر
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => classifyMultipleMutation.mutate({ ids: selectedIds })}
              disabled={classifyMultipleMutation.isPending}
            >
              {classifyMultipleMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <Sparkles className="ml-2 h-4 w-4" />
              تصنيف تلقائي
            </Button>
            <Button
              size="sm"
              onClick={() => approveMultipleMutation.mutate({ ids: selectedIds })}
              disabled={approveMultipleMutation.isPending}
            >
              {approveMultipleMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="ml-2 h-4 w-4" />
              موافقة جماعية
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => rejectMultipleMutation.mutate({ ids: selectedIds })}
              disabled={rejectMultipleMutation.isPending}
            >
              {rejectMultipleMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <XCircle className="ml-2 h-4 w-4" />
              رفض جماعي
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === data?.items.filter(i => i.status === "pending").length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-center">العنوان</TableHead>
              <TableHead className="text-center">المصدر</TableHead>
              <TableHead className="text-center">الفئة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">تاريخ الجلب</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={5} />
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">
                    {item.status === "pending" && (
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">
                    {item.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sourcesData?.find((s: any) => s.id === item.sourceId)?.name || "غير معروف"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getCategoryLabel(item.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.fetchedAt), "dd MMM yyyy", { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="معالجة ذكية"
                            onClick={() => processOneMutation.mutate({ id: item.id })}
                            disabled={processOneMutation.isPending}
                          >
                            {processOneMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4 text-yellow-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => classifyItemMutation.mutate({ id: item.id })}
                            disabled={classifyItemMutation.isPending}
                          >
                            {classifyItemMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => approveMutation.mutate({ id: item.id })}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rejectMutation.mutate({ id: item.id })}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            عرض {page * limit + 1} - {Math.min((page + 1) * limit, data.total)} من {data.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= data.total}
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewItem?.title}</DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              {getStatusBadge(previewItem?.status)}
              <Badge variant="secondary">{getCategoryLabel(previewItem?.category)}</Badge>
              <Badge variant="outline">
                {sourcesData?.find((s: any) => s.id === previewItem?.sourceId)?.name || "غير معروف"}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          
          {previewItem && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الجلب</p>
                  <p className="font-medium">
                    {format(new Date(previewItem.fetchedAt), "dd MMMM yyyy - HH:mm", { locale: ar })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الرابط الأصلي</p>
                  <a 
                    href={previewItem.url || previewItem.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm truncate block"
                  >
                    {previewItem.url || previewItem.sourceUrl || "—"}
                  </a>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold mb-2">المحتوى:</h3>
                <div className="prose prose-sm max-w-none p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{previewItem.content}</p>
                </div>
              </div>

              {/* Smart Processing - Process Button */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">المعالجة الذكية (Rule-based)</span>
                  {previewItem.processedAt && (
                    <Badge variant="outline" className="text-xs">تمت المعالجة</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    processOneMutation.mutate({ id: previewItem.id });
                  }}
                  disabled={processOneMutation.isPending}
                >
                  {processOneMutation.isPending ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="ml-2 h-4 w-4" />
                  )}
                  معالجة
                </Button>
              </div>

              {/* AI Classification */}
              {previewItem.aiCategory && (
                <div className="p-4 rounded-lg cleanup-surface-info">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold">التصنيف الذكي</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rateClassificationMutation.mutate({
                          fetchedContentId: previewItem.id,
                          isAccurate: true,
                        })}
                        disabled={rateClassificationMutation.isPending}
                      >
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rateClassificationMutation.mutate({
                          fetchedContentId: previewItem.id,
                          isAccurate: false,
                        })}
                        disabled={rateClassificationMutation.isPending}
                      >
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">الفئة المقترحة: </span>
                      <Badge variant="secondary">{getCategoryLabel(previewItem.aiCategory)}</Badge>
                    </div>
                    {previewItem.aiConfidence && (
                      <div>
                        <span className="text-sm text-muted-foreground">مستوى الثقة: </span>
                        <span className="font-medium">{(previewItem.aiConfidence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {previewItem.aiReasoning && (
                      <div>
                        <span className="text-sm text-muted-foreground">التفسير: </span>
                        <p className="text-sm mt-1">{previewItem.aiReasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PDF Extraction */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">استخراج حقول PDF</span>
                  {previewItem.extractedAt && (
                    <Badge variant="outline" className="text-xs">تم الاستخراج</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    extractPdfMutation.mutate({ id: previewItem.id });
                  }}
                  disabled={extractPdfMutation.isPending}
                >
                  {extractPdfMutation.isPending ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="ml-2 h-4 w-4" />
                  )}
                  استخراج الحقول
                </Button>
              </div>

              {/* PDF Fields Display */}
              {previewItem.extractedAt && (
                <div className="p-4 rounded-lg cleanup-surface-info">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold">حقول PDF المستخرجة</h3>
                  </div>
                  {previewItem.intakeRoute && (
                    <div className="mb-3 rounded-lg border p-3 cleanup-file-preview">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">قرار التوجيه:</span>
                        {(() => {
                          const intakeMeta = getIntakeRouteMeta(previewItem.intakeRoute);
                          return intakeMeta ? (
                            <Badge variant="outline" className={intakeMeta.className}>{intakeMeta.label}</Badge>
                          ) : null;
                        })()}
                        {typeof previewItem.intakeConfidence === 'number' && (
                          <span className="text-xs text-muted-foreground">
                            ثقة: {(previewItem.intakeConfidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {previewItem.intakeReason && (
                        <p className="mt-2 text-sm text-muted-foreground">{previewItem.intakeReason}</p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {previewItem.docType && (
                      <div>
                        <span className="text-muted-foreground">نوع الوثيقة: </span>
                        <span className="font-medium">{previewItem.docType}</span>
                      </div>
                    )}
                    {previewItem.docDate && (
                      <div>
                        <span className="text-muted-foreground">التاريخ: </span>
                        <span className="font-medium">{previewItem.docDate}</span>
                      </div>
                    )}
                    {previewItem.docNumber && (
                      <div>
                        <span className="text-muted-foreground">الرقم: </span>
                        <span className="font-medium">{previewItem.docNumber}</span>
                      </div>
                    )}
                    {previewItem.issuer && (
                      <div>
                        <span className="text-muted-foreground">الجهة: </span>
                        <span className="font-medium">{previewItem.issuer}</span>
                      </div>
                    )}
                    {previewItem.language && (
                      <div>
                        <span className="text-muted-foreground">اللغة: </span>
                        <span className="font-medium">{previewItem.language === 'ar' ? 'عربي' : 'إنجليزي'}</span>
                      </div>
                    )}
                    {previewItem.pageCount && (
                      <div>
                        <span className="text-muted-foreground">عدد الصفحات: </span>
                        <span className="font-medium">{previewItem.pageCount}</span>
                      </div>
                    )}
                  </div>
                  {previewItem.extractionError && (
                    <div className="mt-2 p-2 rounded text-sm cleanup-surface-danger">
                      خطأ: {previewItem.extractionError}
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold">سياق المنصة المرتبط</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {platformContextLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Badge variant="outline">{platformMatchesCount} مطابقات</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-muted-foreground mb-1">سياق المراجع الحالي</p>
                    <p className="font-medium">الدور: {platformContext?.userScope?.platformRole || 'غير محدد'}</p>
                    <p className="text-muted-foreground">الوحدة: {formatPlatformCardTitle(platformContext?.userScope?.orgUnit) || platformContext?.userScope?.unitId || 'غير محددة'}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-muted-foreground mb-1">استدلال مرجعي</p>
                    <p className="font-medium">العنوان + رقم الوثيقة + الجهة</p>
                    <p className="text-muted-foreground line-clamp-2">{[previewItem.title, previewItem.docNumber, previewItem.issuer].filter(Boolean).join(' • ') || 'لا توجد إشارات كافية بعد'}</p>
                  </div>
                </div>

                {(platformContext?.waqfAssets?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">أصول وقفية مطابقة</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {platformContext?.waqfAssets?.map((asset: any) => (
                        <div key={`asset-${asset.id}`} className="rounded-lg border p-3 cleanup-surface-warning">
                          <p className="font-medium">{formatPlatformCardTitle(asset)}</p>
                          <p className="text-xs text-muted-foreground mt-1">الرمز الوطني: {asset.nationalAssetCode || '—'}</p>
                          <p className="text-xs text-muted-foreground">الوقف الأم: {asset.endowmentName || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(platformContext?.endowments?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">أوقاف أم مرجعية مطابقة</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {platformContext?.endowments?.map((endowment: any) => (
                        <div key={`endowment-${endowment.id}`} className="rounded-lg border p-3 cleanup-surface-info">
                          <p className="font-medium">{formatPlatformCardTitle(endowment)}</p>
                          <p className="text-xs text-muted-foreground mt-1">النوع: {endowment.type || '—'}</p>
                          <p className="text-xs text-muted-foreground">الحالة: {endowment.status || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(platformContext?.orgUnits?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">وحدات تنظيمية ذات صلة</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {platformContext?.orgUnits?.map((unit: any) => (
                        <div key={`unit-${unit.id}`} className="rounded-lg border p-3 cleanup-surface-success">
                          <p className="font-medium">{formatPlatformCardTitle(unit)}</p>
                          <p className="text-xs text-muted-foreground mt-1">slug: {unit.slug || '—'}</p>
                          <p className="text-xs text-muted-foreground">النوع: {unit.unitType || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!platformContextLoading && platformMatchesCount === 0 && (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    لم يتم العثور على ربط مرجعي واضح داخل بيانات المنصة لهذا المحتوى بعد.
                  </div>
                )}
              </div>

              {reviewEvents && reviewEvents.length > 0 && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold">سجل المراجعة والاعتماد</h3>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {reviewEvents.map((event: any) => (
                      <div key={event.id} className={`rounded-lg border p-3 ${getReviewEventTone(event.eventType)}`}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{getReviewEventLabel(event.eventType)}</Badge>
                            {event.route && (() => {
                              const intakeMeta = getIntakeRouteMeta(event.route);
                              return intakeMeta ? <Badge variant="outline" className={intakeMeta.className}>{intakeMeta.label}</Badge> : null;
                            })()}
                            {event.nextStatus && <span>{getStatusBadge(event.nextStatus)}</span>}
                            {event.confidence && (
                              <span className="text-xs text-muted-foreground">ثقة: {Math.round(Number(event.confidence) * 100)}%</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{event.createdAt ? format(new Date(event.createdAt), 'PPp', { locale: ar }) : '—'}</span>
                        </div>
                        {event.notes && <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Processing Results */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold">تعديل نتائج المعالجة</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label>التصنيف</Label>
                    <Select
                      value={editAiCategory || previewItem.aiCategory || ""}
                      onValueChange={setEditAiCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="law">قانوني</SelectItem>
                        <SelectItem value="jurisprudence">فقهي</SelectItem>
                        <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                        <SelectItem value="historical">تاريخي</SelectItem>
                        <SelectItem value="administrative">إداري</SelectItem>
                        <SelectItem value="reference">مرجع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>الكلمات المفتاحية (مفصولة بفاصلة)</Label>
                    <Input
                      value={editAiKeywords || (previewItem.aiKeywords || "")}
                      onChange={(e) => setEditAiKeywords(e.target.value)}
                      placeholder="وقف، إسلام، فلسطين، ..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>الملخص</Label>
                    <Textarea
                      value={editAiSummary || (previewItem.aiSummary || "")}
                      onChange={(e) => setEditAiSummary(e.target.value)}
                      placeholder="ملخص قصير للمحتوى..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>الوسوم (مفصولة بفاصلة)</Label>
                    <Input
                      value={editTags || (previewItem.tags || "")}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="وقف، تاريخ، ..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>درجة الصلة (0-100): {editRelevanceScore || previewItem.relevanceScore || 50}</Label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editRelevanceScore || previewItem.relevanceScore || 50}
                      onChange={(e) => setEditRelevanceScore(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const cat = editAiCategory || previewItem.aiCategory;
                    if (!cat) { toast.error("يرجى اختيار التصنيف أولاً"); return; }
                    updateOneMutation.mutate({
                      id: previewItem.id,
                      aiCategory: cat as any,
                      aiKeywords: (editAiKeywords || previewItem.aiKeywords || "").split(",").map((k: string) => k.trim()).filter(Boolean),
                      aiSummary: editAiSummary || previewItem.aiSummary || "",
                      tags: (editTags || previewItem.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
                      relevanceScore: editRelevanceScore || previewItem.relevanceScore || 50,
                    });
                  }}
                  disabled={updateOneMutation.isPending}
                >
                  {updateOneMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  حفظ التعديلات
                </Button>
              </div>

              {/* Actions */}
              {previewItem.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      rejectMutation.mutate({ id: previewItem.id });
                      setPreviewItem(null);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="ml-2 h-4 w-4" />
                    رفض
                  </Button>
                  <Button
                    onClick={() => {
                      approveMutation.mutate({ id: previewItem.id });
                      setPreviewItem(null);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="ml-2 h-4 w-4" />
                    موافقة
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminPage>
  );
}
