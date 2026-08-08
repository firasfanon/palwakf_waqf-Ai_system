import React from "react";

export default function MustakshifAiPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-lg font-extrabold text-foreground">مستكشف الأراضي + AI</div>
        <div className="mt-1 text-sm text-muted-foreground">
          هذه الصفحة واجهة تمهيدية ضمن لوحة التحكم. سيتم ربطها لاحقًا ببيانات الأراضي/العقارات الوقفية ضمن النظام الحالي.
        </div>
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/15 px-4 py-3 text-sm text-destructive-foreground/90">
          استرشادي — التفاصيل الحساسة للمخوّلين فقط.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="font-extrabold text-foreground">بحث وقفي (قريبًا)</div>
          <div className="mt-2 text-sm text-muted-foreground">PWF / قطعة-حوض / محافظة / تجمع / نوع أصل.</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="font-extrabold text-foreground">تحليلات AI (قريبًا)</div>
          <div className="mt-2 text-sm text-muted-foreground">تلخيص ملفات، أسئلة شائعة، تدقيق بيانات، ومساعدات داخلية.</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="font-extrabold text-foreground">ربط الأراضي/العقارات</div>
          <div className="mt-2 text-sm text-muted-foreground">يعتمد على جداول إدارة الأراضي/العقارات الموجودة حاليًا داخل المشروع.</div>
        </div>
      </div>
    </div>
  );
}
