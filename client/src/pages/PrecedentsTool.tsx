import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Save, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";
import { toast } from "sonner";

const SAMPLE_CASE = `نزاع وقفي يتعلق بعقار مؤجر بعقد طويل الأمد، مع ادعاء بوقوع تصرفات مخالفة لشروط الوقف، ورغبة الإدارة في الاستناد إلى السوابق القضائية الأقرب.`;

function inferDraftTitle(text: string) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? `تحليل سوابق — ${firstLine.slice(0, 80)}` : "تحليل سوابق جديد";
}

export default function PrecedentsTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [caseDescription, setCaseDescription] = useState("");
  const [result, setResult] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const analyzeMutation = trpc.legalAnalysis.analyzePrecedents.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setDraftTitle(inferDraftTitle(caseDescription));
      toast.success("تم تحليل السوابق بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const saveMutation = trpc.aiTools.saveAsKnowledgeDraft.useMutation({
    onSuccess: () => toast.success("تم حفظ نتيجة تحليل السوابق كوثيقة معرفة للمراجعة"),
    onError: (error: any) => toast.error("تعذر حفظ نتيجة تحليل السوابق: " + error.message),
  });

  const canSave = useMemo(() => !!result && caseDescription.trim().length > 0, [result, caseDescription]);

  if (loading || !user || !hasAdminToolsAccess(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">تحليل السوابق القضائية</h1>
              <p className="mt-1 text-muted-foreground">أدخل وصف القضية لتحليل السوابق الأقرب والاتجاهات والتوصيات.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsRuns)}>سجل التشغيل</Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>العودة</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>وصف القضية أو النزاع</CardTitle>
            <CardDescription>كلما كان الوصف أوضح، كانت المخرجات أكثر فائدة للاختبار العملي.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCaseDescription(SAMPLE_CASE)}>
                تعبئة مثال
              </Button>
            </div>
            <Textarea
              placeholder="اكتب وصف القضية أو النزاع أو السؤال القانوني المراد تحليل سوابقه"
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={10}
              className="text-right leading-7"
            />
            <Button onClick={() => analyzeMutation.mutate({ caseDescription })} disabled={analyzeMutation.isPending || !caseDescription.trim()} className="w-full rounded-2xl">
              {analyzeMutation.isPending ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التحليل...</>
              ) : (
                <><Sparkles className="ml-2 h-4 w-4" />تحليل السوابق</>
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
                <CardTitle>نتيجة التحليل</CardTitle>
                <CardDescription>السوابق ذات الصلة والاتجاهات القضائية والتوصيات المقترحة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.precedents?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">السوابق ذات الصلة ({result.precedents.length})</h3>
                    <div className="space-y-3">
                      {result.precedents.map((prec: any, i: number) => (
                        <div key={i} className="rounded-2xl border border-border bg-accent/40 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="font-semibold">{prec.title}</p>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">انطباق: {(prec.similarity * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-sm leading-7 text-muted-foreground">{prec.summary}</p>
                          {prec.principle ? <p className="mt-2 text-sm"><strong>المبدأ:</strong> {prec.principle}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.patterns?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">الاتجاهات والأنماط</h3>
                    <div className="space-y-2">
                      {result.patterns.map((pattern: string, i: number) => (
                        <div key={i} className="rounded-xl bg-sky-50 p-3 text-sm leading-7 text-sky-900">{pattern}</div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">التوصيات</h3>
                    <div className="space-y-2">
                      {result.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="rounded-xl bg-emerald-50 p-3 text-sm leading-7 text-emerald-900">{rec}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ربط نتيجة التحليل بمسار المعرفة</CardTitle>
                <CardDescription>سيُحفظ تحليل السوابق كوثيقة معرفة بحالة للمراجعة فقط حتى يقرره المراجع المختص.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="draftTitle">عنوان الوثيقة المقترح</Label>
                  <Input id="draftTitle" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                </div>
                <Button
                  onClick={() => saveMutation.mutate({ tool: "precedents", text: caseDescription, title: draftTitle, result, category: "law", toolRunId: result?.toolRunId })}
                  disabled={!canSave || saveMutation.isPending}
                  className="w-full"
                >
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
