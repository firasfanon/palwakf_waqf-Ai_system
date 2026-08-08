import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Search, Trash2, MessageSquare, Calendar } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FavoriteConversations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: favorites = [], isLoading, refetch } = trpc.favorites.list.useQuery();

  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("تم إزالة المحادثة من المفضلة");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("فشل إزالة المحادثة: " + error.message);
    },
  });

  const filteredFavorites = favorites.filter((favorite) => {
    return (
      favorite.conversation?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="public-page-shell" dir="rtl">
        <section className="public-page-section">
          <div className="container mx-auto py-8">
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-muted-foreground">جاري التحميل...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="public-page-shell" dir="rtl">
      <section className="public-page-hero py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="public-page-title-icon mx-auto">
              <Star className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">المحادثات المفضلة</h1>
            <p className="text-lg text-muted-foreground">جميع المحادثات المهمة التي قمت بوضع علامة عليها للرجوع إليها لاحقًا ضمن هوية عامة موحدة.</p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container mx-auto px-4">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["إجمالي المحادثات", favorites.length],
              ["النتائج المعروضة", filteredFavorites.length],
            ].map(([label, value]) => (
              <Card key={String(label)} className="public-stat-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{String(value)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="public-surface-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                البحث في المحادثات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ابحث في المحادثات المفضلة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
            </CardContent>
          </Card>

          {filteredFavorites.length === 0 ? (
            <Card className="public-empty-state public-surface-card">
              <CardContent className="py-12 text-center">
                <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">لا توجد محادثات مفضلة</h3>
                <p className="mb-4 text-muted-foreground">{searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لم تقم بإضافة أي محادثات إلى المفضلة بعد"}</p>
                <Link href="/chat">
                  <Button>
                    <MessageSquare className="ml-2 h-4 w-4" />
                    ابدأ محادثة جديدة
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredFavorites.map((favorite) => (
                <Card key={favorite.id} className="public-surface-card">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2 flex items-center gap-2 text-lg">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          {favorite.conversation?.title || "محادثة"}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(favorite.conversation?.createdAt || favorite.createdAt).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <Badge variant="outline">أُضيفت للمفضلة: {new Date(favorite.createdAt).toLocaleDateString("ar-EG")}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/chat/${favorite.conversationId}`}>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="ml-1 h-4 w-4" />
                            فتح
                          </Button>
                        </Link>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteId(favorite.conversationId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {favorite.notes && (
                    <CardContent>
                      <div className="rounded-md bg-muted p-3">
                        <p className="mb-1 text-sm font-medium">ملاحظات:</p>
                        <p className="text-sm text-muted-foreground">{favorite.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl" className="public-surface-card">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإزالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة هذه المحادثة من المفضلة؟ يمكنك إضافتها مرة أخرى في أي وقت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && removeFavorite.mutate({ conversationId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
