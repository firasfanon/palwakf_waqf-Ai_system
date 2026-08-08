import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminTable from "@/components/admin/ui/AdminTable";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function CommentsManagement() {
  // Using toast from sonner
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedComment, setSelectedComment] = useState<any>(null);

  // Fetch comments
  const { data: comments, isLoading, refetch } = trpc.comments.getAll.useQuery();

  // Approve comment mutation
  const approveMutation = trpc.comments.approve.useMutation({
    onSuccess: () => {
      toast({
        title: "تمت الموافقة",
        description: "تمت الموافقة على التعليق بنجاح",
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

  // Reject comment mutation
  const rejectMutation = trpc.comments.reject.useMutation({
    onSuccess: () => {
      toast({
        title: "تم الرفض",
        description: "تم رفض التعليق بنجاح",
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

  // Delete comment mutation
  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف التعليق بنجاح",
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

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "موافق عليه";
      case "rejected":
        return "مرفوض";
      default:
        return "قيد المراجعة";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Filter comments
  const filteredComments = comments?.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminPage>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي التعليقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              قيد المراجعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comments?.filter((c) => c.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              موافق عليها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comments?.filter((c) => c.status === "approved").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              مرفوضة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comments?.filter((c) => c.status === "rejected").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AdminCard title="فلترة التعليقات" description="بحث وتصفية حسب الحالة" className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              className="h-10 pr-10"
              placeholder="بحث في التعليقات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="h-10 w-[200px]">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد المراجعة</SelectItem>
              <SelectItem value="approved">موافق عليها</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminCard>

      {/* Comments Table */}
      <AdminTable
        title="قائمة التعليقات"
        description={`${filteredComments?.length || 0} تعليق`}
        isLoading={isLoading}
        empty={filteredComments?.length === 0}
        emptyTitle="لا توجد تعليقات"
        emptyDescription="لم يتم العثور على تعليقات مطابقة."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">المستخدم</TableHead>
              <TableHead className="text-center">التعليق</TableHead>
              <TableHead className="text-center">الوثيقة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">التاريخ</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComments && filteredComments.length > 0 ? (
              filteredComments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-medium text-center">{comment.userName || "مستخدم"}</TableCell>
                  <TableCell className="max-w-md truncate text-center">{comment.content}</TableCell>
                  <TableCell className="text-center">{comment.documentTitle || `#${comment.documentId}`}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusColor(comment.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(comment.status)}
                        {getStatusLabel(comment.status)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {new Date(comment.createdAt).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-2">
                      {comment.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(comment.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(comment.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  لا توجد تعليقات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminTable>
    </AdminPage>
  );
}
