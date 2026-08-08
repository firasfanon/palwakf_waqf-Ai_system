export default function AdminMustakshifAi() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-6">
        <h2 className="text-2xl font-bold">مستكشف الأراضي + AI</h2>
        <p className="mt-2 text-muted-foreground">
          صفحة إدارة (Admin) لمستكشف الأراضي. هذه نسخة UI أولية داخل لوحة التحكم.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <div className="text-sm text-muted-foreground">
            ملاحظة سيادية: هذه واجهة استرشادية. التفاصيل الحساسة والوثائق تُعرض فقط للمخوّلين.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="font-semibold">بحث سريع</div>
          <div className="mt-2 text-sm text-muted-foreground">
            (قريبًا) بحث PWF/حوض/قطعة/محافظة…
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="font-semibold">مطابقة AI</div>
          <div className="mt-2 text-sm text-muted-foreground">
            (قريبًا) تلخيص/تصنيف/اقتراحات.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="font-semibold">نتائج</div>
          <div className="mt-2 text-sm text-muted-foreground">
            (قريبًا) قائمة نتائج + فتح التفاصيل.
          </div>
        </div>
      </div>
    </div>
  );
}
