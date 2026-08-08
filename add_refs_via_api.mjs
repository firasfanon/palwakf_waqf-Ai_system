import fs from 'fs';

// قراءة ملف المراجع
const referencesData = JSON.parse(
  fs.readFileSync('./research_data/jerusalem_land_references.json', 'utf8')
);

console.log('🚀 بدء إضافة مراجع ملكية الأراضي في لواء القدس...\n');
console.log(`📚 عدد المراجع المطلوب إضافتها: ${referencesData.length}\n`);

// طباعة المراجع للمراجعة
referencesData.forEach((ref, index) => {
  console.log(`${index + 1}. ${ref.title}`);
  console.log(`   المؤلف: ${ref.author || 'غير محدد'}`);
  console.log(`   السنة: ${ref.year || 'غير محدد'}`);
  console.log(`   الفئة: ${ref.category}`);
  console.log(`   الكلمات المفتاحية: ${ref.keywords ? ref.keywords.join(', ') : 'لا يوجد'}`);
  console.log('');
});

console.log('\n✅ تم التحقق من البيانات. استخدم واجهة الإدارة لإضافة المراجع يدوياً أو استخدم API.');
