import React from "react";

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
    <div className={cn("admin-table-wrapper text-right", className)} dir="rtl">
      {(title || description || headerRight) && (
        <div className="flex flex-col gap-4 border-b p-6 text-right md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {title ? <div className="text-base md:text-lg font-semibold">{title}</div> : null}
            {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
          </div>
          {headerRight ? <div className="shrink-0 self-start md:self-auto">{headerRight}</div> : null}
        </div>
      )}
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
    </div>
  );
}
