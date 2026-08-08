# Page Cleanup Pass 3 — FAQs / Knowledge / Home

## الهدف
تنظيف الصفحات العامة التالية من التدرجات المحلية والتباينات البصرية المتناثرة وربطها بالثيم المركزي المجمد:
- FAQs
- Knowledge
- Home

## ما تم
- توحيد shell/header/hero في صفحات FAQs وKnowledge حول public-page-* utilities.
- تحويل Tabs/Cards/Dialogs في الصفحتين إلى public-surface-card / public-page-tabs / public-soft-card.
- تنظيف كثير من الألوان المباشرة والـ dark variants من Home.
- اعتماد public-home-hero / public-home-glass / public-panel / public-link-card / public-chat-shell.
- تحديث index.css ليكون مصدر التدرجات والسطوح العامة لهذه الصفحات بدل التنسيق المحلي داخل كل صفحة.
- تحويل service-gradient / feature-gradient / footer-gradient إلى صيغ مبنية على التوكنات المركزية بدل الألوان الصلبة القديمة.

## الملفات المعدلة
- client/src/index.css
- client/src/pages/FAQs.tsx
- client/src/pages/Knowledge.tsx
- client/src/pages/Home.tsx

## النتيجة
- صفحات المعرفة العامة وFAQ أصبحت أقرب بصريًا للثيم المركزي الموحد.
- الصفحة الرئيسية ما زالت غنية بالمحتوى، لكن تم تقليل التشتت البصري الواضح وتخفيف الاعتماد على dark/light المحلية.
- لا يزال بالإمكان تنفيذ Pass لاحق أدق على Home لتقليل العناصر الزخرفية أكثر إذا لزم.
