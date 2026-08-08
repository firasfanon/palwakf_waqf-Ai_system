import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trendPercent?: number;
  className?: string;
};

export default function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trendPercent,
  className,
}: AdminStatCardProps) {
  const trend = typeof trendPercent === "number" ? trendPercent : null;
  const trendUp = trend !== null ? trend >= 0 : false;

  return (
    <Card className={cn("admin-card text-right", className)} data-admin-card="true">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
            {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
          </div>

          <div className="flex flex-col items-start gap-2 text-right">
            {Icon ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/40">
                <Icon className="h-4 w-4 text-primary" />
              </span>
            ) : null}

            {trend !== null ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  trendUp
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                )}
              >
                {trendUp ? "▲" : "▼"} {Math.abs(trend)}%
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
