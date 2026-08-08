import React from "react";
import AdminCard from "@/components/admin/ui/AdminCard";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import { cn } from "@/lib/utils";

type AdminTableProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingFallback?: React.ReactNode;
  empty?: boolean;
  emptyState?: React.ReactNode;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  className?: string;
};

/**
 * AdminTable
 * - Consistent wrapper for tables in admin.
 * - Handles: header, scroll container, optional footer, loading, empty state.
 * - Adds .admin-table class for CSS alignment tweaks (actions column, etc.).
 */
export default function AdminTable({
  title,
  description,
  headerRight,
  footer,
  children,
  isLoading,
  loadingFallback,
  empty,
  emptyState,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className,
}: AdminTableProps) {
  return (
    <AdminCard
      title={title}
      description={description}
      headerRight={headerRight}
      className={cn("p-0 admin-table", className)}
      contentClassName="p-0"
    >
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          loadingFallback ?? <div className="p-6 text-sm text-muted-foreground">جارٍ التحميل…</div>
        ) : empty ? (
          emptyState ?? (
            <AdminEmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          )
        ) : (
          children
        )}
      </div>

      {footer ? <div className="border-t p-4">{footer}</div> : null}
    </AdminCard>
  );
}
