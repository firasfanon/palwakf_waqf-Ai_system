import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, Code, Image, Search, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const AVAILABLE_PAGES = [
  { value: "home", label: "الصفحة الرئيسية" },
  { value: "about", label: "من نحن" },
  { value: "services", label: "خدماتنا" },
  { value: "waqf-references", label: "مراجع الأوقاف" },
  { value: "knowledge-base", label: "قاعدة المعرفة" },
  { value: "contact", label: "اتصل بنا" },
  { value: "blog", label: "المدونة" },
];

export default function PageSettings() {
  const [selectedPage, setSelectedPage] = useState<string>("home");
  
  const { data: pageSettings, isLoading, refetch } = trpc.pageSettings.get.useQuery(
    { pageName: selectedPage },
    { enabled: !!selectedPage }
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    metaKeywords: "",
    ogImage: "",
    customCss: "",
    customJs: "",
    isActive: 1,
  });

  // Update form when data loads
  useState(() => {
    if (pageSettings) {
      setFormData({
        title: pageSettings.title || "",
        description: pageSettings.description || "",
        metaKeywords: pageSettings.metaKeywords || "",
        ogImage: pageSettings.ogImage || "",
        customCss: pageSettings.customCss || "",
        customJs: pageSettings.customJs || "",
        isActive: pageSettings.isActive ?? 1,
      });
    }
  });

  const updateMutation = trpc.pageSettings.update.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الصفحة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      pageName: selectedPage,
      ...formData,
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات الصفحات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة إعدادات SEO والميتا تاجز لكل صفحة
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اختر الصفحة
          </CardTitle>
          <CardDescription>
            اختر الصفحة التي تريد تعديل إعداداتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر صفحة" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_PAGES.map((page) => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="seo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="seo">
              <Search className="h-4 w-4 ml-2" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="meta">
              <FileText className="h-4 w-4 ml-2" />
              Meta Tags
            </TabsTrigger>
            <TabsTrigger value="custom-css">
              <Code className="h-4 w-4 ml-2" />
              CSS مخصص
            </TabsTrigger>
            <TabsTrigger value="custom-js">
              <Code className="h-4 w-4 ml-2" />
              JS مخصص
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات SEO</CardTitle>
                <CardDescription>
                  قم بتحسين ظهور الصفحة في محركات البحث
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الصفحة (Title)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="عنوان الصفحة للظهور في محركات البحث"
                  />
                  <p className="text-xs text-muted-foreground">
                    يُنصح بـ 50-60 حرف
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (Description)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="وصف مختصر للصفحة"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    يُنصح بـ 150-160 حرف
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">الكلمات المفتاحية (Keywords)</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
                    placeholder="أوقاف، فلسطين، إسلامي (مفصولة بفواصل)"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">تفعيل الصفحة</Label>
                    <p className="text-xs text-muted-foreground">
                      إظهار/إخفاء الصفحة من الموقع
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive === 1}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked ? 1 : 0)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meta">
            <Card>
              <CardHeader>
                <CardTitle>Meta Tags للشبكات الاجتماعية</CardTitle>
                <CardDescription>
                  تحسين ظهور الصفحة عند المشاركة على وسائل التواصل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ogImage">صورة Open Graph (OG Image)</Label>
                  <Input
                    id="ogImage"
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => handleInputChange("ogImage", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    الصورة التي تظهر عند مشاركة الصفحة (1200x630 بكسل)
                  </p>
                </div>

                {formData.ogImage && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">معاينة الصورة:</p>
                    <img
                      src={formData.ogImage}
                      alt="OG Image Preview"
                      className="w-full max-w-md rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom-css">
            <Card>
              <CardHeader>
                <CardTitle>CSS مخصص</CardTitle>
                <CardDescription>
                  أضف أنماط CSS خاصة بهذه الصفحة فقط
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.customCss}
                  onChange={(e) => handleInputChange("customCss", e.target.value)}
                  placeholder=".custom-class { color: red; }"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  سيتم تطبيق هذه الأنماط على هذه الصفحة فقط
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom-js">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript مخصص</CardTitle>
                <CardDescription>
                  أضف سكريبتات JS خاصة بهذه الصفحة فقط
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.customJs}
                  onChange={(e) => handleInputChange("customJs", e.target.value)}
                  placeholder="console.log('Custom JS');"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  سيتم تنفيذ هذه السكريبتات على هذه الصفحة فقط
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
          >
            إعادة تحميل
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary">
                <Eye className="h-4 w-4 ml-2" />
                معاينة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>معاينة الصفحة: {AVAILABLE_PAGES.find(p => p.value === selectedPage)?.label}</DialogTitle>
                <DialogDescription>
                  معاينة مباشرة للتغييرات قبل الحفظ
                </DialogDescription>
              </DialogHeader>
              
              <div className="border rounded-lg p-6 bg-background">
                {/* Preview Content */}
                <div className="space-y-4">
                  {/* Title Preview */}
                  {formData.title && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Title (SEO):</p>
                      <h1 className="text-2xl font-bold">{formData.title}</h1>
                    </div>
                  )}
                  
                  {/* Description Preview */}
                  {formData.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description:</p>
                      <p className="text-muted-foreground">{formData.description}</p>
                    </div>
                  )}
                  
                  {/* Keywords Preview */}
                  {formData.metaKeywords && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.metaKeywords.split(',').map((keyword, idx) => (
                          <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* OG Image Preview */}
                  {formData.ogImage && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Open Graph Image:</p>
                      <img src={formData.ogImage} alt="OG Preview" className="w-full max-w-md rounded-lg border" />
                    </div>
                  )}
                  
                  {/* Custom CSS Preview */}
                  {formData.customCss && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Custom CSS Applied:</p>
                      <div className="bg-muted p-4 rounded-lg">
                        <style dangerouslySetInnerHTML={{ __html: formData.customCss }} />
                        <p className="text-sm">هذا مثال للمحتوى مع تطبيق CSS المخصص</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">حالة الصفحة:</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      formData.isActive === 1 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {formData.isActive === 1 ? 'نشطة' : 'غير نشطة'}
                    </span>
                  </div>
                </div>
              </div>
              
              {formData.customJs && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>ملاحظة:</strong> Custom JavaScript لن يتم تنفيذه في المعاينة لأسباب أمنية. سيتم تطبيقه على الصفحة الفعلية بعد الحفظ.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
