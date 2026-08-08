# المقترح 1 و 3: نظام الإشعارات والتعليقات (2026-01-09)

## المقترح 1: نظام الإشعارات الفورية (Real-time Notifications)
- [x] إنشاء جدول notifications في قاعدة البيانات (تم تعديل الموجود)
- [x] إضافة tRPC procedures (list, getUnreadCount, markAsRead, markAllAsRead, delete)
- [ ] إنشاء مكون NotificationBell في Navbar
- [ ] إضافة إشعارات تلقائية عند الأحداث المهمة (رد جديد، تعليق جديد، موافقة على محتوى)
- [ ] إضافة صفحة إدارة الإشعارات للمسؤولين
- [ ] كتابة اختبارات Vitest

## المقترح 3: نظام التعليقات والمراجعات
- [x] إنشاء جدول comments في قاعدة البيانات
- [x] إنشاء جدول ratings في قاعدة البيانات
- [x] إضافة tRPC procedures للتعليقات (getByEntity, create, update, delete, getPending, approve)
- [x] إضافة tRPC procedures للتقييمات (rate, getAverage, getUserRating, delete)
- [ ] إنشاء مكون CommentsSection قابل لإعادة الاستخدام
- [ ] إنشاء مكون RatingStars للتقييمات
- [ ] دمج التعليقات في صفحات تفاصيل المراجع (KnowledgeDetails)
- [ ] دمج التعليقات في صفحات تفاصيل الوثائق الأخرى
- [ ] كتابة اختبارات Vitest
