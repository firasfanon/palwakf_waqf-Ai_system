import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminPage from "@/components/admin/ui/AdminPage";

export default function DataFetching() {
  const [isRunning, setIsRunning] = useState(false);
  const [wikiTopic, setWikiTopic] = useState("الوقف الإسلامي");
  const [pdfUrl, setPdfUrl] = useState("");

  // Fetch statistics
  const { data: stats } = trpc.fetcher.getStats.useQuery();
  const { data: recentLogs } = trpc.fetcher.getRecentLogs.useQuery({ limit: 5 });

  // Fetch all sources mutation
  const fetchAllMutation = trpc.fetcher.fetchAll.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ نجح الجلب", {
          description: `تم جلب وحفظ ${data.savedCount} عنصر من جميع المصادر`,
        });
      } else {
        toast.error("❌ فشل الجلب", {
          description: data.error,
        });
      }
      setIsRunning(false);
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
      setIsRunning(false);
    },
  });

  // Fetch Wikipedia mutation
  const fetchWikiMutation = trpc.fetcher.fetchWikipedia.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ نجح الجلب من ويكيبيديا", {
          description: `تم جلب ${data.articles?.length || 0} مقالة`,
        });
      } else {
        toast.error("❌ فشل الجلب", {
          description: data.error,
        });
      }
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  // Fetch News mutation
  const fetchNewsMutation = trpc.fetcher.fetchNews.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ نجح جلب الأخبار", {
          description: `تم جلب ${data.news?.length || 0} خبر`,
        });
      } else {
        toast.error("❌ فشل الجلب", {
          description: data.error,
        });
      }
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  // Fetch PDF mutation
  const fetchPDFMutation = trpc.fetcher.fetchPDF.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ نجح جلب PDF", {
          description: `تم استخراج ${data.pdfContent?.content.length || 0} حرف`,
        });
      } else {
        toast.error("❌ فشل الجلب", {
          description: data.error,
        });
      }
    },
    onError: (error) => {
      toast.error("❌ خطأ", {
        description: error.message,
      });
    },
  });

  const handleFetchAll = () => {
    setIsRunning(true);
    fetchAllMutation.mutate();
  };

  const handleFetchWikipedia = () => {
    if (!wikiTopic.trim()) {
      toast.warning("⚠️ تنبيه", {
        description: "الرجاء إدخال موضوع البحث",
      });
      return;
    }
    fetchWikiMutation.mutate({ topic: wikiTopic, maxArticles: 5 });
  };

  const handleFetchNews = () => {
    fetchNewsMutation.mutate();
  };

  const handleFetchPDF = () => {
    if (!pdfUrl.trim()) {
      toast.warning("⚠️ تنبيه", {
        description: "الرجاء إدخال رابط PDF",
      });
      return;
    }
    fetchPDFMutation.mutate({ url: pdfUrl });
  };

  return (
    <AdminPage>
<div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">أدوات الجلب التلقائي</h1>
          <p className="text-muted-foreground mt-2">
            جلب البيانات من مصادر خارجية لإثراء قاعدة المعرفة
          </p>
        </div>
        <Button
          onClick={handleFetchAll}
          disabled={isRunning || fetchAllMutation.isPending}
          size="lg"
          className="gap-2"
        >
          {(isRunning || fetchAllMutation.isPending) ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري الجلب...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              جلب من جميع المصادر
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="wikipedia">ويكيبيديا</TabsTrigger>
          <TabsTrigger value="news">الأخبار</TabsTrigger>
          <TabsTrigger value="pdf">ملفات PDF</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي عمليات الجلب</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalFetches || 0}</div>
                <p className="text-xs text-muted-foreground">عملية جلب</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">عناصر مجلوبة</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalItemsFetched || 0}</div>
                <p className="text-xs text-muted-foreground">عنصر</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">عناصر معتمدة</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.totalItemsApproved || 0}</div>
                <p className="text-xs text-muted-foreground">عنصر</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                  const total = stats?.totalFetches ?? 0;
                  const ok = stats?.successfulFetches ?? 0;
                  const rate = total > 0 ? Math.round((ok / total) * 100) : 0;
                  return `${Number.isFinite(rate) ? rate : 0}%`;
                })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.successfulFetches || 0} من {stats?.totalFetches || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Logs */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>آخر عمليات الجلب</CardTitle>
              <CardDescription>سجل أحدث 5 عمليات</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLogs && recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : log.status === "failed" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">عملية #{log.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.startedAt).toLocaleString("ar-EG")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{log.itemsFetched} عنصر</p>
                        <p className="text-xs text-muted-foreground">
                          {log.itemsApproved} معتمد
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد عمليات جلب بعد
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ويكيبيديا العربية</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10 مواضيع</div>
                <p className="text-xs text-muted-foreground">مقالات عن الأوقاف الإسلامية</p>
                <Badge className="mt-2" variant="secondary">
                  تلقائي
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أخبار RSS</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 مصادر</div>
                <p className="text-xs text-muted-foreground">Google News + وكالات</p>
                <Badge className="mt-2" variant="secondary">
                  تلقائي
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Web Scraping</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">معطل</div>
                <p className="text-xs text-muted-foreground">يحتاج URLs محددة</p>
                <Badge className="mt-2" variant="outline">
                  يدوي
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ملفات PDF</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">حسب الطلب</div>
                <p className="text-xs text-muted-foreground">تحميل واستخراج نص</p>
                <Badge className="mt-2" variant="outline">
                  يدوي
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>كيف يعمل النظام؟</CardTitle>
              <CardDescription>خطوات الجلب التلقائي للبيانات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">1. الجلب من المصادر</h4>
                  <p className="text-sm text-muted-foreground">
                    يتم جلب المحتوى من ويكيبيديا، RSS feeds، والمواقع المحددة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">2. المعالجة والتصنيف</h4>
                  <p className="text-sm text-muted-foreground">
                    يتم تنظيف النصوص، استخراج الكلمات المفتاحية، وتحديد الفئة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">3. الحفظ للمراجعة</h4>
                  <p className="text-sm text-muted-foreground">
                    يتم حفظ المحتوى في جدول "المحتوى المجلوب" بحالة "قيد المراجعة"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">4. الموافقة اليدوية</h4>
                  <p className="text-sm text-muted-foreground">
                    يقوم المسؤول بمراجعة المحتوى والموافقة عليه لنقله إلى قاعدة المعرفة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wikipedia Tab */}
        <TabsContent value="wikipedia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جلب من ويكيبيديا العربية</CardTitle>
              <CardDescription>
                البحث عن مقالات متعلقة بالأوقاف الإسلامية في فلسطين
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wiki-topic">موضوع البحث</Label>
                <Input
                  id="wiki-topic"
                  value={wikiTopic}
                  onChange={(e) => setWikiTopic(e.target.value)}
                  placeholder="مثال: الوقف الإسلامي، مجلة الأحكام العدلية..."
                />
              </div>

              <Button
                onClick={handleFetchWikipedia}
                disabled={fetchWikiMutation.isPending}
                className="w-full"
              >
                {fetchWikiMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    جلب المقالات
                  </>
                )}
              </Button>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-semibold text-sm">المواضيع المقترحة:</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "الوقف الإسلامي",
                    "الأوقاف في فلسطين",
                    "الوقف الذري",
                    "مجلة الأحكام العدلية",
                    "قانون الأراضي العثماني",
                    "وزارة الأوقاف الفلسطينية",
                  ].map((topic) => (
                    <Badge
                      key={topic}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setWikiTopic(topic)}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جلب الأخبار</CardTitle>
              <CardDescription>
                جلب آخر الأخبار المتعلقة بالأوقاف من Google News
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                سيتم البحث عن الأخبار المتعلقة بـ:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>الأوقاف في فلسطين</li>
                <li>المسجد الأقصى</li>
                <li>وزارة الأوقاف الفلسطينية</li>
              </ul>

              <Button
                onClick={handleFetchNews}
                disabled={fetchNewsMutation.isPending}
                className="w-full"
              >
                {fetchNewsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الجلب...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    جلب الأخبار
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Tab */}
        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جلب ملف PDF</CardTitle>
              <CardDescription>
                تحميل واستخراج النص من ملفات PDF (يدعم OCR للنصوص المصورة)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-url">رابط ملف PDF</Label>
                <Input
                  id="pdf-url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  type="url"
                />
              </div>

              <Button
                onClick={handleFetchPDF}
                disabled={fetchPDFMutation.isPending}
                className="w-full"
              >
                {fetchPDFMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري التحميل والاستخراج...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    تحميل واستخراج
                  </>
                )}
              </Button>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>ملاحظة:</strong> استخراج النص من PDFs قد يستغرق وقتاً طويلاً،
                  خاصة للملفات الكبيرة أو المصورة (OCR).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AdminPage>
  );
}
