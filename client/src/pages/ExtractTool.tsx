import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Save, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { APP_ROUTES } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";

function inferDraftTitle(text: string) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? `استخراج ذكي — ${firstLine.slice(0, 80)}` : "استخراج ذكي جديد";
}

export default function ExtractTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const extractMutation = trpc.aiTools.extract.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setDraftTitle(inferDraftTitle(text));
      toast.success("تم استخراج المعلومات بنجاح");
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
      tool: "extract",
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
            <Search className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">استخراج المعلومات</h1>
              <p className="text-muted-foreground mt-1">استخراج الكيانات والمعلومات القانونية وربط الناتج بمسار المعرفة.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>العودة</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل النص</CardTitle>
            <CardDescription>سيتم استخراج الأسماء، التواريخ، الأماكن، المبالغ، والمعلومات القانونية.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="مثال: حكم صادر بتاريخ 15/3/2023 من المحكمة الشرعية في القدس..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
            />
            <Button onClick={() => extractMutation.mutate({ text })} disabled={extractMutation.isPending} className="w-full">
              {extractMutation.isPending ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري الاستخراج...</>
              ) : (
                <><Sparkles className="ml-2 h-4 w-4" />استخراج المعلومات</>
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
                <CardTitle>المعلومات المستخرجة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {result.keyPoints?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">النقاط الرئيسية</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.keyPoints.map((point: string, i: number) => <li key={i}>{point}</li>)}
                    </ul>
                  </div>
                )}

                {Object.entries(result.entities || {}).map(([section, values]: any) => (
                  Array.isArray(values) && values.length > 0 ? (
                    <div key={section}>
                      <h3 className="font-semibold mb-2">{section}</h3>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{value}</span>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}

                {result.legalTopics?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">المواضيع القانونية</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.legalTopics.map((topic: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.citations?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">الإحالات/الهوامش المستخرجة</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.citations.map((citation: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">{citation}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ربط الناتج بمسار المعرفة</CardTitle>
                <CardDescription>سيُحفظ ناتج الاستخراج كمادة معرفة بحالة <strong>للمراجعة فقط</strong>.</CardDescription>
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
