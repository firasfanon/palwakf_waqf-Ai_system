import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Save, Scale, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";
import { toast } from "sonner";

const SAMPLE_RULING_1 = `حكم يتعلق بنزاع على أصل وقفي مؤجر، تمسك فيه الناظر بعدم جواز التصرف المخالف لشروط الوقف، وطلب استرداد المنفعة وإعادة الحال إلى ما كان عليه.`;
const SAMPLE_RULING_2 = `حكم في نزاع وقفي مشابه ناقش صلاحيات الناظر، ومدى حجية مستندات الوقف، وأثر مخالفة شروط الواقف على صحة التصرف والإشغال.`;

function inferDraftTitle(text: string) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? `مقارنة أحكام — ${firstLine.slice(0, 80)}` : "مقارنة أحكام جديدة";
}

export default function CompareTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [ruling1, setRuling1] = useState("");
  const [ruling2, setRuling2] = useState("");
  const [result, setResult] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const compareMutation = trpc.legalAnalysis.compareRulings.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setDraftTitle(inferDraftTitle([ruling1, ruling2].filter(Boolean).join("\n")));
      toast.success("تمت المقارنة بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const saveMutation = trpc.aiTools.saveAsKnowledgeDraft.useMutation({
    onSuccess: () => toast.success("تم حفظ نتيجة المقارنة كوثيقة معرفة للمراجعة"),
    onError: (error: any) => toast.error("تعذر حفظ نتيجة المقارنة: " + error.message),
  });

  const canSave = useMemo(() => !!result && (ruling1.trim().length > 0 || ruling2.trim().length > 0), [result, ruling1, ruling2]);

  if (loading || !user || !hasAdminToolsAccess(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة</Button>
      </div>
    );
  }

  const handleCompare = () => {
    if (!ruling1.trim() || !ruling2.trim()) {
      toast.error("أدخل الحكمين أو رقمَي الحكمين قبل المقارنة");
      return;
    }
    compareMutation.mutate({ ruling1, ruling2 });
  };

  const handleSave = () => {
    if (!result) return;
    saveMutation.mutate({
      tool: "compare",
      text: [ruling1, ruling2].filter(Boolean).join("\n\n---\n\n"),
      title: draftTitle,
      result,
      category: "law",
      toolRunId: result?.toolRunId,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">مقارنة الأحكام</h1>
              <p className="mt-1 text-muted-foreground">
                أدخل نص حكمين كاملين أو رقمَي حكمين موجودين في قاعدة البيانات للمقارنة بينهما.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminToolsRuns)}>سجل التشغيل</Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>العودة</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>مدخلات المقارنة</CardTitle>
            <CardDescription>
              يمكنك لصق النص مباشرة، أو إدخال رقم حكم فقط إذا كان محفوظًا في قاعدة البيانات.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">الحكم الأول</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRuling1(SAMPLE_RULING_1)}>
                    تعبئة مثال
                  </Button>
                </div>
                <Textarea placeholder="ألصق نص الحكم الأول هنا أو أدخل رقم الحكم" value={ruling1} onChange={(e) => setRuling1(e.target.value)} rows={9} className="text-right leading-7" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">الحكم الثاني</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRuling2(SAMPLE_RULING_2)}>
                    تعبئة مثال
                  </Button>
                </div>
                <Textarea placeholder="ألصق نص الحكم الثاني هنا أو أدخل رقم الحكم" value={ruling2} onChange={(e) => setRuling2(e.target.value)} rows={9} className="text-right leading-7" />
              </div>
            </div>
            <Button onClick={handleCompare} disabled={compareMutation.isPending} className="w-full rounded-2xl">
              {compareMutation.isPending ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري المقارنة...</>
              ) : (
                <><Sparkles className="ml-2 h-4 w-4" />مقارنة الأحكام</>
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
                <CardTitle>نتيجة المقارنة</CardTitle>
                <CardDescription>تمت قراءة الحكمين وتحليل أوجه التشابه والاختلاف بينهما.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-accent/50 p-4">
                    <h3 className="mb-3 font-semibold">الحكم الأول</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>المرجع:</strong> {result.ruling1?.caseNumber}</p>
                      <p><strong>الجهة:</strong> {result.ruling1?.court}</p>
                      <p><strong>التاريخ:</strong> {result.ruling1?.date}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-accent/50 p-4">
                    <h3 className="mb-3 font-semibold">الحكم الثاني</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>المرجع:</strong> {result.ruling2?.caseNumber}</p>
                      <p><strong>الجهة:</strong> {result.ruling2?.court}</p>
                      <p><strong>التاريخ:</strong> {result.ruling2?.date}</p>
                    </div>
                  </div>
                </div>

                {result.similarities?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">أوجه التشابه</h3>
                    <div className="space-y-2">
                      {result.similarities.map((sim: string, i: number) => (
                        <div key={i} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-7 text-emerald-900">{sim}</div>
                      ))}
                    </div>
                  </div>
                )}

                {result.differences?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">أوجه الاختلاف</h3>
                    <div className="space-y-2">
                      {result.differences.map((diff: string, i: number) => (
                        <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-900">{diff}</div>
                      ))}
                    </div>
                  </div>
                )}

                {result.conclusion ? (
                  <div className="rounded-2xl bg-muted p-4">
                    <h3 className="mb-2 font-semibold">الخلاصة</h3>
                    <p className="text-sm leading-7">{result.conclusion}</p>
                  </div>
                ) : null}

                {result.recommendations?.length > 0 && (
                  <div className="rounded-2xl bg-primary/5 p-4">
                    <h3 className="mb-2 font-semibold">التوصية</h3>
                    <ul className="space-y-2 text-sm leading-7">
                      {result.recommendations.map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ربط نتيجة المقارنة بمسار المعرفة</CardTitle>
                <CardDescription>سيُحفظ التحليل كوثيقة معرفة بحالة للمراجعة فقط حتى يُعتمد لاحقًا.</CardDescription>
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
