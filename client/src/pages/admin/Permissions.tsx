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
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Permissions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    resource: "",
    action: "",
  });

  const utils = trpc.useUtils();
  const { data: permissions, isLoading } = trpc.permissions.list.useQuery();

  const createMutation = trpc.permissions.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الصلاحية بنجاح");
      utils.permissions.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء الصلاحية: ${error.message}`);
    },
  });

  const updateMutation = trpc.permissions.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الصلاحية بنجاح");
      utils.permissions.list.invalidate();
      setEditingPermission(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الصلاحية: ${error.message}`);
    },
  });

  const deleteMutation = trpc.permissions.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الصلاحية بنجاح");
      utils.permissions.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حذف الصلاحية: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      resource: "",
      action: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (editingPermission) {
      updateMutation.mutate({ id: editingPermission.id, ...formData });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الصلاحية؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (permission: any) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      nameAr: permission.nameAr,
      description: permission.description || "",
      descriptionAr: permission.descriptionAr || "",
      resource: permission.resource,
      action: permission.action,
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

  // Group permissions by resource
  const groupedPermissions = permissions?.reduce((acc: any, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الصلاحيات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة صلاحيات الوصول للموارد المختلفة
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة صلاحية جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة صلاحية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم (English)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="users.create"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">الاسم (العربية)</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="إنشاء مستخدمين"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resource">المورد (Resource)</Label>
                  <Input
                    id="resource"
                    value={formData.resource}
                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                    placeholder="users"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">الإجراء (Action)</Label>
                  <Input
                    id="action"
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    placeholder="create"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Create new users"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">الوصف (العربية)</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="إنشاء مستخدمين جدد"
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الصلاحية"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {groupedPermissions && Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
          <Card key={resource} className="p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">{resource}</Badge>
              <span className="text-sm text-muted-foreground">({perms.length} صلاحية)</span>
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الاسم بالعربية</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perms.map((permission: any) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium font-mono text-sm">{permission.name}</TableCell>
                    <TableCell>{permission.nameAr}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{permission.descriptionAr || permission.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={editingPermission?.id === permission.id} onOpenChange={(open) => !open && setEditingPermission(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(permission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تعديل الصلاحية</DialogTitle>
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
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-resource">المورد (Resource)</Label>
                                  <Input
                                    id="edit-resource"
                                    value={formData.resource}
                                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-action">الإجراء (Action)</Label>
                                  <Input
                                    id="edit-action"
                                    value={formData.action}
                                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
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
                                {updateMutation.isPending ? "جاري التحديث..." : "تحديث الصلاحية"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(permission.id)}
                          disabled={deleteMutation.isPending}
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
        ))}
      </div>
    </div>
  );
}
