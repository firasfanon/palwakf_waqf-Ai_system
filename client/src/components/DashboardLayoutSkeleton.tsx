import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" dir="rtl">
      <div className="relative hidden w-[280px] flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] p-4 md:flex">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.16)] px-3 py-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>

        <div className="mt-auto rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.16)] p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between rounded-[24px] border border-[rgba(31,90,166,0.18)] bg-[rgba(31,90,166,0.08)] px-5 py-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-8 w-40 rounded-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="mt-4 h-64 rounded-3xl" />
      </div>
    </div>
  );
}
