import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WaqfCategoriesManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    icon: "",
    color: "",
    order: 0,
  });

  const { data: categories, isLoading, refetch } = trpc.waqfCategories.list.useQuery();
  const { data: propertiesCount } = trpc.waqfCategories.getPropertiesCount.useQuery();

  const createMutation = trpc.waqfCategories.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التصنيف بنجاح");
      refetch();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const updateMutation = trpc.waqfCategories.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث التصنيف بنجاح");
      refetch();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const deleteMutation = trpc.waqfCategories.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التصنيف بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        nameAr: category.nameAr || "",
        description: category.description || "",
        icon: category.icon || "",
        color: category.color || "",
        order: category.order || 0,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        icon: "",
        color: "",
        order: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      icon: "",
      color: "",
      order: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا التصنيف؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const getCategoryCount = (categoryId: number) => {
    const count = propertiesCount?.find((c) => c.categoryId === categoryId);
    return count?.count || 0;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة تصنيفات الأوقاف</h1>
          <p className="text-muted-foreground mt-2">
            إضافة وتعديل وحذف تصنيفات الأوقاف
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة تصنيف جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            التصنيفات
          </CardTitle>
          <CardDescription>
            إجمالي التصنيفات: {categories?.length || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">الترتيب</TableHead>
                <TableHead className="text-center">الاسم بالعربية</TableHead>
                <TableHead className="text-center">الاسم بالإنجليزية</TableHead>
                <TableHead className="text-center">الأيقونة</TableHead>
                <TableHead className="text-center">اللون</TableHead>
                <TableHead className="text-center">عدد الأوقاف</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-center">{category.order}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {category.nameAr}
                    </TableCell>
                    <TableCell className="text-center">{category.name}</TableCell>
                    <TableCell className="text-center">{category.icon || "-"}</TableCell>
                    <TableCell className="text-center">
                      {category.color ? (
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {category.color}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getCategoryCount(category.id)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد تصنيفات بعد. قم بإضافة تصنيف جديد للبدء.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "قم بتعديل بيانات التصنيف"
                : "أدخل بيانات التصنيف الجديد"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nameAr">الاسم بالعربية *</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">الاسم بالإنجليزية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="icon">الأيقونة (Lucide Icon)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="مثال: Building, Landmark, School"
                />
              </div>
              <div>
                <Label htmlFor="color">اللون (Hex)</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="order">الترتيب</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
