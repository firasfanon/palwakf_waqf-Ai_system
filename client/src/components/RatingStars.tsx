import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  entityType: string;
  entityId: number;
  title?: string;
  showStats?: boolean;
}

export default function RatingStars({
  entityType,
  entityId,
  title = "التقييم",
  showStats = true,
}: RatingStarsProps) {
  const { user } = useAuth();
  const [hoveredRating, setHoveredRating] = useState(0);

  // Get rating stats
  const { data: stats } = trpc.ratings.getStats.useQuery({
    entityType,
    entityId,
  });

  // Get user's rating
  const { data: userRating, refetch: refetchUserRating } = trpc.ratings.getUserRating.useQuery(
    {
      entityType,
      entityId,
    },
    { enabled: !!user }
  );

  // Add/update rating mutation
  const rateMutation = trpc.ratings.rate.useMutation({
    onSuccess: () => {
      refetchUserRating();
    },
  });

  // Delete rating mutation
  const deleteMutation = trpc.ratings.delete.useMutation({
    onSuccess: () => {
      refetchUserRating();
    },
  });

  const handleRate = (rating: number) => {
    if (!user) {
      alert("يرجى تسجيل الدخول لإضافة تقييم");
      return;
    }
    rateMutation.mutate({
      entityType,
      entityId,
      rating,
    });
  };

  const handleDeleteRating = () => {
    if (confirm("هل أنت متأكد من حذف تقييمك؟")) {
      deleteMutation.mutate({
        entityType,
        entityId,
      });
    }
  };

  const currentRating = userRating?.rating || 0;
  const displayRating = hoveredRating || currentRating;
  const avgRating = stats?.averageRating || 0;
  const totalRatings = stats?.totalRatings || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        {showStats && (
          <div className="flex items-center gap-6 p-4 rounded-lg bg-accent/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                متوسط التقييم من {totalRatings} {totalRatings === 1 ? "تقييم" : "تقييمات"}
              </p>
            </div>
          </div>
        )}

        {/* User Rating */}
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {currentRating > 0 ? "تقييمك:" : "قيّم هذا المحتوى:"}
          </p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={rateMutation.isPending || deleteMutation.isPending || !user}
                className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 hover:text-yellow-200"
                  )}
                />
              </button>
            ))}
          </div>

          {currentRating > 0 && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                لقد قيّمت هذا المحتوى بـ {currentRating} {currentRating === 1 ? "نجمة" : "نجوم"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteRating}
                disabled={deleteMutation.isPending}
                className="text-xs h-7 text-destructive hover:text-destructive"
              >
                حذف التقييم
              </Button>
            </div>
          )}

          {!user && (
            <p className="text-sm text-muted-foreground">
              يرجى تسجيل الدخول لإضافة تقييم
            </p>
          )}
        </div>

        {/* Rating Distribution */}
        {showStats && stats && stats.distribution && (
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">توزيع التقييمات:</p>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
