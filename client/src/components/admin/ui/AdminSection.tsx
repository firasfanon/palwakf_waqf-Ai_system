import React from "react";
import { cn } from "@/lib/utils";

type AdminSectionProps = {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * AdminSection
 * - Unified section header (icon + title + optional right controls).
 * - Does not enforce a specific grid; children control layout.
 */
export default function AdminSection({ title, icon: Icon, right, children, className }: AdminSectionProps) {
  return (
    <section className={cn("space-y-4 text-right", className)} dir="rtl">
      <div className="flex flex-col gap-4 text-right md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-right">
          {Icon ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card/40">
              <Icon className="h-4 w-4 text-primary" />
            </span>
          ) : null}
          <h2 className="text-sm md:text-base font-semibold">{title}</h2>
        </div>
        {right ? <div className="shrink-0 self-start md:self-auto">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}
