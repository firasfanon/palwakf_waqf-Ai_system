import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Roles() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
  });

  const utils = trpc.useUtils();
  const { data: roles, isLoading } = trpc.roles.list.useQuery();

  const createMutation = trpc.roles.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الدور بنجاح");
      utils.roles.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء الدور: ${error.message}`);
    },
  });

  const updateMutation = trpc.roles.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الدور بنجاح");
      utils.roles.list.invalidate();
      setEditingRole(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الدور: ${error.message}`);
    },
  });

  const deleteMutation = trpc.roles.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الدور بنجاح");
      utils.roles.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حذف الدور: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, ...formData });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الدور؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      nameAr: role.nameAr,
      description: role.description || "",
      descriptionAr: role.descriptionAr || "",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأدوار</h1>
          <p className="text-muted-foreground mt-1">
            إدارة أدوار المستخدمين وصلاحياتهم
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة دور جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة دور جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم (English)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">الاسم (العربية)</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مدير"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Administrative access"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">الوصف (العربية)</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="صلاحيات إدارية"
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الدور"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الاسم بالعربية</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.nameAr}</TableCell>
                <TableCell className="max-w-xs truncate">{role.descriptionAr || role.description}</TableCell>
                <TableCell>
                  {role.isSystem ? (
                    <Badge variant="secondary">
                      <Shield className="ml-1 h-3 w-3" />
                      نظام
                    </Badge>
                  ) : (
                    <Badge variant="outline">مخصص</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(role.createdAt).toLocaleDateString("ar-EG")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog open={editingRole?.id === role.id} onOpenChange={(open) => !open && setEditingRole(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>تعديل الدور</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">الاسم (English)</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-nameAr">الاسم (العربية)</Label>
                              <Input
                                id="edit-nameAr"
                                value={formData.nameAr}
                                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">الوصف (English)</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-descriptionAr">الوصف (العربية)</Label>
                            <Textarea
                              id="edit-descriptionAr"
                              value={formData.descriptionAr}
                              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                            />
                          </div>
                          <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full">
                            {updateMutation.isPending ? "جاري التحديث..." : "تحديث الدور"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                      disabled={role.isSystem === 1 || deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
