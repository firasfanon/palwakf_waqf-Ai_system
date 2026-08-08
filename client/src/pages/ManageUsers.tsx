import { trpc } from "@/lib/trpc";
import { formatArabicDate } from "@/lib/dateFormat";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Shield,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  MoreVertical,
  UserCheck,
  UserMinus,
  Trash2,
  Eye,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";
import TableSkeleton from "@/components/TableSkeleton";
import { toast } from "sonner";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminTable from "@/components/admin/ui/AdminTable";

type SortField = "name" | "email" | "role" | "createdAt" | "lastSignedIn";
type SortOrder = "asc" | "desc";

export default function ManageUsersEnhanced() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"admin" | "user" | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [lastSignedInAfter, setLastSignedInAfter] = useState("");
  const [lastSignedInBefore, setLastSignedInBefore] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Dialog states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"role" | "status" | "delete" | null>(null);

  const limit = 20;

  // Fetch users
  const { data, isLoading, refetch } = trpc.admin.users.list.useQuery({
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    createdAfter: createdAfter || undefined,
    createdBefore: createdBefore || undefined,
    lastSignedInAfter: lastSignedInAfter || undefined,
    lastSignedInBefore: lastSignedInBefore || undefined,
    page,
    limit,
  });

  // Fetch user activity
  const { data: activityData, isLoading: activityLoading } = trpc.admin.users.getActivity.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId && activityDialogOpen }
  );

  // Mutations
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير صلاحية المستخدم بنجاح");
      setRoleDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تغيير الصلاحية");
    },
  });

  const toggleStatusMutation = trpc.admin.users.toggleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.newStatus ? "تم تفعيل المستخدم بنجاح" : "تم تعطيل المستخدم بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تغيير الحالة");
    },
  });

  const deleteUserMutation = trpc.admin.users.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم من النظام بنجاح");
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    },
  });

  const bulkUpdateRoleMutation = trpc.admin.users.bulkUpdateRole.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تغيير صلاحية ${data.count} مستخدم بنجاح`);
      setBulkActionDialogOpen(false);
      setSelectedUserIds([]);
      setSelectAll(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء التغيير الجماعي");
    },
  });

  const bulkToggleStatusMutation = trpc.admin.users.bulkToggleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تغيير حالة ${data.count} مستخدم بنجاح`);
      setBulkActionDialogOpen(false);
      setSelectedUserIds([]);
      setSelectAll(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء التغيير الجماعي");
    },
  });

  const bulkDeleteMutation = trpc.admin.users.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`تم حذف ${data.count} مستخدم بنجاح`);
      setBulkActionDialogOpen(false);
      setSelectedUserIds([]);
      setSelectAll(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء الحذف الجماعي");
    },
  });

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds([]);
      setSelectAll(false);
    } else {
      setSelectedUserIds(data?.users.map((u) => u.id) || []);
      setSelectAll(true);
    }
  };

  const handleSelectUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleBulkAction = (action: "role" | "status" | "delete") => {
    if (selectedUserIds.length === 0) {
      toast.error("يرجى تحديد مستخدم واحد على الأقل");
      return;
    }
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const executeBulkAction = () => {
    if (bulkAction === "role") {
      bulkUpdateRoleMutation.mutate({ userIds: selectedUserIds, role: newRole });
    } else if (bulkAction === "status") {
      bulkToggleStatusMutation.mutate({ userIds: selectedUserIds, isActive: false });
    } else if (bulkAction === "delete") {
      bulkDeleteMutation.mutate({ userIds: selectedUserIds });
    }
  };

  const formatDate = (date: Date | string | null | undefined) => formatArabicDate(date, "—");

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setCreatedAfter("");
    setCreatedBefore("");
    setLastSignedInAfter("");
    setLastSignedInBefore("");
    setPage(1);
  };

  const hasActiveFilters =
    search || roleFilter !== "all" || createdAfter || createdBefore || lastSignedInAfter || lastSignedInBefore;

  // Sort data client-side
  const sortedUsers = data?.users ? [...data.users].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === "createdAt" || sortField === "lastSignedIn") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  }) : [];

  return (
    <div dir="rtl" className="container mx-auto py-6">
      <AdminPage>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-card/40 border border-border/60" dir="rtl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
              <p className="text-muted-foreground">عرض وإدارة جميع مستخدمي النظام</p>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedUserIds.length} محدد</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    إجراءات جماعية
                    <MoreVertical className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction("role")}>
                    <Shield className="ml-2 h-4 w-4" />
                    تغيير الصلاحية
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("status")}>
                    <UserMinus className="ml-2 h-4 w-4" />
                    تعطيل الحسابات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("delete")}
                    className="text-destructive"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف المستخدمين
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="admin-filters flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pr-10 h-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(value: "admin" | "user" | "all") => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full md:w-[200px]">
                <SelectValue placeholder="الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصلاحيات</SelectItem>
                <SelectItem value="admin">مسؤول</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              className="h-10"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="ml-2 h-4 w-4" />
              فلترة متقدمة
            </Button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" className="h-10" onClick={handleResetFilters}>
                <X className="ml-2 h-4 w-4" />
                إعادة تعيين
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">تاريخ التسجيل من</label>
                <Input
                  type="date"
                  value={createdAfter}
                  onChange={(e) => setCreatedAfter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">تاريخ التسجيل إلى</label>
                <Input
                  type="date"
                  value={createdBefore}
                  onChange={(e) => setCreatedBefore(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">آخر تسجيل دخول من</label>
                <Input
                  type="date"
                  value={lastSignedInAfter}
                  onChange={(e) => setLastSignedInAfter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">آخر تسجيل دخول إلى</label>
                <Input
                  type="date"
                  value={lastSignedInBefore}
                  onChange={(e) => setLastSignedInBefore(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <AdminTable
        title="المستخدمون"
        description="قائمة المستخدمين مع أدوات الفرز والإجراءات"
        isLoading={isLoading}
        loadingFallback={<TableSkeleton />}
        footer={data && data.totalPages > 1 ? (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              عرض {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)} من {data.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      >
        <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="font-bold"
                    >
                      الاسم
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("email")}
                      className="font-bold"
                    >
                      البريد الإلكتروني
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("role")}
                      className="font-bold"
                    >
                      الصلاحية
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">المحادثات</TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                      className="font-bold"
                    >
                      تاريخ التسجيل
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lastSignedIn")}
                      className="font-bold"
                    >
                      آخر تسجيل دخول
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمين
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">{user.name}</TableCell>
                      <TableCell className="text-center">{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "مسؤول" : "مستخدم"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "نشط" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(user as any).conversationCount || 0}
                      </TableCell>
                      <TableCell className="text-center">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-center">{formatDate(user.lastSignedIn)}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setActivityDialogOpen(true);
                              }}
                            >
                              <Eye className="ml-2 h-4 w-4" />
                              عرض النشاط
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setNewRole(user.role === "admin" ? "user" : "admin");
                                setRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="ml-2 h-4 w-4" />
                              تغيير الصلاحية
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                toggleStatusMutation.mutate({ userId: user.id });
                              }}
                            >
                              {user.isActive ? (
                                <>
                                  <UserMinus className="ml-2 h-4 w-4" />
                                  تعطيل الحساب
                                </>
                              ) : (
                                <>
                                  <UserCheck className="ml-2 h-4 w-4" />
                                  تفعيل الحساب
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف المستخدم
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
      </AdminTable>
      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير صلاحية المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تغيير صلاحية هذا المستخدم إلى {newRole === "admin" ? "مسؤول" : "مستخدم"}؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (selectedUserId) {
                  updateRoleMutation.mutate({ userId: selectedUserId, role: newRole });
                }
              }}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "جاري التغيير..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع محادثاته ورسائله بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUserId) {
                  deleteUserMutation.mutate({ userId: selectedUserId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نشاط المستخدم</DialogTitle>
          </DialogHeader>
          {activityLoading ? (
            <div className="py-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : activityData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{activityData.conversationCount}</div>
                      <div className="text-sm text-muted-foreground">المحادثات</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{activityData.messageCount}</div>
                      <div className="text-sm text-muted-foreground">الرسائل</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {activityData.averageRating.toFixed(1)} / 5
                    </div>
                    <div className="text-sm text-muted-foreground">متوسط التقييم</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "role" && "تغيير صلاحية جماعي"}
              {bulkAction === "status" && "تعطيل حسابات جماعي"}
              {bulkAction === "delete" && "حذف مستخدمين جماعي"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "role" && (
                <div className="space-y-4">
                  <p>سيتم تغيير صلاحية {selectedUserIds.length} مستخدم</p>
                  <Select value={newRole} onValueChange={(v: "admin" | "user") => setNewRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مسؤول</SelectItem>
                      <SelectItem value="user">مستخدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {bulkAction === "status" && `سيتم تعطيل ${selectedUserIds.length} حساب`}
              {bulkAction === "delete" &&
                `هل أنت متأكد من حذف ${selectedUserIds.length} مستخدم؟ سيتم حذف جميع بياناتهم بشكل نهائي.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={bulkAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </AdminPage>
    </div>
  );
}
