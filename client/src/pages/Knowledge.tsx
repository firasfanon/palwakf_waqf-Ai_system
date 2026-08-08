import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ExternalLink, Search } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PageHead } from "@/components/PageHead";

export default function Knowledge() {
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: allDocs, isLoading } = trpc.knowledge.list.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
  const { data: docDetail } = trpc.knowledge.getById.useQuery(
    { id: selectedDoc! },
    { enabled: !!selectedDoc }
  );

  const categories = [
    { value: "all", label: "الكل" },
    { value: "law", label: "قانون" },
    { value: "jurisprudence", label: "فقه" },
    { value: "majalla", label: "مجلة الأحكام" },
    { value: "historical", label: "تاريخي" },
    { value: "administrative", label: "إداري" },
    { value: "reference", label: "مرجع" },
  ];

  // Function to highlight search term in text
  const highlightText = (text: string) => {
    const search = debouncedSearch;
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-secondary/20 text-foreground px-0.5 rounded">$1</mark>');
  };

  // Function to extract snippet around search term
  const extractSnippet = (text: string, maxLength: number = 200) => {
    const search = debouncedSearch;
    if (!search.trim()) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    
    const lowerText = text.toLowerCase();
    const lowerSearch = search.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);
    
    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    const start = Math.max(0, index - Math.floor(maxLength / 2));
    const end = Math.min(text.length, start + maxLength);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      law: "border border-primary/20 bg-primary/10 text-primary",
      jurisprudence: "border border-secondary/30 bg-secondary/15 text-secondary",
      majalla: "border border-border bg-accent text-accent-foreground",
      historical: "border border-destructive/20 bg-destructive/10 text-destructive",
      administrative: "border border-primary/15 bg-primary/8 text-primary",
      reference: "border border-border bg-muted text-muted-foreground",
    };
    return colors[cat] || colors.reference;
  };

  const filterDocs = (category: string) => {
    let docs = allDocs || [];
    
    // Filter by category
    if (category !== "all") {
      docs = docs.filter((doc) => doc.category === category);
    }
    
    // Filter by search term (using debounced value)
    if (debouncedSearch.trim()) {
      const lowerSearch = debouncedSearch.toLowerCase();
      docs = docs.filter((doc) => 
        doc.title.toLowerCase().includes(lowerSearch) ||
        doc.content.toLowerCase().includes(lowerSearch) ||
        doc.source?.toLowerCase().includes(lowerSearch)
      );
    }
    
    return docs;
  };

  return (
    <div dir="rtl" className="public-page-shell">
      {/* Header */}
      <header className="public-page-header">
        <div className="container py-4" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-secondary" />
                <h1 className="text-xl font-bold text-foreground text-right">قاعدة المعرفة</h1>
              </div>
            </div>
            <Button asChild>
              <Link href="/chat" >ابدأ المحادثة</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="public-page-hero py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="public-page-title-icon mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold text-foreground text-right">قاعدة المعرفة الشاملة</h2>
            <p className="text-lg text-muted-foreground text-right">
              مكتبة شاملة من القوانين والأحكام الشرعية والمراجع التاريخية المتعلقة بالأوقاف الإسلامية في فلسطين
            </p>
            
            {/* Search Box */}
            <div className="relative max-w-2xl mx-auto mt-8 public-soft-card rounded-2xl p-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث في العناوين والمحتوى (يشمل البحث في محتوى ملفات PDF)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 text-base border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
            
            {searchTerm && (
              <p className="text-sm text-muted-foreground text-right">
                النتائج: {filterDocs(activeCategory).length} مرجع
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="public-page-tabs grid w-full grid-cols-7 mb-8 h-auto">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat.value} 
                    value={cat.value} 
                    className="text-sm"
                    onClick={() => setActiveCategory(cat.value)}
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat.value} value={cat.value}>
                  {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="public-surface-card">
                          <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-20 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {filterDocs(cat.value).map((doc) => (
                        <Card
                          key={doc.id}
                          className="public-surface-card hover:border-primary/50 cursor-pointer"
                          onClick={() => setSelectedDoc(doc.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge className={getCategoryColor(doc.category)}>
                                {categories.find((c) => c.value === doc.category)?.label || doc.category}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg leading-tight">{doc.title}</CardTitle>
                            {doc.source && (
                              <CardDescription className="flex items-center gap-1 mt-2">
                                <BookOpen className="w-3 h-3" />
                                {doc.source}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div 
                              className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  extractSnippet(doc.content, 200)
                                )
                              }}
                            />
                            {searchTerm && doc.pdfUrl && (
                              <p className="text-xs text-primary mt-2 flex items-center gap-1 text-right">
                                <BookOpen className="w-3 h-3" />
                                يتضمن محتوى PDF
                              </p>
                            )}
                            <Button variant="link" className="mt-2 p-0 h-auto text-primary">
                              اقرأ المزيد ←
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {!isLoading && filterDocs(cat.value).length === 0 && (
                    <Card className="public-surface-card">
                      <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-2 text-right">
                          لا توجد وثائق في هذا التصنيف
                        </h3>
                        <p className="text-muted-foreground text-right">جرب تصنيفاً آخر أو استخدم البحث</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="public-surface-card flex h-[min(90vh,52rem)] w-[min(96vw,72rem)] max-w-[72rem] flex-col overflow-hidden p-0 text-right" dir="rtl">
          <div dir="rtl" className="flex min-h-0 w-full flex-1 flex-col text-right">
            <DialogHeader className="items-end gap-3 border-b px-6 py-5 text-right sm:px-8">
              <DialogTitle className="w-full break-words text-2xl leading-relaxed text-right [overflow-wrap:anywhere]">
                {docDetail?.title}
              </DialogTitle>
              {docDetail && (
                <div className="flex w-full flex-wrap items-center justify-end gap-2 text-right">
                  <Badge className={getCategoryColor(docDetail.category)}>
                    {categories.find((c) => c.value === docDetail.category)?.label || docDetail.category}
                  </Badge>
                  {docDetail.source && (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                      <BookOpen className="h-3 w-3 shrink-0" />
                      <span className="break-words [overflow-wrap:anywhere]">{docDetail.source}</span>
                    </span>
                  )}
                </div>
              )}
            </DialogHeader>

            <ScrollArea className="min-h-0 flex-1 px-6 py-5 sm:px-8" dir="rtl">
              {docDetail && (
                <div dir="rtl" className="prose-arabic min-w-0 max-w-none space-y-4 text-right">
                  <p className="whitespace-pre-wrap break-words leading-8 text-right [overflow-wrap:anywhere]">
                    {docDetail.content}
                  </p>
                  {docDetail.sourceUrl && (
                    <div className="border-t pt-4 text-right">
                      <Button variant="outline" asChild>
                        <a
                          href={docDetail.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-2 break-all text-right"
                        >
                          <ExternalLink className="h-4 w-4 shrink-0" />
                          <span className="truncate sm:text-sm md:text-base">المصدر الأصلي</span>
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Section */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center text-right">إحصائيات قاعدة المعرفة</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="public-surface-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-primary">{allDocs?.length || 0}</CardTitle>
                  <CardDescription>وثيقة ومرجع</CardDescription>
                </CardHeader>
              </Card>
              <Card className="public-surface-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-primary">6</CardTitle>
                  <CardDescription>تصنيفات رئيسية</CardDescription>
                </CardHeader>
              </Card>
              <Card className="public-surface-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-primary">100+</CardTitle>
                  <CardDescription>سنة من التاريخ</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
