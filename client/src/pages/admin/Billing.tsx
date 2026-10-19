import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export default function Billing() {
  return (
    <main className="container space-y-5 py-8" dir="rtl" aria-labelledby="billing-title">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <CreditCard aria-hidden="true" className="size-7" />
          <h1 id="billing-title" className="text-2xl font-black md:text-3xl">
            الفواتير
          </h1>
          <StatusBadge tone="warning">مؤجل بقرار منتج</StatusBadge>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          لا توجد حاليًا خدمة فوترة معتمدة داخل WAQF_AI. هذا المسار محفوظ كتوافق
          داخلي تاريخي ولا يُحتسب كوظيفة مكتملة، ولا ينفذ أي عملية مالية.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>شروط إعادة فتح المسار</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pe-5 text-sm text-muted-foreground">
            <li>قرار منتج يثبت الحاجة الوظيفية.</li>
            <li>عقد تكامل وأمن وخصوصية معتمد.</li>
            <li>نموذج صلاحيات وتدقيق واضح.</li>
            <li>اختبارات تكامل منفصلة قبل أي استخدام فعلي.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
