import React from "react";
import { cn } from "@/lib/utils";

type AdminPageProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

/** Shared daily-workspace shell. Governance pages receive a route-level attribute from AdminLayoutV2. */
export default function AdminPage({ children, className }: AdminPageProps) {
  return (
    <section
      className={cn("admin-page daily-workspace space-y-6 text-right", className)}
      dir="rtl"
    >
      {children}
    </section>
  );
}
