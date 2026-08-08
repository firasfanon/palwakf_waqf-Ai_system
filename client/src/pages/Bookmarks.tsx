import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Search, Trash2, ExternalLink, BookOpen, Filter } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function Bookmarks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: bookmarks = [], isLoading, refetch } = trpc.bookmarks.list.useQuery();
  const { data: collections = [] } = trpc.bookmarks.collections.useQuery();

  const removeBookmark = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      toast.success("تم إزالة المرجع من المفضلة");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("فشل إزالة المرجع: " + error.message);
    },
  });

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.document?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.document?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollection = selectedCollection === "all" || bookmark.collectionName === selectedCollection;
    return matchesSearch && matchesCollection;
  });

  const groupedBookmarks = filteredBookmarks.reduce((acc, bookmark) => {
    const collection = bookmark.collectionName || "غير مصنف";
    if (!acc[collection]) acc[collection] = [];
    acc[collection].push(bookmark);
    return acc;
  }, {} as Record<string, typeof bookmarks>);

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
              <Bookmark className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">المراجع المحفوظة</h1>
            <p className="text-lg text-muted-foreground">جميع المراجع والوثائق التي قمت بحفظها للرجوع إليها لاحقًا ضمن واجهة متسقة مع الهوية المركزية للموقع.</p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container mx-auto px-4">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["إجمالي المراجع", bookmarks.length],
              ["المجموعات", collections.length || 1],
              ["النتائج المعروضة", filteredBookmarks.length],
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
                <Filter className="h-5 w-5 text-primary" />
                البحث والتصفية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="ابحث في المراجع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                </div>
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المجموعات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المجموعات</SelectItem>
                    {collections.map((collection) => (
                      <SelectItem key={collection} value={collection}>
                        {collection}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredBookmarks.length === 0 ? (
            <Card className="public-empty-state public-surface-card">
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">لا توجد مراجع محفوظة</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchQuery || selectedCollection !== "all" ? "لا توجد نتائج مطابقة للبحث" : "لم تقم بحفظ أي مراجع بعد"}
                </p>
                <Link href="/knowledge-base">
                  <Button>
                    <BookOpen className="ml-2 h-4 w-4" />
                    تصفح قاعدة المعرفة
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {(Object.entries(groupedBookmarks) as Array<[string, typeof filteredBookmarks]>).map(([collection, items]) => (
                <div key={collection}>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <Badge variant="outline" className="text-base">{collection}</Badge>
                    <span className="text-sm text-muted-foreground">({items.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {items.map((bookmark) => (
                      <Card key={bookmark.id} className="public-surface-card">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="mb-2 text-lg">{bookmark.document?.title || "وثيقة"}</CardTitle>
                              <CardDescription className="flex flex-wrap items-center gap-2">
                                <Badge className="border-primary/20 bg-primary/10 text-primary">{bookmark.document?.category || "عام"}</Badge>
                                {bookmark.document?.source && <span className="text-xs">{bookmark.document.source}</span>}
                                <span className="text-xs">حُفظ في: {new Date(bookmark.createdAt).toLocaleDateString("ar-EG")}</span>
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/knowledge-base/${bookmark.documentId}`}>
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteId(bookmark.documentId)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {bookmark.notes && (
                          <CardContent>
                            <div className="rounded-md bg-muted p-3">
                              <p className="mb-1 text-sm font-medium">ملاحظات:</p>
                              <p className="text-sm text-muted-foreground">{bookmark.notes}</p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
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
              هل أنت متأكد من إزالة هذا المرجع من المفضلة؟ يمكنك إضافته مرة أخرى في أي وقت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && removeBookmark.mutate({ documentId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
