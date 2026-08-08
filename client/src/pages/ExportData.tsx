import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileJson, FileSpreadsheet, MessageSquare, Bookmark, Search, Database, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ExportType = "conversations" | "bookmarks" | "searchHistory" | "allData";
type ExportFormat = "json" | "csv";

export default function ExportData() {
  const [selectedType, setSelectedType] = useState<ExportType>("conversations");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);

  const exportConversations = trpc.export.conversations.useMutation();
  const exportBookmarks = trpc.export.bookmarks.useMutation();
  const exportSearchHistory = trpc.export.searchHistory.useMutation();
  const exportAllData = trpc.export.allData.useMutation();

  useEffect(() => {
    if (selectedType === "allData" && selectedFormat === "csv") {
      setSelectedFormat("json");
    }
  }, [selectedType, selectedFormat]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let result;

      switch (selectedType) {
        case "conversations":
          result = await exportConversations.mutateAsync({ format: selectedFormat });
          break;
        case "bookmarks":
          result = await exportBookmarks.mutateAsync({ format: selectedFormat });
          break;
        case "searchHistory":
          result = await exportSearchHistory.mutateAsync({ format: selectedFormat });
          break;
        case "allData":
          result = await exportAllData.mutateAsync({ format: selectedFormat });
          break;
      }

      const blob = new Blob([result.data], {
        type: result.format === "json" ? "application/json" : "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error: any) {
      toast.error("فشل تصدير البيانات: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      value: "conversations" as ExportType,
      label: "المحادثات",
      description: "جميع محادثاتك مع النظام والرسائل المرتبطة بها",
      icon: MessageSquare,
      iconClass: "text-primary",
    },
    {
      value: "bookmarks" as ExportType,
      label: "المراجع المحفوظة",
      description: "جميع المراجع والوثائق التي قمت بحفظها",
      icon: Bookmark,
      iconClass: "text-secondary",
    },
    {
      value: "searchHistory" as ExportType,
      label: "سجل البحث",
      description: "جميع عمليات البحث التي قمت بها",
      icon: Search,
      iconClass: "text-accent-foreground",
    },
    {
      value: "allData" as ExportType,
      label: "جميع البيانات",
      description: "تصدير شامل لجميع بياناتك (JSON فقط)",
      icon: Database,
      iconClass: "text-foreground",
    },
  ];

  const selectedOption = exportOptions.find((opt) => opt.value === selectedType);
  const SelectedOptionIcon = selectedOption?.icon;

  return (
    <div className="public-page-shell" dir="rtl">
      <section className="public-page-hero py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="public-page-title-icon mx-auto">
              <Download className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">تصدير البيانات</h1>
            <p className="text-lg text-muted-foreground">قم بتصدير بياناتك بتنسيقات مختلفة للاحتفاظ بها أو استخدامها في تطبيقات أخرى مع أسلوب بصري موحد.</p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container mx-auto px-4">
          <Card className="public-note-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                ملاحظات مهمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• تنسيق JSON مناسب للاحتفاظ بالبيانات الكاملة والتفاصيل الدقيقة.</p>
              <p>• تنسيق CSV مناسب لفتح البيانات في Excel أو Google Sheets.</p>
              <p>• يتم تصدير البيانات بشكل فوري ولا يتم حفظها على الخادم.</p>
              <p>• جميع البيانات المصدرة تخصك فقط ولا يمكن لأحد آخر الوصول إليها.</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="public-surface-card">
                <CardHeader>
                  <CardTitle>اختر نوع البيانات</CardTitle>
                  <CardDescription>حدد البيانات التي تريد تصديرها.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {exportOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedType === option.value;
                      return (
                        <Card key={option.value} className="public-selection-card cursor-pointer" data-active={isSelected} onClick={() => setSelectedType(option.value)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-6 w-6 ${option.iconClass}`} />
                              <CardTitle className="text-base">{option.label}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="public-surface-card">
                <CardHeader>
                  <CardTitle>اختر التنسيق</CardTitle>
                  <CardDescription>حدد صيغة الملف المراد تصديره.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="public-selection-card cursor-pointer" data-active={selectedFormat === "json"} onClick={() => setSelectedFormat("json")}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <FileJson className="h-6 w-6 text-primary" />
                          <CardTitle className="text-base">JSON</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">تنسيق JSON للحفظ الكامل والبرمجة.</p>
                        <Badge variant="outline" className="mt-2">يحتفظ بجميع التفاصيل</Badge>
                      </CardContent>
                    </Card>

                    <Card className="public-selection-card cursor-pointer" data-active={selectedFormat === "csv" && selectedType !== "allData"} onClick={() => selectedType !== "allData" && setSelectedFormat("csv")}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="h-6 w-6 text-secondary" />
                          <CardTitle className="text-base">CSV</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">تنسيق CSV لفتح البيانات في Excel.</p>
                        <Badge variant="outline" className="mt-2">سهل القراءة</Badge>
                        {selectedType === "allData" && <Badge variant="destructive" className="mt-2 mr-2">غير متاح لهذا الخيار</Badge>}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="public-surface-card">
                <CardHeader>
                  <CardTitle>ملخص التصدير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">نوع البيانات:</p>
                    <div className="flex items-center gap-2">
                      {SelectedOptionIcon && selectedOption && (
                        <>
                          <SelectedOptionIcon className={`h-5 w-5 ${selectedOption.iconClass}`} />
                          <span className="font-medium">{selectedOption.label}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">التنسيق:</p>
                    <div className="flex items-center gap-2">
                      {selectedFormat === "json" ? (
                        <>
                          <FileJson className="h-5 w-5 text-primary" />
                          <span className="font-medium">JSON</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-5 w-5 text-secondary" />
                          <span className="font-medium">CSV</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button onClick={handleExport} disabled={isExporting || (selectedType === "allData" && selectedFormat === "csv")} className="w-full" size="lg">
                      {isExporting ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          جاري التصدير...
                        </>
                      ) : (
                        <>
                          <Download className="ml-2 h-5 w-5" />
                          تصدير البيانات
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="public-surface-card">
                <CardHeader>
                  <CardTitle className="text-base">نصائح</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• احفظ نسخة احتياطية من بياناتك بشكل دوري.</p>
                  <p>• استخدم JSON للأرشفة طويلة الأمد.</p>
                  <p>• استخدم CSV للتحليل السريع في Excel.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
