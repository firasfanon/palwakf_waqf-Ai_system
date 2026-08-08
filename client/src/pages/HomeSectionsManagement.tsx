import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";

interface SectionFormData {
  title: string;
  content: string;
  order: number;
  backgroundColor: string;
  textColor: string;
  layout: "full-width" | "centered" | "two-columns" | "three-columns" | "grid";
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  publishAt?: Date;
  unpublishAt?: Date;
  scheduledStatus: "draft" | "scheduled" | "published" | "unpublished";
}

const defaultFormData: SectionFormData = {
  title: "",
  content: "",
  order: 0,
  backgroundColor: "",
  textColor: "",
  layout: "centered",
  imageUrl: "",
  ctaText: "",
  ctaLink: "",
  isActive: true,
  scheduledStatus: "draft",
};

export default function HomeSectionsManagement() {
  const utils = trpc.useUtils();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [formData, setFormData] = useState<SectionFormData>(defaultFormData);
  const [previewMode, setPreviewMode] = useState(false);

  // Queries
  const { data: sections = [], isLoading } = trpc.homeSections.list.useQuery();

  // Mutations
  const createMutation = trpc.homeSections.create.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إنشاء القسم بنجاح");
      utils.homeSections.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const updateMutation = trpc.homeSections.update.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث القسم بنجاح");
      utils.homeSections.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const deleteMutation = trpc.homeSections.delete.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف القسم بنجاح");
      utils.homeSections.list.invalidate();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const toggleVisibilityMutation = trpc.homeSections.toggleVisibility.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث حالة العرض");
      utils.homeSections.list.invalidate();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const reorderMutation = trpc.homeSections.reorder.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إعادة ترتيب الأقسام");
      utils.homeSections.list.invalidate();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  // Handlers
  const openCreateDialog = () => {
    setEditingSection(null);
    setFormData({
      ...defaultFormData,
      order: sections.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (section: any) => {
    setEditingSection(section.id);
    setFormData({
      title: section.title,
      content: section.content,
      order: section.order,
      backgroundColor: section.backgroundColor || "",
      textColor: section.textColor || "",
      layout: section.layout,
      imageUrl: section.imageUrl || "",
      ctaText: section.ctaText || "",
      ctaLink: section.ctaLink || "",
      isActive: section.isActive,
      publishAt: section.publishAt ? new Date(section.publishAt) : undefined,
      unpublishAt: section.unpublishAt ? new Date(section.unpublishAt) : undefined,
      scheduledStatus: section.scheduledStatus,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSection(null);
    setFormData(defaultFormData);
    setPreviewMode(false);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("❌ العنوان والمحتوى مطلوبان");
      return;
    }

    if (editingSection) {
      updateMutation.mutate({
        id: editingSection,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleVisibility = (id: number) => {
    toggleVisibilityMutation.mutate({ id });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all sections
    const updates = items.map((item: any, index) => ({
      id: item.id,
      order: index,
    }));

    reorderMutation.mutate({ sections: updates });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: "مسودة", className: "border border-border bg-muted text-muted-foreground" },
      scheduled: { label: "مجدول", className: "border border-primary/20 bg-primary/10 text-primary" },
      published: { label: "منشور", className: "border border-secondary/30 bg-secondary/15 text-secondary" },
      unpublished: { label: "غير منشور", className: "border border-destructive/20 bg-destructive/10 text-destructive" },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة أقسام الصفحة الرئيسية</h1>
          <p className="text-muted-foreground mt-2">
            إنشاء وتعديل الأقسام الديناميكية للصفحة الرئيسية مع المحرر الغني
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg">
          <Plus className="ml-2 h-5 w-5" />
          إضافة قسم جديد
        </Button>
      </div>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle>الأقسام الحالية ({sections.length})</CardTitle>
          <CardDescription>
            اسحب الأقسام لإعادة ترتيبها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد أقسام حالياً</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                <Plus className="ml-2 h-4 w-4" />
                إضافة أول قسم
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {sections.map((section, index) => (
                      <Draggable
                        key={section.id}
                        draggableId={section.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{section.title}</h3>
                                {getStatusBadge(section.scheduledStatus)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>الترتيب: {section.order}</span>
                                <span>التخطيط: {section.layout}</span>
                                {section.publishAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    نشر: {new Date(section.publishAt).toLocaleDateString("ar")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleVisibility(section.id)}
                                title={section.isActive ? "إخفاء" : "إظهار"}
                              >
                                {section.isActive ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(section)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(section.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "تعديل القسم" : "إضافة قسم جديد"}
            </DialogTitle>
            <DialogDescription>
              استخدم المحرر الغني لإنشاء محتوى منسق، مع اعتماد الهوية البصرية المركزية من إعدادات الموقع.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview Toggle */}
            <div className="flex items-center justify-between">
              <Label>وضع المعاينة</Label>
              <Switch
                checked={previewMode}
                onCheckedChange={setPreviewMode}
              />
            </div>

            {previewMode ? (
              /* Preview Mode */
              <Card className="public-surface-card p-6 text-foreground">
                <h2 className="text-2xl font-bold mb-4">{formData.title || "عنوان القسم"}</h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.content || "<p>المحتوى سيظهر هنا...</p>" }}
                />
                {formData.ctaText && (
                  <Button className="mt-4">{formData.ctaText}</Button>
                )}
              </Card>
            ) : (
              /* Edit Mode */
              <>
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">العنوان *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان القسم"
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <Label>المحتوى *</Label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content: string) => setFormData({ ...formData, content })}
                  />
                </div>

                {/* Layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="layout">التخطيط</Label>
                    <Select
                      value={formData.layout}
                      onValueChange={(value: any) => setFormData({ ...formData, layout: value })}
                    >
                      <SelectTrigger id="layout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-width">عرض كامل</SelectItem>
                        <SelectItem value="centered">وسط</SelectItem>
                        <SelectItem value="two-columns">عمودين</SelectItem>
                        <SelectItem value="three-columns">ثلاثة أعمدة</SelectItem>
                        <SelectItem value="grid">شبكة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">الترتيب</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Appearance source notice */}
                <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  ألوان الأقسام العامة أصبحت تُدار مركزيًا من إعدادات الهوية البصرية في لوحة التحكم، ولم يعد مسموحًا بتخصيص لون مستقل لكل قسم.
                </div>

                {/* Image & CTA */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">رابط الصورة (اختياري)</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ctaText">نص الزر (اختياري)</Label>
                      <Input
                        id="ctaText"
                        value={formData.ctaText}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                        placeholder="اقرأ المزيد"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ctaLink">رابط الزر (اختياري)</Label>
                      <Input
                        id="ctaLink"
                        value={formData.ctaLink}
                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                        placeholder="/page"
                      />
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">جدولة النشر</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduledStatus">حالة النشر</Label>
                    <Select
                      value={formData.scheduledStatus}
                      onValueChange={(value: any) => setFormData({ ...formData, scheduledStatus: value })}
                    >
                      <SelectTrigger id="scheduledStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="scheduled">مجدول</SelectItem>
                        <SelectItem value="published">منشور</SelectItem>
                        <SelectItem value="unpublished">غير منشور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.scheduledStatus === "scheduled" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="publishAt">تاريخ النشر</Label>
                        <Input
                          id="publishAt"
                          type="datetime-local"
                          value={formData.publishAt ? new Date(formData.publishAt).toISOString().slice(0, 16) : ""}
                          onChange={(e) => setFormData({ ...formData, publishAt: new Date(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unpublishAt">تاريخ إلغاء النشر (اختياري)</Label>
                        <Input
                          id="unpublishAt"
                          type="datetime-local"
                          value={formData.unpublishAt ? new Date(formData.unpublishAt).toISOString().slice(0, 16) : ""}
                          onChange={(e) => setFormData({ ...formData, unpublishAt: new Date(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">نشط</Label>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "جاري الحفظ..."
                : editingSection
                ? "تحديث"
                : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
