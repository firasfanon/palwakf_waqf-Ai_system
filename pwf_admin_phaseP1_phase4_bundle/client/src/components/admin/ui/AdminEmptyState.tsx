import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

/**
 * AdminEmptyState
 * - Unified empty state for admin tables/lists.
 * - RTL-safe, neutral tone in light/dark.
 */
export default function AdminEmptyState({
  title = "لا توجد بيانات",
  description = "لم يتم العثور على عناصر مطابقة.",
  icon,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={cn("p-8 text-center", className)}>
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/40">
        {icon ?? <Inbox className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-4 flex items-center justify-center">{action}</div> : null}
    </div>
  );
}
