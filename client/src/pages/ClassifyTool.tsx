import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowRight, FileText, Loader2, Save, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";
import { toast } from "sonner";

function inferDraftTitle(text: string) {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ? `تصنيف ذكي — ${firstLine.slice(0, 80)}` : "تصنيف ذكي جديد";
}

export default function ClassifyTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const classifyMutation = trpc.aiTools.classify.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setDraftTitle(inferDraftTitle(text));
      toast.success("تم التصنيف بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ أثناء التصنيف: " + error.message);
    },
  });

  const saveMutation = trpc.aiTools.saveAsKnowledgeDraft.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الناتج كوثيقة معرفة للمراجعة");
    },
    onError: (error: any) => {
      toast.error("تعذر حفظ الناتج في مسار المعرفة: " + error.message);
    },
  });

  const canSave = useMemo(() => !!result && text.trim().length > 0, [result, text]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAdminToolsAccess(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة للصفحة الرئيسية</Button>
      </div>
    );
  }

  const handleClassify = () => {
    if (!text.trim()) {
      toast.error("الرجاء إدخال نص للتصنيف");
      return;
    }
    classifyMutation.mutate({ text, type: "document" });
  };

  const handleSave = () => {
    if (!result) return;
    saveMutation.mutate({
      tool: "classify",
      text,
      title: draftTitle,
      result,
      category: result.category,
      toolRunId: result?.toolRunId,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">التصنيف التلقائي</h1>
              <p className="text-muted-foreground mt-1">
                تصنيف الوثائق والنصوص تلقائيًا وربط الناتج بمسار المعرفة
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>
            العودة للأدوات
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل النص المراد تصنيفه</CardTitle>
            <CardDescription>
              يمكنك إدخال نص من وثيقة، حكم قضائي، تعليمات وزارية، أو أي نص قانوني آخر.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="مثال: حكم قضائي صادر عن المحكمة الشرعية في القدس..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="resize-none"
            />
            <Button
              onClick={handleClassify}
              disabled={classifyMutation.isPending}
              className="w-full"
            >
              {classifyMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التصنيف...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  تصنيف النص
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {result.toolRunId ? (
              <Card className="border-emerald-200 bg-emerald-50/70">
                <CardContent className="flex flex-col gap-3 pt-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-900">تم حفظ التشغيل سياديًا</p>
                    <p className="text-xs text-emerald-800">معرف التشغيل: {result.toolRunId}</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsRuns)} className="border-emerald-300 text-emerald-900">
                    فتح سجل التشغيل والاعتماد
                  </Button>
                </CardContent>
              </Card>
            ) : null}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  نتيجة التصنيف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الوثيقة</label>
                    <div className="p-3 bg-accent rounded-lg">
                      <p className="font-semibold text-lg">{result.documentType}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الفئة</label>
                    <div className="p-3 bg-accent rounded-lg">
                      <p className="font-semibold text-lg">{result.category}</p>
                    </div>
                  </div>
                </div>

                {result.subcategory && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الفئة الفرعية</label>
                    <div className="p-3 bg-accent rounded-lg">
                      <p className="font-semibold">{result.subcategory}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">درجة الثقة</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-accent rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {result.tags && result.tags.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الكلمات المفتاحية</label>
                    <div className="flex flex-wrap gap-2">
                      {result.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.reasoning && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">التفسير</label>
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-sm leading-relaxed">{result.reasoning}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ربط الناتج بمسار المعرفة</CardTitle>
                <CardDescription>
                  سيُحفظ هذا الناتج كوثيقة معرفة بحالة <strong>للمراجعة فقط</strong> ولن يستهلكه الشات حتى اعتماده.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="draftTitle">عنوان الوثيقة المقترح</Label>
                  <Input id="draftTitle" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                </div>
                <Button onClick={handleSave} disabled={!canSave || saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ في مسار المعرفة...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ كوثيقة معرفة للمراجعة
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle>أمثلة على التصنيف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <p><strong>حكم قضائي:</strong> يتم تصنيفه حسب المحكمة، نوع القضية، والموضوع.</p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <p><strong>تعليمات وزارية:</strong> يتم تصنيفها حسب الجهة المصدرة والموضوع.</p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <p><strong>الربط مع المعرفة:</strong> يمكن حفظ النتيجة مباشرة كمادة للمراجعة والاعتماد.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
