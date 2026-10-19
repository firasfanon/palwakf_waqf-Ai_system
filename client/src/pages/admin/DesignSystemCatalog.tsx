import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { designTokens } from "@/lib/designTokens.generated";

const semanticTokenNames = Object.keys(designTokens).filter(
  (name) => name.startsWith("color.") || name.startsWith("component."),
);

export default function DesignSystemCatalog() {
  return (
    <main
      className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6"
      dir="rtl"
      aria-labelledby="design-system-title"
    >
      <header className="space-y-2">
        <h1 id="design-system-title" className="text-2xl font-black text-foreground md:text-3xl">
          نظام التصميم — WAQF_AI
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          كتالوج داخلي محكوم للمكوّنات والتوكنز والحالات الدلالية. القيم المعروضة مولدة من
          design-system/tokens وليست مصدر حقيقة مستقلًا.
        </p>
      </header>

      <Tabs defaultValue="states" className="space-y-4">
        <TabsList aria-label="أقسام نظام التصميم" className="max-w-full overflow-x-auto">
          <TabsTrigger value="states">الحالات</TabsTrigger>
          <TabsTrigger value="components">المكوّنات</TabsTrigger>
          <TabsTrigger value="bidi">RTL / Bidi</TabsTrigger>
          <TabsTrigger value="tokens">التوكنز</TabsTrigger>
        </TabsList>

        <TabsContent value="states">
          <Card>
            <CardHeader>
              <CardTitle>الحالات الدلالية</CardTitle>
              <CardDescription>
                الأيقونة والنص جزء من العقد؛ لا يُعتمد على اللون وحده.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <StatusBadge tone="success">متحقق</StatusBadge>
              <StatusBadge tone="warning">يحتاج مراجعة</StatusBadge>
              <StatusBadge tone="danger">محجوب</StatusBadge>
              <StatusBadge tone="info">معلومة</StatusBadge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components">
          <div className="ds-review-grid">
            <Card>
              <CardHeader>
                <CardTitle>أزرار</CardTitle>
                <CardDescription>default / secondary / outline / disabled</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button>إجراء أساسي</Button>
                <Button variant="secondary">ثانوي</Button>
                <Button variant="outline">حدودي</Button>
                <Button disabled>غير متاح</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حقل إدخال</CardTitle>
                <CardDescription>Label واضح وحالة focus مرئية.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="ds-catalog-input">مرجع البحث</Label>
                <Input id="ds-catalog-input" placeholder="مثال: رقم حجة أو قرار" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bidi">
          <Card>
            <CardHeader>
              <CardTitle>النص المختلط</CardTitle>
              <CardDescription>المعرّفات والروابط والـSHA تبقى مستقرة داخل واجهة RTL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>مرجع عربي مع معرف لاتيني:</p>
              <code className="ds-bidi-isolate block overflow-x-auto rounded-md border bg-muted p-3 text-left" dir="ltr">
                HEAD=55571730a205afc5b4400637077228076952eea0
              </code>
              <p className="break-words">
                رابط مختلط:
                {" "}
                <span className="ds-bidi-isolate" dir="ltr">
                  https://example.invalid/waqf/reference/123
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Semantic / Component Tokens</CardTitle>
              <CardDescription>{semanticTokenNames.length} توكنًا ظاهرًا في هذا العرض.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="ds-responsive-table-shell">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">الاسم</th>
                      <th className="p-2">القيمة المحلولة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semanticTokenNames.map((name) => (
                      <tr key={name} className="border-b last:border-0">
                        <td className="p-2 font-mono text-xs" dir="ltr">{name}</td>
                        <td className="p-2 font-mono text-xs" dir="ltr">
                          {designTokens[name as keyof typeof designTokens]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
