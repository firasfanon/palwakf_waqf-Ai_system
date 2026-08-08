import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
  hasAvatar?: boolean;
}

export default function ListSkeleton({ count = 5, hasAvatar = false }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
          {hasAvatar && <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
