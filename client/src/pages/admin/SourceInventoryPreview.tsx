import { type ChangeEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileUp,
  RefreshCcw,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RIGHTS_CLASSES = [
  "PUBLIC_DOMAIN",
  "OPEN_LICENSE",
  "OFFICIAL_PUBLIC_DOCUMENT",
  "COPYRIGHTED_WITH_LIMITED_QUOTATION",
  "COPYRIGHTED_PERMISSION_REQUIRED",
  "REUSE_RESTRICTED",
  "RIGHTS_UNCLEAR",
  "UNKNOWN",
] as const;

const RISK_CLASSES = ["LOW", "MEDIUM", "HIGH", "BLOCKED"] as const;

const REQUIRED_MARKERS = [
  { key: "source", label: "بيانات المصدر", markers: ["source", "المصدر", "title", "العنوان"] },
  { key: "url", label: "الرابط أو الملف", markers: ["url", "الرابط", "local filename", "اسم الملف"] },
  { key: "usage", label: "أثر الاستخدام", markers: ["usage", "الاستخدام", "project usage", "استُخدم"] },
  { key: "rights", label: "حقوق النشر والترخيص", markers: ["rights", "copyright", "license", "حقوق", "ترخيص"] },
  { key: "evidence", label: "دليل الحقوق أو حالة التحقق", markers: ["evidence", "دليل", "not_verified", "غير متحقق"] },
] as const;

const MAX_LOCAL_FILE_BYTES = 5 * 1024 * 1024;

function countToken(content: string, token: string) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${escaped}(?=$|[^A-Za-z0-9_])`, "gim");
  return (content.match(pattern) || []).length;
}

function uniqueUrls(content: string) {
  return Array.from(
    new Set(
      (content.match(/https?:\/\/[^\s<>()\[\]"']+/gi) || []).map((url) =>
        url.replace(/[.,;:!?،؛]+$/g, ""),
      ),
    ),
  );
}

function getHeadings(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, ""));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} ميغابايت`;
}

export default function SourceInventoryPreview() {
  const [fileName, setFileName] = useState("");
  const [fileBytes, setFileBytes] = useState(0);
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const analysis = useMemo(() => {
    const normalized = content.toLowerCase();
    const lines = content.split(/\r?\n/);
    const urls = uniqueUrls(content);
    const headings = getHeadings(content);
    const rights = RIGHTS_CLASSES.map((classification) => ({
      classification,
      count: countToken(content, classification),
    }));
    const risks = RISK_CLASSES.map((classification) => ({
      classification,
      count: countToken(content, classification),
    }));
    const required = REQUIRED_MARKERS.map((item) => ({
      ...item,
      present: item.markers.some((marker) => normalized.includes(marker.toLowerCase())),
    }));
    const notVerified =
      countToken(content, "NOT_VERIFIED") +
      countToken(content, "غير متحقق") +
      countToken(content, "غير موثق");
    const blocked = risks.find((item) => item.classification === "BLOCKED")?.count || 0;
    const highRisk = risks.find((item) => item.classification === "HIGH")?.count || 0;
    const activeRightsClasses = rights.filter((item) => item.count > 0).length;

    return {
      lines,
      urls,
      headings,
      rights,
      risks,
      required,
      notVerified,
      blocked,
      highRisk,
      activeRightsClasses,
      missingRequired: required.filter((item) => !item.present),
    };
  }, [content]);

  const visibleLines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const entries = analysis.lines.map((line, index) => ({ line, index: index + 1 }));
    if (!normalizedQuery) return entries.slice(0, 120);
    return entries
      .filter((entry) => entry.line.toLowerCase().includes(normalizedQuery))
      .slice(0, 200);
  }, [analysis.lines, query]);

  const reset = () => {
    setFileName("");
    setFileBytes(0);
    setContent("");
    setQuery("");
    setError("");
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".md") && !lowerName.endsWith(".txt")) {
      setError("المعاينة تقبل ملفات Markdown أو Text فقط.");
      return;
    }

    if (file.size > MAX_LOCAL_FILE_BYTES) {
      setError("حجم الملف يتجاوز 5 ميغابايت. قسّم الجرد إلى ملف أصغر للمعاينة.");
      return;
    }

    try {
      const text = await file.text();
      setFileName(file.name);
      setFileBytes(file.size);
      setContent(text);
      setQuery("");
    } catch {
      setError("تعذر قراءة الملف محليًا داخل المتصفح.");
    }
  };

  return (
    <AdminPage className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FileSearch className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">معاينة جرد مصادر Manus وحقوقها</h1>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              فحص محلي مؤقت لملف الجرد قبل أي مطابقة أو استيراد. لا يُرفع الملف إلى الخادم،
              ولا تُنشأ سجلات، ولا تتحول أي نتيجة إلى مصدر معتمد.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">LOCAL_MEMORY_ONLY</Badge>
              <Badge variant="outline">NO_DATABASE_WRITE</Badge>
              <Badge variant="outline">NO_AUTOMATIC_APPROVAL</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label
              htmlFor="source-inventory-preview-file"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
            >
              <FileUp className="ml-2 h-4 w-4" />
              اختيار ملف الجرد
            </label>
            <input
              id="source-inventory-preview-file"
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              className="hidden"
              onChange={handleFile}
            />
            <Button type="button" variant="outline" onClick={reset} disabled={!content && !error}>
              <RefreshCcw className="ml-2 h-4 w-4" />
              مسح المعاينة
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!content ? (
        <AdminCard
          title="لم يُحمّل ملف للمعاينة"
          description="اختر ملف MANUS_COMPLETE_WAQF_RESEARCH_SOURCES_RIGHTS_AND_PROVENANCE_INVENTORY.md أو ملفًا نصيًا مكافئًا."
        >
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <div className="rounded-xl border border-dashed p-4">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              القراءة تتم داخل المتصفح فقط.
            </div>
            <div className="rounded-xl border border-dashed p-4">
              <Scale className="mb-2 h-5 w-5 text-primary" />
              التصنيفات المعروضة ليست حكمًا قانونيًا نهائيًا.
            </div>
            <div className="rounded-xl border border-dashed p-4">
              <AlertTriangle className="mb-2 h-5 w-5 text-amber-600" />
              كل عنصر غير موثق يبقى NOT_VERIFIED.
            </div>
          </div>
        </AdminCard>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminCard title="الملف المحلي" description={fileName}>
              <div className="text-2xl font-bold">{formatBytes(fileBytes)}</div>
              <p className="mt-2 text-sm text-muted-foreground">{analysis.lines.length} سطرًا</p>
            </AdminCard>
            <AdminCard title="روابط مميزة" description="روابط HTTP/HTTPS غير مكررة">
              <div className="text-3xl font-bold">{analysis.urls.length}</div>
              <p className="mt-2 text-sm text-muted-foreground">{analysis.headings.length} عنوانًا بنيويًا</p>
            </AdminCard>
            <AdminCard title="تصنيفات حقوق مستخدمة" description="من قاموس الحقوق المعتمد للمعاينة">
              <div className="text-3xl font-bold">{analysis.activeRightsClasses}</div>
              <p className="mt-2 text-sm text-muted-foreground">{analysis.notVerified} إشارة غير متحققة</p>
            </AdminCard>
            <AdminCard title="مخاطر مرتفعة أو محجوبة" description="ليست قرارًا نهائيًا">
              <div className="text-3xl font-bold">{analysis.highRisk + analysis.blocked}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                HIGH={analysis.highRisk} · BLOCKED={analysis.blocked}
              </p>
            </AdminCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <AdminCard title="اكتمال الحقول الأساسية" description="فحص نصي أولي قبل المطابقة مع السجل الحالي">
              <div className="space-y-3">
                {analysis.required.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border p-3">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.present ? (
                      <Badge variant="default">
                        <CheckCircle2 className="ml-1 h-3.5 w-3.5" />
                        موجود
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="ml-1 h-3.5 w-3.5" />
                        غير ظاهر
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {analysis.missingRequired.length ? (
                <p className="mt-4 text-sm leading-7 text-amber-700">
                  يلزم استكمال: {analysis.missingRequired.map((item) => item.label).join("، ")}.
                </p>
              ) : (
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  ظهرت المؤشرات الأساسية نصيًا، لكن يلزم التحقق البشري من كل سجل ودليل.
                </p>
              )}
            </AdminCard>

            <AdminCard title="توزيع الحقوق والمخاطر" description="عدّ إشارات التصنيف داخل الملف">
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.rights.map((item) => (
                    <div key={item.classification} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                      <code className="break-all">{item.classification}</code>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {analysis.risks.map((item) => (
                    <div key={item.classification} className="rounded-lg border p-3 text-center">
                      <div className="text-lg font-bold">{item.count}</div>
                      <code className="text-xs text-muted-foreground">{item.classification}</code>
                    </div>
                  ))}
                </div>
              </div>
            </AdminCard>
          </section>

          <AdminCard
            title="معاينة النص"
            description="يُعرض أول 120 سطرًا، أو أول 200 نتيجة عند استخدام البحث."
          >
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث عن مصدر، رابط، حالة حقوق أو NOT_VERIFIED"
              />
            </div>
            <div className="max-h-[520px] overflow-auto rounded-xl border bg-muted/20">
              {visibleLines.length ? (
                <div className="divide-y">
                  {visibleLines.map((entry) => (
                    <div key={`${entry.index}-${entry.line}`} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 px-3 py-2 text-xs">
                      <span className="select-none text-left font-mono text-muted-foreground">{entry.index}</span>
                      <pre className="whitespace-pre-wrap break-words font-sans leading-6">{entry.line || " "}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
              )}
            </div>
          </AdminCard>

          <AdminCard title="حدود هذه المعاينة" description="لا يُستنتج اعتماد أو حق إعادة استخدام من العد النصي.">
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
              <li>• لا تتم مطابقة الملف تلقائيًا مع وثائق المعرفة الحالية.</li>
              <li>• لا تُعد حالة OFFICIAL_PUBLIC_DOCUMENT ترخيصًا تلقائيًا لإعادة النشر.</li>
              <li>• تبقى الحقوق غير المؤيدة برابط أو نص ترخيص في حالة NOT_VERIFIED.</li>
              <li>• الاستيراد اللاحق يحتاج Preview للمطابقة، إزالة التكرار، ثم قرارًا بشريًا مستقلًا.</li>
            </ul>
          </AdminCard>
        </>
      )}
    </AdminPage>
  );
}
