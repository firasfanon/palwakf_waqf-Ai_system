import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, Calendar, MapPin, FileText, Search, Filter, X } from "lucide-react";
import { Link } from "wouter";

export default function References() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");

  const { data: references, isLoading } = trpc.references.list.useQuery();

  const uniqueRegions = useMemo(() => {
    if (!references) return [];
    const regions = new Set(references.map((ref: any) => ref.region));
    return Array.from(regions).sort();
  }, [references]);

  const uniqueTypes = useMemo(() => {
    if (!references) return [];
    const types = new Set(references.map((ref: any) => ref.type));
    return Array.from(types).sort();
  }, [references]);

  const filteredReferences = useMemo(() => {
    if (!references) return [];

    return references.filter((ref: any) => {
      const matchesSearch =
        searchQuery === "" ||
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = selectedRegion === "all" || ref.region === selectedRegion;
      const matchesType = selectedType === "all" || ref.type === selectedType;
      const matchesYear =
        (startYear === "" || ref.year >= parseInt(startYear)) &&
        (endYear === "" || ref.year <= parseInt(endYear));

      return matchesSearch && matchesRegion && matchesType && matchesYear;
    });
  }, [references, searchQuery, selectedRegion, selectedType, startYear, endYear]);

  const stats = useMemo(() => {
    if (!filteredReferences) return { total: 0, byType: {}, byRegion: {} };

    const byType: Record<string, number> = {};
    const byRegion: Record<string, number> = {};

    filteredReferences.forEach((ref) => {
      byType[ref.type] = (byType[ref.type] || 0) + 1;
      byRegion[ref.region] = (byRegion[ref.region] || 0) + 1;
    });

    return {
      total: filteredReferences.length,
      byType,
      byRegion,
    };
  }, [filteredReferences]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedType("all");
    setStartYear("");
    setEndYear("");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedRegion !== "all" ||
    selectedType !== "all" ||
    startYear !== "" ||
    endYear !== "";

  if (isLoading) {
    return (
      <div className="public-page-shell" dir="rtl">
        <section className="public-page-section">
          <div className="container py-8">
            <Skeleton className="mb-6 h-12 w-64" />
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="public-page-shell" dir="rtl">
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
                <BookOpen className="w-6 h-6 text-secondary" />
                <h1 className="text-xl font-bold text-foreground">مراجع ملكية الأراضي</h1>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/search">بحث عام</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="public-page-hero py-12">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center space-y-4">
            <div className="public-page-title-icon mx-auto">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">مراجع ملكية الأراضي</h2>
            <p className="text-lg text-muted-foreground">
              استعرض وابحث في مجموعة شاملة من المراجع التاريخية والقانونية لملكية الأراضي في فلسطين
              ضمن واجهة موحدة تعتمد على الهوية المركزية للموقع.
            </p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {[
              ["إجمالي المراجع", stats.total],
              ["المناطق المغطاة", Object.keys(stats.byRegion).length],
              ["أنواع المراجع", Object.keys(stats.byType).length],
            ].map(([label, value]) => (
              <Card key={String(label)} className="public-stat-card">
                <CardHeader className="pb-3 text-right">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{String(value)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="public-surface-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <Filter className="h-5 w-5 text-primary" />
                فلترة وبحث متقدم
              </CardTitle>
              <CardDescription>استخدم الفلاتر للوصول إلى المراجع المطلوبة بسهولة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-right">
              <div className="space-y-2">
                <Label htmlFor="search">البحث في العنوان أو الوصف أو المؤلف</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="search" placeholder="ابحث في المراجع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="region">المنطقة</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المناطق</SelectItem>
                      {uniqueRegions.map((region) => (
                        <SelectItem key={String(region)} value={String(region)}>
                          {String(region)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">نوع المرجع</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={String(type)} value={String(type)}>
                          {String(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startYear">من سنة</Label>
                  <Input id="startYear" type="number" placeholder="مثال: 1900" value={startYear} onChange={(e) => setStartYear(e.target.value)} min="1800" max="2026" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endYear">إلى سنة</Label>
                  <Input id="endYear" type="number" placeholder="مثال: 2026" value={endYear} onChange={(e) => setEndYear(e.target.value)} min="1800" max="2026" />
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                  <X className="ml-2 h-4 w-4" />
                  مسح جميع الفلاتر
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">النتائج ({filteredReferences.length})</h2>

            {filteredReferences.length === 0 ? (
              <Card className="public-empty-state public-surface-card">
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">لا توجد نتائج</h3>
                  <p className="text-muted-foreground">لم يتم العثور على مراجع تطابق معايير البحث. جرّب تعديل الفلاتر.</p>
                </CardContent>
              </Card>
            ) : (
              filteredReferences.map((reference: any) => (
                <Card key={reference.id} className="public-surface-card text-right transition-colors hover:border-primary/40">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2 text-xl">{reference.title}</CardTitle>
                        {reference.author && <p className="mb-2 text-sm text-muted-foreground">المؤلف: {reference.author}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className="border-primary/20 bg-primary/10 text-primary">{reference.type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reference.description && <p className="leading-relaxed text-muted-foreground">{reference.description}</p>}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{reference.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{reference.year}</span>
                      </div>
                    </div>

                    {reference.sourceUrl && (
                      <div className="border-t pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="ml-2 h-4 w-4" />
                            عرض المرجع الأصلي
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
