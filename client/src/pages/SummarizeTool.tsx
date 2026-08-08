import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, FileSearch, Loader2, Save, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";
import { toast } from "sonner";

function inferDraftTitle(text: string) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? `تلخيص ذكي — ${firstLine.slice(0, 80)}` : "تلخيص ذكي جديد";
}

export default function SummarizeTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const summarizeMutation = trpc.aiTools.summarize.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setDraftTitle(inferDraftTitle(text));
      toast.success("تم التلخيص بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const saveMutation = trpc.aiTools.saveAsKnowledgeDraft.useMutation({
    onSuccess: () => toast.success("تم حفظ الناتج كوثيقة معرفة للمراجعة"),
    onError: (error: any) => toast.error("تعذر حفظ الناتج في مسار المعرفة: " + error.message),
  });

  const canSave = useMemo(() => !!result && text.trim().length > 0, [result, text]);

  if (loading || !user || !hasAdminToolsAccess(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة</Button>
      </div>
    );
  }

  const handleSave = () => {
    if (!result) return;
    saveMutation.mutate({
      tool: "summarize",
      text,
      title: draftTitle,
      result,
      category: "reference",
      toolRunId: result?.toolRunId,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSearch className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">التلخيص الذكي</h1>
              <p className="text-muted-foreground mt-1">تلخيص النصوص الطويلة وربط الملخص بمسار المعرفة.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>العودة</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل النص المراد تلخيصه</CardTitle>
            <CardDescription>يمكن تلخيص الأحكام القضائية، الوثائق القانونية، أو أي نص طويل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="الصق النص الطويل هنا..." value={text} onChange={(e) => setText(e.target.value)} rows={15} />
            <Button onClick={() => summarizeMutation.mutate({ text })} disabled={summarizeMutation.isPending} className="w-full">
              {summarizeMutation.isPending ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التلخيص...</>
              ) : (
                <><Sparkles className="ml-2 h-4 w-4" />تلخيص النص</>
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
                <CardTitle>الملخص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-accent rounded-lg">
                  <p className="leading-relaxed whitespace-pre-wrap">{result.summary}</p>
                </div>

                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">النقاط الرئيسية</h3>
                    <ul className="space-y-2">
                      {result.keyPoints.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold mb-2">الخلاصة / التوصيات</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {result.recommendations.map((rec: string, i: number) => <li key={i} className="leading-relaxed">{rec}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ربط الناتج بمسار المعرفة</CardTitle>
                <CardDescription>سيُحفظ الملخص كوثيقة معرفة بحالة <strong>للمراجعة فقط</strong>.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="draftTitle">عنوان الوثيقة المقترح</Label>
                  <Input id="draftTitle" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                </div>
                <Button onClick={handleSave} disabled={!canSave || saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? (
                    <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري الحفظ في مسار المعرفة...</>
                  ) : (
                    <><Save className="ml-2 h-4 w-4" />حفظ كوثيقة معرفة للمراجعة</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
