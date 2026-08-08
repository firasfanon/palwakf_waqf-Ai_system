import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Save, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";
import { toast } from "sonner";

const SAMPLE_CASE = `دعوى تتعلق بأصل وقفي مؤجر بعقد طويل، مع وجود نزاع حول شروط الوقف وصلاحية الناظر في طلب الفسخ أو الاسترداد، ويريد المستخدم تقدير فرص نجاح جهة الوقف.`;

function inferDraftTitle(text: string) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? `توقع نتائج — ${firstLine.slice(0, 80)}` : "توقع نتائج جديد";
}

export default function PredictTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [caseDescription, setCaseDescription] = useState("");
  const [result, setResult] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const predictMutation = trpc.legalAnalysis.predictOutcome.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setDraftTitle(inferDraftTitle(caseDescription));
      toast.success("تم التوقع بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const saveMutation = trpc.aiTools.saveAsKnowledgeDraft.useMutation({
    onSuccess: () => toast.success("تم حفظ نتيجة التوقع كوثيقة معرفة للمراجعة"),
    onError: (error: any) => toast.error("تعذر حفظ نتيجة التوقع: " + error.message),
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
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">توقع نتائج القضايا</h1>
              <p className="mt-1 text-muted-foreground">اختبر النموذج على وصف قضية حقيقي أو تجريبي للحصول على تقدير مبدئي.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsRuns)}>سجل التشغيل</Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>العودة</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>وصف القضية</CardTitle>
            <CardDescription>أدخل وصفًا كافيًا للقضية، وسيتم تحليل الاحتمالات والعوامل المؤثرة والتوصيات.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCaseDescription(SAMPLE_CASE)}>
                تعبئة مثال
              </Button>
            </div>
            <Textarea
              placeholder="اكتب وصفًا تفصيليًا للقضية أو النزاع"
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={10}
              className="text-right leading-7"
            />
            <Button onClick={() => predictMutation.mutate({ caseDescription, party: "plaintiff" })} disabled={predictMutation.isPending || !caseDescription.trim()} className="w-full rounded-2xl">
              {predictMutation.isPending ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التوقع...</>
              ) : (
                <><Sparkles className="ml-2 h-4 w-4" />توقع النتيجة</>
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
                <CardTitle>التوقع</CardTitle>
                <CardDescription>قراءة أولية مدعومة بتقدير الثقة والعوامل المؤثرة والفرص والمخاطر.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl bg-primary/5 p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold">النتيجة المتوقعة</h3>
                    <span className="text-3xl font-bold text-primary">{(result.probability * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-base leading-8">{result.prediction}</p>
                </div>

                {result.factors?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">العوامل المؤثرة</h3>
                    <div className="space-y-3">
                      {result.factors.map((factor: any, i: number) => (
                        <div key={i} className="rounded-2xl bg-accent/50 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="font-medium">{factor.name}</span>
                            <span className="text-sm text-muted-foreground">تأثير: {(factor.weight * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, factor.weight * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.similarCases?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">سوابق أو شواهد داعمة</h3>
                    <div className="space-y-2">
                      {result.similarCases.map((case_: any, i: number) => (
                        <div key={i} className="rounded-xl bg-sky-50 p-3 text-sm leading-7 text-sky-900">
                          <strong>{case_.title}:</strong> {case_.outcome}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations ? (
                  <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                    <h3 className="mb-2 font-semibold">التوصيات</h3>
                    <p className="text-sm leading-7 whitespace-pre-line">{result.recommendations}</p>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                  <strong>تنويه:</strong> هذا التوقع تحليلي استرشادي، وليس بديلاً عن التقدير القانوني المهني أو القرار القضائي.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ربط نتيجة التوقع بمسار المعرفة</CardTitle>
                <CardDescription>سيُحفظ التوقع كوثيقة معرفة للمراجعة الداخلية قبل أي اعتماد أو استخدام مرجعي.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="draftTitle">عنوان الوثيقة المقترح</Label>
                  <Input id="draftTitle" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                </div>
                <Button
                  onClick={() => saveMutation.mutate({ tool: "predict", text: caseDescription, title: draftTitle, result, category: "law", toolRunId: result?.toolRunId })}
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
