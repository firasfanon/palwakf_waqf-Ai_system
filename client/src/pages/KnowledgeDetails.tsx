import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, ExternalLink, Calendar, Tag, BookOpen, Bot } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import DocumentFilesManager from "@/components/DocumentFilesManager";
import { useAuth } from "@/_core/hooks/useAuth";
import CommentsSection from "@/components/CommentsSection";
import RatingStars from "@/components/RatingStars";

export default function KnowledgeDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = params.id || "0";
  const numericEntityId = Number(id);
  const isNumericEntityId = Number.isFinite(numericEntityId) && numericEntityId > 0;
  const { user } = useAuth();

  const { data: document, isLoading } = trpc.knowledge.getById.useQuery({ id } as any);
  const { data: reviewTrace } = trpc.knowledge.reviewTrace.useQuery(
    { id } as any,
    { enabled: !!id && user?.role === "admin" },
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 admin-page-cleanup" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-1/3 cleanup-surface-muted"></div>
          <div className="h-64 rounded cleanup-surface-muted"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-8 admin-page-cleanup" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>المرجع غير موجود</CardTitle>
            <CardDescription>لم يتم العثور على المرجع المطلوب</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/knowledge-base")}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى قاعدة المعرفة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    law: "قانوني",
    jurisprudence: "فقهي",
    majalla: "مجلة الأحكام",
    historical: "تاريخي",
    administrative: "إداري",
    reference: "مرجع",
  };

  const statusLabel = document.status === "approved"
    ? "معتمد"
    : document.status === "rejected"
      ? "مرفوض"
      : document.status === "review_only"
        ? "للمراجعة"
        : "مسودة";

  const statusVariant = document.status === "approved"
    ? "default"
    : document.status === "rejected"
      ? "destructive"
      : document.status === "review_only"
        ? "secondary"
        : "outline";

  return (
    <div className="min-h-screen bg-background admin-page-cleanup">
      <div className="container mx-auto py-8 px-4" dir="rtl">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: "/" },
            { label: "قاعدة المعرفة", href: "/knowledge-base" },
            { label: document.title },
          ]}
        />

        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle className="text-3xl">{document.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(document.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                    <Badge variant="secondary">{categoryLabels[document.category] || document.category}</Badge>
                    <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setLocation("/knowledge-base")}>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المحتوى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{document.content}</p>
              </div>
            </CardContent>
          </Card>

          {document.pdfUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  معاينة ملف PDF
                </CardTitle>
                <CardDescription>
                  يمكنك معاينة الملف مباشرة أو تحميله من الزر أدناه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <a href={document.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="ml-2 h-4 w-4" />
                      فتح في نافذة جديدة
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={document.pdfUrl} download>
                      <FileText className="ml-2 h-4 w-4" />
                      تحميل الملف
                    </a>
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden cleanup-file-preview">
                  <iframe src={document.pdfUrl} className="w-full h-[800px]" title="معاينة PDF" />
                </div>
              </CardContent>
            </Card>
          )}

          {(document as any).toolOrigin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  منشأ الوثيقة الذكي
                </CardTitle>
                <CardDescription>
                  هذه الوثيقة أُنشئت من أداة ذكية وتمت إحالتها إلى مسار المراجعة قبل الاستخدام في الشات.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="font-semibold">الأداة:</span> {(document as any).toolOrigin}</div>
                {(document as any).sourceText && (
                  <div>
                    <div className="font-semibold mb-1">النص الأصلي</div>
                    <div className="rounded-md cleanup-surface-muted p-3 whitespace-pre-wrap line-clamp-6">{(document as any).sourceText}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DocumentFilesManager documentId={id} isAdmin={user?.role === "admin"} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                معلومات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.source && (
                <div>
                  <h3 className="font-semibold mb-1">المصدر</h3>
                  <p className="text-muted-foreground">{document.source}</p>
                </div>
              )}

              {document.sourceUrl && (
                <div>
                  <h3 className="font-semibold mb-1">رابط المصدر</h3>
                  <a
                    href={document.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {document.sourceUrl}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {document.tags && (
                <div>
                  <h3 className="font-semibold mb-2">الكلمات المفتاحية</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.split(",").map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">الفئة</h3>
                  <Badge>{categoryLabels[document.category] || document.category}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">تاريخ الإضافة</h3>
                  <p className="text-muted-foreground">
                    {new Date(document.createdAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">نسخة الاعتماد</h3>
                  <p className="text-muted-foreground">{document.approvalVersion ?? 0}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">آخر مراجعة</h3>
                  <p className="text-muted-foreground">{document.reviewedAt ? new Date(document.reviewedAt).toLocaleDateString("ar-EG") : "غير متوفر"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.role === "admin" && Array.isArray(reviewTrace) && reviewTrace.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>أثر المراجعة والاعتماد</CardTitle>
                <CardDescription>سجل مختصر لقرارات المراجعة المرتبطة بهذه الوثيقة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviewTrace.map((event: any, index: number) => (
                  <div key={index} className="rounded-lg border p-3 bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{event.status || event.decision || event.eventType}</div>
                      <div className="text-xs text-muted-foreground">{event.at ? new Date(event.at).toLocaleString("ar-EG") : "-"}</div>
                    </div>
                    {event.notes && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{event.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {isNumericEntityId && (
            <Card>
              <CardHeader>
                <CardTitle>تقييم المرجع</CardTitle>
                <CardDescription>ساعدنا في تحسين المحتوى بتقييمك</CardDescription>
              </CardHeader>
              <CardContent>
                <RatingStars entityType="knowledge" entityId={numericEntityId} />
              </CardContent>
            </Card>
          )}

          {isNumericEntityId && <CommentsSection entityType="knowledge" entityId={numericEntityId} />}
        </div>
      </div>
    </div>
  );
}
