import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [permissionChanges, setPermissionChanges] = useState<Set<number>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const utils = trpc.useUtils();
  const { data: roles, isLoading: rolesLoading } = trpc.roles.list.useQuery();
  const { data: allPermissions, isLoading: permissionsLoading } = trpc.permissions.list.useQuery();
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = trpc.roles.getPermissions.useQuery(
    { roleId: selectedRole! },
    { enabled: selectedRole !== null }
  );

  const assignMutation = trpc.roles.assignPermission.useMutation({
    onSuccess: () => {
      utils.roles.getPermissions.invalidate({ roleId: selectedRole! });
      toast.success("تم تعيين الصلاحية بنجاح");
    },
    onError: (error) => {
      toast.error(`فشل تعيين الصلاحية: ${error.message}`);
    },
  });

  const removeMutation = trpc.roles.removePermission.useMutation({
    onSuccess: () => {
      utils.roles.getPermissions.invalidate({ roleId: selectedRole! });
      toast.success("تم إزالة الصلاحية بنجاح");
    },
    onError: (error) => {
      toast.error(`فشل إزالة الصلاحية: ${error.message}`);
    },
  });

  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].id);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    setPermissionChanges(new Set());
    setHasChanges(false);
  }, [selectedRole]);

  const isPermissionAssigned = (permissionId: number) => {
    return rolePermissions?.some((p) => p.id === permissionId) || false;
  };

  const togglePermission = (permissionId: number) => {
    const newChanges = new Set(permissionChanges);
    if (newChanges.has(permissionId)) {
      newChanges.delete(permissionId);
    } else {
      newChanges.add(permissionId);
    }
    setPermissionChanges(newChanges);
    setHasChanges(newChanges.size > 0);
  };

  const applyChanges = async () => {
    if (!selectedRole) return;

    const promises: Promise<any>[] = [];
    
    permissionChanges.forEach((permissionId) => {
      const isAssigned = isPermissionAssigned(permissionId);
      if (isAssigned) {
        promises.push(
          removeMutation.mutateAsync({ roleId: selectedRole, permissionId })
        );
      } else {
        promises.push(
          assignMutation.mutateAsync({ roleId: selectedRole, permissionId })
        );
      }
    });

    try {
      await Promise.all(promises);
      setPermissionChanges(new Set());
      setHasChanges(false);
      toast.success("تم تطبيق جميع التغييرات بنجاح");
    } catch (error) {
      toast.error("فشل تطبيق بعض التغييرات");
    }
  };

  const cancelChanges = () => {
    setPermissionChanges(new Set());
    setHasChanges(false);
  };

  if (rolesLoading || permissionsLoading) {
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
  const groupedPermissions = allPermissions?.reduce((acc: any, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  const selectedRoleData = roles?.find((r) => r.id === selectedRole);

  // Calculate preview stats
  const currentPermissionsCount = rolePermissions?.length || 0;
  const changesCount = permissionChanges.size;
  const additionsCount = Array.from(permissionChanges).filter(
    (id) => !isPermissionAssigned(id)
  ).length;
  const removalsCount = changesCount - additionsCount;
  const finalCount = currentPermissionsCount + additionsCount - removalsCount;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ربط الصلاحيات بالأدوار</h1>
        <p className="text-muted-foreground mt-1">
          تعيين وإزالة الصلاحيات من الأدوار المختلفة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <Card className="p-4 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">الأدوار</h2>
          <div className="space-y-2">
            {roles?.map((role) => (
              <Button
                key={role.id}
                variant={selectedRole === role.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedRole(role.id)}
              >
                <Shield className="ml-2 h-4 w-4" />
                {role.nameAr}
                {role.isSystem === 1 && (
                  <Badge variant="secondary" className="mr-auto text-xs">
                    نظام
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </Card>

        {/* Permissions Management */}
        <div className="lg:col-span-3 space-y-4">
          {selectedRoleData && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedRoleData.nameAr}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedRoleData.descriptionAr || selectedRoleData.description}
                  </p>
                </div>
                {hasChanges && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={cancelChanges}>
                      <X className="ml-2 h-4 w-4" />
                      إلغاء
                    </Button>
                    <Button onClick={applyChanges}>
                      <Check className="ml-2 h-4 w-4" />
                      تطبيق التغييرات ({changesCount})
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Preview Stats */}
          {hasChanges && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">معاينة التغييرات</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      +{additionsCount} إضافة
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      -{removalsCount} إزالة
                    </span>
                    <span className="text-muted-foreground">
                      المجموع: {currentPermissionsCount} → {finalCount}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Permissions Grid */}
          {rolePermissionsLoading ? (
            <Card className="p-4">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </Card>
          ) : (
            <Tabs defaultValue={Object.keys(groupedPermissions || {})[0]} className="w-full">
              <TabsList className="w-full justify-start">
                {Object.keys(groupedPermissions || {}).map((resource) => (
                  <TabsTrigger key={resource} value={resource} className="capitalize">
                    {resource}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(groupedPermissions || {}).map(([resource, perms]: [string, any]) => (
                <TabsContent key={resource} value={resource}>
                  <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {perms.map((permission: any) => {
                        const isAssigned = isPermissionAssigned(permission.id);
                        const hasChange = permissionChanges.has(permission.id);
                        const willBeAssigned = hasChange ? !isAssigned : isAssigned;

                        return (
                          <div
                            key={permission.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${
                              hasChange
                                ? willBeAssigned
                                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                : willBeAssigned
                                ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                                : "bg-muted/50"
                            }`}
                          >
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={willBeAssigned}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.nameAr}
                              </label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {permission.descriptionAr || permission.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {permission.action}
                                </Badge>
                                {hasChange && (
                                  <Badge
                                    variant={willBeAssigned ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {willBeAssigned ? "سيتم الإضافة" : "سيتم الإزالة"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
