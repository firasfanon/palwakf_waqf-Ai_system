import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type StatusTone = "success" | "warning" | "danger" | "info";

const icons: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

export function StatusBadge({
  tone,
  children,
  className = "",
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <span
      className={`ds-status ${className}`.trim()}
      data-tone={tone}
      role="status"
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{children}</span>
    </span>
  );
}
