import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Eye, Copy } from "lucide-react";
import { TemplateFormDialog } from "@/components/TemplateFormDialog";

export default function ContentTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const utils = trpc.useUtils();

  // Fetch templates
  const { data: templates, isLoading, refetch } = trpc.contentTemplates.list.useQuery();

  // Delete mutation
  const deleteMutation = trpc.contentTemplates.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف القالب بنجاح",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Increment usage mutation
  const incrementUsageMutation = trpc.contentTemplates.incrementUsage.useMutation({
    onSuccess: () => {
      utils.contentTemplates.list.invalidate();
    },
  });

  const cloneMutation = trpc.contentTemplates.clone.useMutation({
    onSuccess: () => {
      utils.contentTemplates.list.invalidate();
      toast({
        title: "تم الاستنساخ بنجاح",
        description: "تم إنشاء نسخة من القالب",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create mutation
  const createMutation = trpc.contentTemplates.create.useMutation({
    onSuccess: () => {
      toast({
        title: "تم الإضافة",
        description: "تم إضافة القالب بنجاح",
      });
      setDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = trpc.contentTemplates.update.useMutation({
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث القالب بنجاح",
      });
      setDialogOpen(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter templates
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.nameAr.includes(searchTerm);
    const matchesType = typeFilter === "all" || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Type labels
  const typeLabels: Record<string, string> = {
    landing: "صفحة هبوط",
    about: "من نحن",
    services: "خدمات",
    portfolio: "أعمال",
    blog: "مدونة",
    documentation: "توثيق",
    dashboard: "لوحة تحكم",
    ecommerce: "متجر",
    educational: "تعليمي",
    nonprofit: "غير ربحي",
  };

  // Layout labels
  const layoutLabels: Record<string, string> = {
    "full-width": "عرض كامل",
    centered: "وسط",
    "two-columns": "عمودين",
    "three-columns": "ثلاثة أعمدة",
    grid: "شبكة",
    sidebar: "شريط جانبي",
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا القالب؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleUseTemplate = (id: number) => {
    incrementUsageMutation.mutate({ id });
    toast({
      title: "تم استخدام القالب",
      description: "تم زيادة عداد الاستخدام",
    });
  };

  const handleClone = (id: number) => {
    if (confirm("هل تريد إنشاء نسخة من هذا القالب؟")) {
      cloneMutation.mutate({ id });
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة القوالب</h1>
          <p className="text-muted-foreground mt-2">
            إدارة قوالب المحتوى المتاحة للاستخدام في الموقع
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة قالب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>القوالب المتاحة</CardTitle>
          <CardDescription>
            {filteredTemplates?.length || 0} قالب متاح
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن قالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع القالب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">الاسم</TableHead>
                  <TableHead className="text-center">النوع</TableHead>
                  <TableHead className="text-center">التخطيط</TableHead>
                  <TableHead className="text-center">الأقسام</TableHead>
                  <TableHead className="text-center">الاستخدامات</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد قوالب متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates?.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{template.nameAr}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {typeLabels[template.type] || template.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {layoutLabels[template.layout || "centered"]}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {JSON.parse(template.sections).slice(0, 3).map((section: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                          {JSON.parse(template.sections).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{JSON.parse(template.sections).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {template.usageCount || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {template.isActive === 1 ? (
                          <Badge variant="default" className="bg-green-500">
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleClone(template.id)}
                            title="استنساخ"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="معاينة"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template.id)}
                            title="حذف"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
