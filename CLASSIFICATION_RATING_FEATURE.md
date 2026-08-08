# ميزة التصنيف الذكي ونظام التقييم

## نظرة عامة

تم إضافة نظام متكامل للتصنيف التلقائي للمحتوى المجلوب ونظام تقييم جودة التصنيف لتحسين دقة النظام بشكل مستمر.

## الميزات الرئيسية

### 1. التصنيف التلقائي للمحتوى

#### الوصف
يستخدم النظام الذكاء الصناعي لتصنيف المحتوى المجلوب تلقائياً إلى فئات دقيقة بناءً على محتواه.

#### الفئات المدعومة
- **قانونية**: قوانين، تشريعات، أنظمة
- **شرعية**: فتاوى، أحكام فقهية، مراجع دينية
- **إدارية**: تعليمات، قرارات إدارية، مراسلات
- **تاريخية**: وثائق عثمانية، حجج قديمة، سجلات
- **مرجعية**: مراجع عامة

#### المخرجات
- **الفئة الرئيسية**: التصنيف الأساسي للمحتوى
- **الفئات الفرعية**: تصنيفات إضافية
- **الكلمات المفتاحية**: كلمات مفتاحية مستخرجة من المحتوى
- **الملخص**: ملخص قصير للمحتوى
- **درجة الصلة**: درجة من 0 إلى 100 تعبر عن مدى صلة المحتوى بالأوقاف الإسلامية
- **مستوى الثقة**: درجة من 0 إلى 1 تعبر عن ثقة النظام في التصنيف

### 2. نظام تقييم جودة التصنيف

#### الوصف
يسمح للمستخدمين بتقييم دقة التصنيف التلقائي باستخدام أزرار 👍/👎، مما يساعد في:
- قياس دقة النظام
- تحديد نقاط الضعف
- تحسين النموذج مستقبلاً

#### البيانات المحفوظة
- معرف المحتوى المصنف
- التقييم (إيجابي/سلبي)
- ملاحظات اختيارية
- معرف المستخدم الذي قيّم
- تاريخ ووقت التقييم

#### الإحصائيات
- إجمالي التقييمات
- عدد التقييمات الإيجابية
- عدد التقييمات السلبية
- معدل الدقة (Accuracy Rate)

## الاستخدام

### التصنيف الفردي

1. افتح صفحة **مراجعة المحتوى المجلوب** (`/admin/fetched-content-review`)
2. ابحث عن العنصر الذي تريد تصنيفه
3. اضغط على زر ⭐ (Sparkles) بجانب العنصر
4. سيتم تصنيف المحتوى تلقائياً وتحديث حالته إلى "قيد المعالجة"

### التصنيف الجماعي

1. افتح صفحة **مراجعة المحتوى المجلوب**
2. حدد العناصر التي تريد تصنيفها باستخدام checkboxes
3. اضغط على زر **تصنيف تلقائي** في شريط الإجراءات الجماعية
4. سيتم تصنيف جميع العناصر المحددة

### تقييم التصنيف

1. بعد تصنيف المحتوى، ستظهر أزرار 👍/👎
2. اضغط على 👍 إذا كان التصنيف دقيقاً
3. اضغط على 👎 إذا كان التصنيف غير دقيق
4. يمكنك إضافة ملاحظات اختيارية

### عرض الإحصائيات

تظهر إحصائيات التقييم تلقائياً في أعلى صفحة **مراجعة المحتوى المجلوب** وتتضمن:
- إجمالي التقييمات
- التقييمات الإيجابية (باللون الأخضر)
- التقييمات السلبية (باللون الأحمر)
- معدل الدقة (باللون الأزرق)

## البنية التقنية

### قاعدة البيانات

#### جدول `classification_ratings`
```sql
CREATE TABLE classification_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fetched_content_id INT NOT NULL,
  rating ENUM('positive', 'negative') NOT NULL,
  feedback TEXT,
  rated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fetched_content_id) REFERENCES fetched_content(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_by) REFERENCES users(id),
  INDEX (fetched_content_id),
  INDEX (rating),
  INDEX (rated_by)
);
```

### tRPC Procedures

#### `fetchedContent.classifyItem`
تصنيف عنصر واحد

**Input:**
```typescript
{ id: number }
```

**Output:**
```typescript
{
  success: boolean;
  classification: {
    category: string;
    keywords: string[];
    summary: string;
    relevanceScore: number;
  };
}
```

#### `fetchedContent.classifyMultiple`
تصنيف عدة عناصر

**Input:**
```typescript
{ ids: number[] }
```

**Output:**
```typescript
{
  success: boolean;
  successCount: number;
  errorCount: number;
  results: Array<{
    id: number;
    category: string;
    relevanceScore: number;
  }>;
}
```

#### `fetchedContent.rateClassification`
تقييم تصنيف

**Input:**
```typescript
{
  fetchedContentId: number;
  rating: 'positive' | 'negative';
  feedback?: string;
}
```

**Output:**
```typescript
{ success: boolean }
```

#### `fetchedContent.getRatingsStats`
الحصول على إحصائيات التقييمات

**Output:**
```typescript
{
  total: number;
  positive: number;
  negative: number;
  accuracyRate: number;
}
```

### دوال قاعدة البيانات

في `server/db.ts`:
- `createClassificationRating()`: إنشاء تقييم جديد
- `getClassificationRatingById()`: الحصول على تقييم حسب المعرف
- `getClassificationRatingByContentId()`: الحصول على تقييم حسب معرف المحتوى
- `getClassificationRatingsStats()`: الحصول على إحصائيات التقييمات
- `getAllClassificationRatings()`: الحصول على جميع التقييمات
- `deleteClassificationRating()`: حذف تقييم

### دوال الذكاء الصناعي

في `server/ai-advanced.ts`:
- `classifyDocument()`: تصنيف وثيقة باستخدام LLM

**Signature:**
```typescript
async function classifyDocument(
  text: string,
  title?: string
): Promise<ClassificationResult>
```

**ClassificationResult:**
```typescript
interface ClassificationResult {
  category: string;
  confidence: number;
  subcategories: string[];
  keywords: string[];
  summary?: string;
  relevanceScore?: number;
}
```

## الاختبارات

تم كتابة 10 اختبارات شاملة في `server/classification.test.ts`:

### مجموعة اختبارات "إنشاء التقييمات"
1. ✅ يجب أن ينشئ تقييم إيجابي بنجاح
2. ✅ يجب أن ينشئ تقييم سلبي بنجاح
3. ✅ يجب أن ينشئ تقييم بدون ملاحظات

### مجموعة اختبارات "استرجاع التقييمات"
4. ✅ يجب أن يسترجع التقييم حسب معرف المحتوى
5. ✅ يجب أن يرجع undefined لمحتوى غير مقيّم

### مجموعة اختبارات "إحصائيات التقييمات"
6. ✅ يجب أن يحسب الإحصائيات بشكل صحيح
7. ✅ يجب أن يحسب معدل الدقة بشكل صحيح
8. ✅ يجب أن يكون مجموع الإيجابي والسلبي يساوي الإجمالي

### مجموعة اختبارات "التحقق من صحة البيانات"
9. ✅ يجب أن يحفظ timestamp بشكل صحيح
10. ✅ يجب أن يحفظ معرف المستخدم بشكل صحيح

**تشغيل الاختبارات:**
```bash
pnpm test classification.test.ts
```

## التحسينات المستقبلية

1. **تدريب نموذج محلي**: استخدام التقييمات لتدريب نموذج محلي مخصص
2. **تصنيف تلقائي عند الجلب**: تفعيل التصنيف التلقائي فور جلب المحتوى
3. **تقارير تفصيلية**: إضافة صفحة تقارير مفصلة للتقييمات
4. **تصنيف متعدد المستويات**: دعم تصنيفات فرعية أكثر تفصيلاً
5. **اقتراحات تحسين**: اقتراح تحسينات للمحتوى بناءً على التصنيف

## الملاحظات

- يتطلب التصنيف اتصال بالإنترنت (يستخدم LLM API)
- التقييمات تُحفظ بشكل دائم ولا يمكن تعديلها (فقط إضافة أو حذف)
- كل محتوى يمكن تقييمه مرة واحدة فقط من قبل نفس المستخدم
- معدل الدقة يُحسب تلقائياً: (عدد التقييمات الإيجابية / إجمالي التقييمات) × 100

## تاريخ الإصدار

**الإصدار**: 1.0.0  
**التاريخ**: 2026-01-09  
**المطور**: فريق تطوير نظام الأوقاف الإسلامية
