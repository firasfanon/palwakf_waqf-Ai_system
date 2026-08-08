import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminCardProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * AdminCard
 * - Consistent card wrapper for admin screens.
 * - data-admin-card="true" allows admin.css to harden surfaces.
 */
export default function AdminCard({
  title,
  description,
  headerRight,
  children,
  className,
  contentClassName,
}: AdminCardProps) {
  return (
    <div className={cn("admin-card text-right", className)} data-admin-card="true" dir="rtl">
      {(title || description || headerRight) && (
        <div className={cn("flex flex-col gap-4 p-6 text-right md:flex-row md:items-start md:justify-between", !description && "py-4")}> 
          <div className="space-y-1">
            {title ? <div className="text-base md:text-lg font-semibold">{title}</div> : null}
            {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
          </div>
          {headerRight ? <div className="shrink-0 self-start md:self-auto">{headerRight}</div> : null}
        </div>
      )}
      <div className={cn("p-6 text-right", contentClassName)}>{children}</div>
    </div>
  );
}
