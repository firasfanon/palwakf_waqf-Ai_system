import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Building2,
  Gavel,
  Scale,
  FileCheck,
  ScrollText,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";

const typeLabels: Record<string, { label: string; icon: any }> = {
  property: { label: "عقارات وقفية", icon: Building2 },
  case: { label: "قضايا", icon: Gavel },
  ruling: { label: "أحكام قضائية", icon: Scale },
  deed: { label: "حجج وقفية", icon: FileCheck },
  instruction: { label: "تعليمات وزارية", icon: ScrollText },
  knowledge: { label: "وثائق معرفية", icon: FileText },
};

const statusLabels: Record<string, string> = {
  pending: "قيد النظر",
  under_investigation: "قيد التحقيق",
  in_court: "في المحكمة",
  resolved: "محلول",
  closed: "مغلق",
  active: "نشط",
  inactive: "غير نشط",
};

export default function AdvancedSearch() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "property",
    "case",
    "ruling",
    "deed",
    "instruction",
    "knowledge",
  ]);
  const [governorate, setGovernorate] = useState("");
  const [status, setStatus] = useState("");

  const { data: results, isLoading, refetch } = trpc.advancedSearch.advanced.useQuery(
    {
      query: searchQuery || undefined,
      types: selectedTypes.length > 0 ? (selectedTypes as any) : undefined,
      governorate: governorate || undefined,
      status: status || undefined,
      limit: 100,
    },
    { enabled: false }
  );

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const getTypeIcon = (type: string) => {
    const Icon = typeLabels[type]?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeBadgeClass = (type: string) => {
    const styles: Record<string, string> = {
      property: "border-primary/20 bg-primary/10 text-primary",
      case: "border-secondary/30 bg-secondary/15 text-foreground",
      ruling: "border-accent/25 bg-accent/10 text-foreground",
      deed: "border-primary/15 bg-card text-foreground",
      instruction: "border-destructive/20 bg-destructive/10 text-destructive",
      knowledge: "border-border bg-muted/60 text-foreground",
    };
    return styles[type] || styles.knowledge;
  };

  if (authLoading || !user) {
    return (
      <div className="public-page-shell flex min-h-screen items-center justify-center" dir="rtl">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="public-page-shell" dir="rtl">
      <section className="public-page-hero py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl space-y-4 text-center">
            <div className="public-page-title-icon mx-auto">
              <Search className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">البحث المتقدم</h1>
            <p className="text-lg text-muted-foreground">ابحث عبر جميع أنواع السجلات في النظام ضمن واجهة عامة موحدة ومتسقة.</p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>العودة للرئيسية</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container mx-auto max-w-7xl space-y-6 px-4">
          <Card className="public-surface-card">
            <CardHeader>
              <CardTitle>معايير البحث</CardTitle>
              <CardDescription>حدد معايير البحث والفلاتر المطلوبة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search">كلمة البحث</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="search" placeholder="ابحث في جميع الحقول..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && refetch()} className="flex-1" />
                  <Button onClick={() => refetch()} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري البحث...
                      </>
                    ) : (
                      <>
                        <Search className="ml-2 h-4 w-4" />
                        بحث
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>أنواع السجلات</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(typeLabels).map(([type, { label, icon: Icon }]) => (
                    <div key={type} className="public-selection-card flex cursor-pointer items-center gap-3 rounded-xl p-3" data-active={selectedTypes.includes(type)} onClick={() => toggleType(type)}>
                      <Checkbox checked={selectedTypes.includes(type)} onCheckedChange={() => toggleType(type)} />
                      <div className="public-chip-icon !h-9 !w-9 !rounded-xl">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="governorate">المحافظة</Label>
                  <Input id="governorate" placeholder="مثال: القدس، نابلس، الخليل..." value={governorate} onChange={(e) => setGovernorate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Input id="status" placeholder="مثال: نشط، قيد النظر، محلول..." value={status} onChange={(e) => setStatus(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card className="public-surface-card">
              <CardHeader>
                <CardTitle>النتائج</CardTitle>
                <CardDescription>
                  تم العثور على {results.total} نتيجة
                  {searchQuery && ` لكلمة "${searchQuery}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.results.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">لا توجد نتائج</p>
                    <p className="mt-2 text-muted-foreground">جرّب تغيير معايير البحث أو الفلاتر.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.results.map((result: any, index: number) => (
                      <Card key={`${result.type}-${result.id}-${index}`} className="public-selection-card cursor-pointer" data-active="false" onClick={() => navigate(result.url)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {getTypeIcon(result.type)}
                                <span className={`rounded-full px-2 py-1 text-xs ${getTypeBadgeClass(result.type)}`}>
                                  {typeLabels[result.type]?.label}
                                </span>
                                {result.status && (
                                  <span className="rounded-full bg-secondary/20 px-2 py-1 text-xs text-foreground">
                                    {statusLabels[result.status] || result.status}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold">{result.title}</h3>
                              {result.subtitle && <p className="text-sm text-muted-foreground">{result.subtitle}</p>}
                              {result.description && <p className="line-clamp-2 text-sm text-muted-foreground">{result.description}</p>}
                              {result.governorate && <p className="text-xs text-muted-foreground">المحافظة: {result.governorate}</p>}
                              <p className="text-xs text-muted-foreground">تاريخ الإنشاء: {new Date(result.createdAt).toLocaleDateString("ar-EG")}</p>
                            </div>
                            <ExternalLink className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
