import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ExternalLink, Loader2, Search as SearchIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Search() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results, isLoading, refetch } = trpc.search.query.useQuery(
    {
      query: searchQuery,
      category: category === "all" ? undefined : category,
      limit: 10,
    },
    { enabled: !!searchQuery }
  );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query);
      refetch();
    }
  };

  const applyQuickLink = (nextCategory: string, nextQuery: string) => {
    setCategory(nextCategory);
    setQuery(nextQuery);
    setSearchQuery(nextQuery);
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      law: "قانون",
      jurisprudence: "فقه",
      majalla: "مجلة الأحكام",
      historical: "تاريخي",
      administrative: "إداري",
      reference: "مرجع",
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      law: "border-primary/20 bg-primary/10 text-primary",
      jurisprudence: "border-secondary/30 bg-secondary/15 text-foreground",
      majalla: "border-primary/15 bg-card/80 text-foreground",
      historical: "border-accent/25 bg-accent/10 text-foreground",
      administrative: "border-destructive/20 bg-destructive/10 text-destructive",
      reference: "border-border bg-muted/50 text-foreground",
    };
    return colors[cat] || colors.reference;
  };

  return (
    <div dir="rtl" className="public-page-shell">
      <header className="public-page-header">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <SearchIcon className="w-6 h-6 text-secondary" />
                <h1 className="text-xl font-bold text-foreground">البحث في قاعدة المعرفة</h1>
              </div>
            </div>
            <Button asChild>
              <Link href="/chat">ابدأ المحادثة</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="public-page-hero py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-6 text-center">
            <div className="public-page-title-icon mx-auto">
              <SearchIcon className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">ابحث في قاعدة المعرفة</h2>
            <p className="text-lg text-muted-foreground">
              ابحث عن المعلومات القانونية والشرعية المتعلقة بالأوقاف الإسلامية من خلال هوية موحدة
              تعتمد على الإعدادات المركزية للموقع.
            </p>

            <Card className="public-surface-card text-right">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ابحث عن موضوع، قانون، أو حكم شرعي..."
                      className="flex-1 text-base"
                    />
                    <Button type="submit" disabled={!query.trim() || isLoading} className="sm:min-w-28">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <SearchIcon className="w-5 h-5 ml-2" />
                          بحث
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-sm text-muted-foreground">التصنيف:</span>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="sm:w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="law">قانون</SelectItem>
                        <SelectItem value="jurisprudence">فقه</SelectItem>
                        <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                        <SelectItem value="historical">تاريخي</SelectItem>
                        <SelectItem value="administrative">إداري</SelectItem>
                        <SelectItem value="reference">مرجع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {searchQuery && (
              <div className="mb-6 text-right">
                <h3 className="text-lg font-bold text-foreground">
                  نتائج البحث عن: <span className="text-primary">"{searchQuery}"</span>
                </h3>
                {results && (
                  <p className="mt-1 text-sm text-muted-foreground">تم العثور على {results.length} نتيجة</p>
                )}
              </div>
            )}

            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="public-surface-card">
                    <CardHeader>
                      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && results && results.length > 0 && (
              <div className="space-y-4">
                {results.map((doc) => (
                  <Card key={doc.id} className="public-surface-card text-right transition-colors hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge className={getCategoryColor(doc.category)}>{getCategoryLabel(doc.category)}</Badge>
                            <Badge variant="outline" className="text-xs">
                              درجة الصلة: {doc.relevanceScore}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{doc.title}</CardTitle>
                          {doc.source && (
                            <CardDescription className="mt-2 flex items-center gap-1 justify-end">
                              <BookOpen className="w-3 h-3" />
                              {doc.source}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 leading-relaxed text-muted-foreground">{doc.content.substring(0, 300)}...</p>
                      {doc.sourceUrl && (
                        <Button variant="link" className="mt-2 h-auto p-0 text-primary" asChild>
                          <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 ml-1" />
                            المصدر الأصلي
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && results && results.length === 0 && searchQuery && (
              <Card className="public-empty-state public-surface-card">
                <CardContent className="py-12 text-center">
                  <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-bold text-foreground">لم يتم العثور على نتائج</h3>
                  <p className="mb-4 text-muted-foreground">جرّب استخدام كلمات مفتاحية مختلفة أو تصنيف آخر.</p>
                  <Button asChild>
                    <Link href="/chat">اسأل النموذج مباشرة</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {!searchQuery && (
              <Card className="public-empty-state public-surface-card">
                <CardContent className="py-12 text-center">
                  <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-bold text-foreground">ابدأ البحث</h3>
                  <p className="text-muted-foreground">أدخل كلمات البحث في الأعلى للوصول إلى المعلومات المتعلقة بالأوقاف.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="public-page-section public-page-section--muted">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <h3 className="mb-6 text-center text-2xl font-bold text-foreground">روابط سريعة</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="public-link-card public-link-card--blue">
                <CardHeader>
                  <CardTitle className="text-lg">القوانين الفلسطينية</CardTitle>
                  <CardDescription>قانون الأوقاف والتشريعات ذات الصلة</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => applyQuickLink("law", "قانون")}>
                    استعراض القوانين
                  </Button>
                </CardContent>
              </Card>

              <Card className="public-link-card public-link-card--gold">
                <CardHeader>
                  <CardTitle className="text-lg">الأحكام الفقهية</CardTitle>
                  <CardDescription>الأحكام الشرعية للوقف وشروطه</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => applyQuickLink("jurisprudence", "فقه")}>
                    استعراض الأحكام
                  </Button>
                </CardContent>
              </Card>

              <Card className="public-link-card public-link-card--red">
                <CardHeader>
                  <CardTitle className="text-lg">مجلة الأحكام العدلية</CardTitle>
                  <CardDescription>القانون المدني العثماني</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => applyQuickLink("majalla", "مجلة")}>
                    استعراض المجلة
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
