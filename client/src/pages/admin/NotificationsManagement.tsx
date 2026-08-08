import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminTable from "@/components/admin/ui/AdminTable";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, Send, Users } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsManagement() {
  // Using toast from sonner
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "error",
    targetType: "all" as "all" | "specific",
    targetUserIds: [] as number[],
  });

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = trpc.notifications.getAll.useQuery();

  // Create notification mutation
  const createMutation = trpc.notifications.create.useMutation({
    onSuccess: () => {
      toast({
        title: "تم إنشاء الإشعار",
        description: "تم إرسال الإشعار بنجاح",
      });
      setIsCreateDialogOpen(false);
      setNewNotification({
        title: "",
        message: "",
        type: "info",
        targetType: "all",
        targetUserIds: [],
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

  // Delete notification mutation
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف الإشعار بنجاح",
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

  const handleCreate = () => {
    createMutation.mutate({
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      targetUserIds: newNotification.targetType === "all" ? undefined : newNotification.targetUserIds,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الإشعار؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "success":
        return "نجاح";
      case "warning":
        return "تحذير";
      case "error":
        return "خطأ";
      default:
        return "معلومة";
    }
  };

  return (
    <AdminPage>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إشعارات المعلومات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications?.filter((n) => n.type === "info").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إشعارات النجاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications?.filter((n) => n.type === "success").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إشعارات التحذير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications?.filter((n) => n.type === "warning").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <AdminTable
        title="قائمة الإشعارات"
        description="جميع الإشعارات المرسلة للمستخدمين"
        headerRight={
          <Button className="h-10" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" /> إنشاء إشعار
          </Button>
        }
        isLoading={isLoading}
        empty={!notifications?.length}
        emptyTitle="لا توجد إشعارات"
        emptyDescription="لم يتم إرسال أي إشعارات بعد."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">العنوان</TableHead>
              <TableHead className="text-center">الرسالة</TableHead>
              <TableHead className="text-center">النوع</TableHead>
              <TableHead className="text-center">تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium text-center">{notification.title}</TableCell>
                  <TableCell className="max-w-md truncate text-center">{notification.message}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getTypeColor(notification.type)}>
                      {getTypeLabel(notification.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {new Date(notification.createdAt).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  لا توجد إشعارات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminTable>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>إنشاء إشعار جديد</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الإشعار الذي تريد إرساله
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, title: e.target.value })
                }
                placeholder="عنوان الإشعار"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, message: e.target.value })
                }
                placeholder="محتوى الإشعار"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">النوع</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value: any) =>
                  setNewNotification({ ...newNotification, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الإشعار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومة</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetType">المستهدفون</Label>
              <Select
                value={newNotification.targetType}
                onValueChange={(value: any) =>
                  setNewNotification({ ...newNotification, targetType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستهدفين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  <SelectItem value="specific">مستخدمون محددون</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !newNotification.title ||
                !newNotification.message ||
                createMutation.isPending
              }
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
