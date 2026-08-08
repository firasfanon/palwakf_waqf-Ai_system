import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, BookOpen, Eye, ShieldCheck, FileCheck2, Files, Clock3 } from "lucide-react";
import TableSkeleton from "@/components/TableSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkUpload from "@/components/BulkUpload";

type KnowledgeDocument = {
  id: number | string;
  uuid?: string | null;
  title: string;
  content: string;
  category: string;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string | null;
  isActive: boolean | number;
  isChatEligible?: boolean | number;
  status?: 'draft' | 'review_only' | 'approved' | 'rejected' | string | null;
  reviewDecision?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | Date | null;
  reviewedBy?: number | null;
  approvalVersion?: number | null;
  toolOrigin?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

type FormData = {
  title: string;
  content: string;
  category: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  source: string;
  sourceUrl: string;
  pdfUrl?: string;
  tags: string;
};

const categoryLabels: Record<string, string> = {
  law: "قانوني",
  jurisprudence: "فقهي",
  majalla: "مجلة الأحكام",
  historical: "تاريخي",
  administrative: "إداري",
  reference: "مرجع",
};

type ReviewStatus = "draft" | "review_only" | "approved" | "rejected";

const defaultFormData: FormData = {
  title: "",
  content: "",
  category: "reference",
  source: "",
  sourceUrl: "",
  pdfUrl: "",
  tags: "",
};

const statusLabels: Record<string, string> = {
  all: "جميع الحالات",
  draft: "مسودة",
  review_only: "للمراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

const getResolvedStatus = (doc: KnowledgeDocument): ReviewStatus | string => {
  return doc.status || (Number(doc.isActive) === 1 ? "approved" : "draft");
};

const getDocumentStorageKind = (doc: KnowledgeDocument): "local" | "assistant_reference" => {
  if (typeof doc.id === "number") return "local";
  if (typeof doc.id === "string" && /^\d+$/.test(doc.id)) return "local";
  return "assistant_reference";
};

const isReadOnlyDoc = (doc: KnowledgeDocument) => getDocumentStorageKind(doc) === "assistant_reference";


export default function ManageKnowledge() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState<KnowledgeDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("review_only");
  const [reviewNotes, setReviewNotes] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.knowledge.adminList.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const resolvedDocuments = useMemo(() => documents ?? [], [documents]);

  const counts = useMemo(() => {
    const total = resolvedDocuments.length;
    const approved = resolvedDocuments.filter((doc: KnowledgeDocument) => getResolvedStatus(doc) === "approved").length;
    const reviewOnly = resolvedDocuments.filter((doc: KnowledgeDocument) => getResolvedStatus(doc) === "review_only").length;
    const localDocs = resolvedDocuments.filter((doc: KnowledgeDocument) => !isReadOnlyDoc(doc)).length;
    return { total, approved, reviewOnly, localDocs };
  }, [resolvedDocuments]);

  const createMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      utils.knowledge.adminList.invalidate();
      closeDialog();
      alert("تم إضافة المرجع بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const updateMutation = trpc.knowledge.update.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      utils.knowledge.adminList.invalidate();
      closeDialog();
      alert("تم تحديث المرجع بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const deleteMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      utils.knowledge.adminList.invalidate();
      alert("تم حذف المرجع بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const reviewMutation = trpc.knowledge.setReviewStatus.useMutation({
    onSuccess: () => {
      utils.knowledge.adminList.invalidate();
      utils.knowledge.list.invalidate();
      if (reviewingDoc) {
        utils.knowledge.getById.invalidate({ id: reviewingDoc.id as any });
        utils.knowledge.reviewTrace.invalidate({ id: reviewingDoc.id as any });
      }
      closeReviewDialog();
      alert("تم تحديث حالة المراجعة بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const uploadPdfMutation = trpc.knowledge.uploadPdf.useMutation();

  const resetFormState = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setPdfFile(null);
    setIsUploading(false);
  };

  const openAddDialog = () => {
    resetFormState();
    setIsDialogOpen(true);
  };

  const openEditDialog = (doc: KnowledgeDocument) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category as any,
      source: doc.source || "",
      sourceUrl: doc.sourceUrl || "",
      pdfUrl: "",
      tags: doc.tags || "",
    });
    setPdfFile(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetFormState();
  };

  const closeReviewDialog = () => {
    setReviewDialogOpen(false);
    setReviewingDoc(null);
    setReviewStatus("review_only");
    setReviewNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("الرجاء ملء حقل العنوان");
      return;
    }
    
    let finalFormData = { ...formData };
    
    // Handle PDF upload
    if (pdfFile) {
      setIsUploading(true);
      try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfFile);
        });

        const uploadResult = await uploadPdfMutation.mutateAsync({
          fileName: pdfFile.name,
          fileData: base64Data,
          fileType: pdfFile.type,
        });

        finalFormData = {
          ...finalFormData,
          pdfUrl: uploadResult.url,
          content: uploadResult.extractedText || finalFormData.content,
        };
        
        setIsUploading(false);
      } catch (error) {
        console.error("Error uploading PDF:", error);
        alert("فشل رفع ملف PDF. الرجاء المحاولة مرة أخرى.");
        setIsUploading(false);
        return;
      }
    }
    
    // Check content after PDF upload
    if (!finalFormData.content.trim()) {
      alert("الرجاء ملء حقل المحتوى أو رفع ملف PDF");
      return;
    }

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        ...finalFormData,
      });
    } else {
      createMutation.mutate(finalFormData);
    }
  };

  const handleDelete = (id: any, title: string) => {
    if (confirm(`هل أنت متأكد من حذف المرجع "${title}"؟`)) {
      deleteMutation.mutate({ id });
    }
  };

  const openReviewDialog = (doc: KnowledgeDocument) => {
    setReviewingDoc(doc);
    setReviewStatus((doc.status as any) || (Number(doc.isActive) === 1 ? "approved" : "draft"));
    setReviewNotes(doc.reviewNotes || "");
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = () => {
    if (!reviewingDoc) return;
    reviewMutation.mutate({
      id: reviewingDoc.id as any,
      status: reviewStatus,
      notes: reviewNotes || undefined,
    });
  };

  const getStatusLabel = (doc: KnowledgeDocument) => {
    const status = getResolvedStatus(doc);
    switch (status) {
      case "approved": return "معتمد";
      case "rejected": return "مرفوض";
      case "review_only": return "للمراجعة";
      default: return "مسودة";
    }
  };

  const getStatusVariant = (doc: KnowledgeDocument) => {
    const status = getResolvedStatus(doc);
    switch (status) {
      case "approved": return "default" as const;
      case "rejected": return "destructive" as const;
      case "review_only": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const getOriginLabel = (doc: KnowledgeDocument) => {
    if (doc.toolOrigin === 'classify') return 'من أداة التصنيف';
    if (doc.toolOrigin === 'extract') return 'من أداة الاستخراج';
    if (doc.toolOrigin === 'summarize') return 'من أداة التلخيص';
    if (getDocumentStorageKind(doc) === 'assistant_reference') return 'مرجع معتمد';
    return 'وثيقة محلية';
  };

  const getOriginVariant = (doc: KnowledgeDocument) => {
    if (doc.toolOrigin) return 'secondary' as const;
    if (getDocumentStorageKind(doc) === 'assistant_reference') return 'outline' as const;
    return 'outline' as const;
  };

  return (
    <div className="admin-page-cleanup container mx-auto py-8 space-y-6" dir="rtl">
      <Breadcrumbs items={[
        { label: "إدارة النظام", href: "/admin/dashboard" },
        { label: "إدارة المراجع" }
      ]} />
      
      <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                إدارة قاعدة المعرفة
              </CardTitle>
              <CardDescription>إضافة وتعديل وحذف المراجع القانونية والفقهية</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border/60 bg-background/70 shadow-none">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm text-muted-foreground">إجمالي الوثائق</div>
                  <div className="mt-1 text-2xl font-bold">{counts.total}</div>
                </div>
                <BookOpen className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-background/70 shadow-none">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm text-muted-foreground">المعتمدة</div>
                  <div className="mt-1 text-2xl font-bold">{counts.approved}</div>
                </div>
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-background/70 shadow-none">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm text-muted-foreground">للمراجعة</div>
                  <div className="mt-1 text-2xl font-bold">{counts.reviewOnly}</div>
                </div>
                <Clock3 className="h-5 w-5 text-amber-600" />
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-background/70 shadow-none">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm text-muted-foreground">محلية قابلة للتحرير</div>
                  <div className="mt-1 text-2xl font-bold">{counts.localDocs}</div>
                </div>
                <Files className="h-5 w-5 text-sky-600" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-2 mb-6">
              <TabsTrigger value="documents">المراجع الموجودة</TabsTrigger>
              <TabsTrigger value="bulk-upload">رفع ملفات متعددة</TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Button onClick={openAddDialog} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة مرجع جديد
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في المراجع..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 rounded-xl border-border bg-background pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-border bg-background">
                      <SelectValue placeholder="جميع الفئات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفئات</SelectItem>
                      <SelectItem value="law">قانوني</SelectItem>
                      <SelectItem value="jurisprudence">فقهي</SelectItem>
                      <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                      <SelectItem value="historical">تاريخي</SelectItem>
                      <SelectItem value="administrative">إداري</SelectItem>
                      <SelectItem value="reference">مرجع</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-border bg-background">
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{statusLabels.all}</SelectItem>
                      <SelectItem value="draft">{statusLabels.draft}</SelectItem>
                      <SelectItem value="review_only">{statusLabels.review_only}</SelectItem>
                      <SelectItem value="approved">{statusLabels.approved}</SelectItem>
                      <SelectItem value="rejected">{statusLabels.rejected}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                {isLoading ? (
                  <TableSkeleton rows={10} columns={8} />
                ) : resolvedDocuments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center text-muted-foreground">
                    لا توجد مراجع. ابدأ بإضافة مرجع جديد!
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">العنوان</TableHead>
                          <TableHead className="text-center">الفئة</TableHead>
                          <TableHead className="text-center">المصدر</TableHead>
                          <TableHead className="text-center">المنشأ</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center">نسخة الاعتماد</TableHead>
                          <TableHead className="text-center">آخر مراجعة</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resolvedDocuments.map((doc: KnowledgeDocument) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium max-w-md truncate">
                              {doc.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="border-transparent bg-muted text-foreground">
                                {categoryLabels[doc.category]}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {doc.source || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getOriginVariant(doc)}>{getOriginLabel(doc)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(doc)}>{getStatusLabel(doc)}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground text-center">
                              {doc.approvalVersion ?? 0}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleDateString("ar-EG") : new Date(doc.createdAt).toLocaleDateString("ar-EG")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => setLocation(`/knowledge-base/${doc.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => openReviewDialog(doc)}
                                  disabled={isReadOnlyDoc(doc)}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => openEditDialog(doc)}
                                  disabled={isReadOnlyDoc(doc)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(doc.id, doc.title)}
                                  disabled={isReadOnlyDoc(doc)}
                                  className="rounded-xl text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bulk-upload">
              <BulkUpload onSuccess={() => { utils.knowledge.list.invalidate(); utils.knowledge.adminList.invalidate(); }} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={(open) => { if (!open) closeReviewDialog(); else setReviewDialogOpen(true); }}>
        <DialogContent className="max-w-xl border-border bg-card text-card-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle>مراجعة واعتماد الوثيقة</DialogTitle>
            <DialogDescription>تحديث حالة الوثيقة وإضافة ملاحظة مراجعة واضحة لمسار الشات.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="font-medium">{reviewingDoc?.title}</div>
              <div className="text-sm text-muted-foreground">الحالة الحالية: {reviewingDoc ? getStatusLabel(reviewingDoc) : "-"}</div>
            </div>
            <div>
              <Label>الحالة الجديدة</Label>
              <Select value={reviewStatus} onValueChange={(value: any) => setReviewStatus(value)}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="review_only">للمراجعة فقط</SelectItem>
                  <SelectItem value="approved">معتمد للشات</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reviewNotes">ملاحظات المراجعة</Label>
              <Textarea id="reviewNotes" className="border-border bg-background" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} placeholder="اكتب سبب الاعتماد أو الرفض أو الإبقاء للمراجعة..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={closeReviewDialog}>إلغاء</Button>
              <Button className="rounded-xl" onClick={handleReviewSubmit} disabled={reviewMutation.isPending}>حفظ حالة المراجعة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsDialogOpen(true); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-border bg-card text-card-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "تعديل مرجع" : "إضافة مرجع جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId !== null 
                ? "قم بتعديل بيانات المرجع أدناه" 
                : "املأ البيانات لإضافة مرجع جديد إلى قاعدة المعرفة"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان المرجع *</Label>
              <Input
                className="border-border bg-background"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: قانون الأوقاف الفلسطيني"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">الفئة *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
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

            <div>
              <Label htmlFor="content">محتوى المرجع *</Label>
              <Textarea
                className="border-border bg-background"
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="المحتوى الكامل للمرجع..."
                rows={10}
                required={!pdfFile}
              />
            </div>

            <div>
              <Label htmlFor="pdf">أو رفع ملف PDF</Label>
              <Input
                className="border-border bg-background"
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              {pdfFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  الملف المحدد: {pdfFile.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="source">المصدر</Label>
              <Input
                className="border-border bg-background"
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="مثال: وزارة الأوقاف الفلسطينية"
              />
            </div>

            <div>
              <Label htmlFor="sourceUrl">رابط المصدر</Label>
              <Input
                className="border-border bg-background"
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="tags">الوسوم (مفصولة بفواصل)</Label>
              <Input
                className="border-border bg-background"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="مثال: أوقاف، قانون، فلسطين"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeDialog}>
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isUploading}>
                {isUploading ? "جاري الرفع..." : editingId !== null ? "حفظ التعديلات" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
