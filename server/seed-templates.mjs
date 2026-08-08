import { drizzle } from "drizzle-orm/mysql2";
import { sectionTemplates } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const templates = [
  {
    name: "مرحباً بكم في منصة الأوقاف",
    description: "قسم ترحيبي للصفحة الرئيسية",
    category: "welcome",
    title: "مرحباً بكم في نموذج الذكاء الصناعي للأوقاف الإسلامية في فلسطين",
    content: `<h1 style="text-align: center;">مرحباً بكم في منصة الأوقاف الذكية</h1>
<p style="text-align: center;">نظام ذكاء صناعي متقدم لإدارة الأوقاف الإسلامية في فلسطين</p>
<p style="text-align: center;">نقدم لكم حلولاً مبتكرة تجمع بين التراث الإسلامي والتكنولوجيا الحديثة</p>`,
    backgroundColor: "#1e40af",
    textColor: "#ffffff",
    layout: "centered",
    ctaText: "ابدأ الآن",
    ctaLink: "/chat",
    isPublic: true,
  },
  {
    name: "عن المشروع",
    description: "قسم تعريفي بالمشروع وأهدافه",
    category: "about",
    title: "عن المشروع",
    content: `<h2>نموذج الذكاء الصناعي للأوقاف الإسلامية</h2>
<p>هذا المشروع هو نظام ذكاء صناعي متخصص في إدارة الأوقاف الإسلامية في فلسطين. يهدف إلى:</p>
<ul>
  <li>توفير معلومات دقيقة عن القوانين والأنظمة الوقفية</li>
  <li>مساعدة الباحثين والمختصين في الوصول للمعلومات</li>
  <li>حفظ التراث الوقفي الفلسطيني رقمياً</li>
  <li>تسهيل إدارة الأوقاف بطريقة حديثة وفعالة</li>
</ul>`,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    layout: "two-columns",
    isPublic: true,
  },
  {
    name: "الميزات الرئيسية",
    description: "عرض ميزات النظام",
    category: "features",
    title: "ميزات النظام",
    content: `<div style="text-align: center;">
  <h2>ميزات نظام الأوقاف الذكي</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 2rem;">
    <div>
      <h3>🤖 ذكاء صناعي متقدم</h3>
      <p>نظام RAG يجمع بين قاعدة معرفة ضخمة ونموذج لغوي قوي</p>
    </div>
    <div>
      <h3>📚 قاعدة معرفة شاملة</h3>
      <p>أكثر من 597 مرجع قانوني وفقهي وتاريخي</p>
    </div>
    <div>
      <h3>⚡ سرعة وكفاءة</h3>
      <p>إجابات فورية مع مصادر موثوقة</p>
    </div>
  </div>
</div>`,
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    layout: "full-width",
    isPublic: true,
  },
  {
    name: "إحصائيات المنصة",
    description: "عرض الإحصائيات الرئيسية",
    category: "statistics",
    title: "إحصائيات المنصة",
    content: `<div style="text-align: center;">
  <h2>أرقام تتحدث عن نفسها</h2>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-top: 2rem;">
    <div style="padding: 2rem; background: #dbeafe; border-radius: 0.5rem;">
      <h3 style="font-size: 2.5rem; color: #1e40af;">597+</h3>
      <p>مرجع قانوني وفقهي</p>
    </div>
    <div style="padding: 2rem; background: #dcfce7; border-radius: 0.5rem;">
      <h3 style="font-size: 2.5rem; color: #16a34a;">1000+</h3>
      <p>مستخدم نشط</p>
    </div>
    <div style="padding: 2rem; background: #fef3c7; border-radius: 0.5rem;">
      <h3 style="font-size: 2.5rem; color: #d97706;">5000+</h3>
      <p>استفسار تم الإجابة عليه</p>
    </div>
    <div style="padding: 2rem; background: #fce7f3; border-radius: 0.5rem;">
      <h3 style="font-size: 2.5rem; color: #db2777;">95%</h3>
      <p>معدل الرضا</p>
    </div>
  </div>
</div>`,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    layout: "full-width",
    isPublic: true,
  },
  {
    name: "الأسئلة الشائعة",
    description: "قسم الأسئلة المتكررة",
    category: "faq",
    title: "الأسئلة الشائعة",
    content: `<h2 style="text-align: center;">الأسئلة الشائعة</h2>
<div style="max-width: 800px; margin: 2rem auto;">
  <details style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
    <summary style="font-weight: 600; cursor: pointer;">ما هو نظام الأوقاف الذكي؟</summary>
    <p style="margin-top: 0.5rem;">هو نظام ذكاء صناعي متخصص في إدارة الأوقاف الإسلامية في فلسطين، يوفر معلومات دقيقة ومصادر موثوقة.</p>
  </details>
  <details style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
    <summary style="font-weight: 600; cursor: pointer;">كيف يمكنني استخدام النظام؟</summary>
    <p style="margin-top: 0.5rem;">يمكنك البدء بطرح أسئلتك في صفحة المحادثة، وسيقوم النظام بالإجابة مع توفير المصادر.</p>
  </details>
  <details style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
    <summary style="font-weight: 600; cursor: pointer;">هل المعلومات موثوقة؟</summary>
    <p style="margin-top: 0.5rem;">نعم، جميع المعلومات مستمدة من مصادر قانونية وفقهية موثوقة ومعتمدة.</p>
  </details>
</div>`,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    layout: "centered",
    isPublic: true,
  },
  {
    name: "اتصل بنا",
    description: "معلومات التواصل",
    category: "contact",
    title: "تواصل معنا",
    content: `<div style="text-align: center;">
  <h2>تواصل معنا</h2>
  <p>نحن هنا للإجابة على استفساراتكم</p>
  <div style="margin-top: 2rem;">
    <p>📧 البريد الإلكتروني: info@waqf-ai.ps</p>
    <p>📱 الهاتف: +970 2 123 4567</p>
    <p>📍 العنوان: رام الله، فلسطين</p>
  </div>
</div>`,
    backgroundColor: "#1e40af",
    textColor: "#ffffff",
    layout: "centered",
    ctaText: "أرسل رسالة",
    ctaLink: "/contact",
    isPublic: true,
  },
  {
    name: "شركاؤنا",
    description: "عرض الشركاء والداعمين",
    category: "partners",
    title: "شركاؤنا",
    content: `<div style="text-align: center;">
  <h2>شركاؤنا في النجاح</h2>
  <p>نفخر بشراكتنا مع المؤسسات الرائدة</p>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-top: 2rem; align-items: center;">
    <div style="padding: 1rem; background: white; border-radius: 0.5rem;">
      <p style="font-weight: 600;">وزارة الأوقاف</p>
    </div>
    <div style="padding: 1rem; background: white; border-radius: 0.5rem;">
      <p style="font-weight: 600;">الجامعات الفلسطينية</p>
    </div>
    <div style="padding: 1rem; background: white; border-radius: 0.5rem;">
      <p style="font-weight: 600;">مراكز البحث</p>
    </div>
    <div style="padding: 1rem; background: white; border-radius: 0.5rem;">
      <p style="font-weight: 600;">المنظمات الدولية</p>
    </div>
  </div>
</div>`,
    backgroundColor: "#f3f4f6",
    textColor: "#1f2937",
    layout: "full-width",
    isPublic: true,
  },
  {
    name: "آخر الأخبار",
    description: "عرض الأخبار والتحديثات",
    category: "news",
    title: "آخر الأخبار",
    content: `<h2 style="text-align: center;">آخر التحديثات</h2>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2rem;">
  <div style="padding: 1.5rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
    <h3>إطلاق النسخة 2.0</h3>
    <p style="color: #6b7280; font-size: 0.875rem;">2024-01-15</p>
    <p>تحديثات كبيرة في النظام مع ميزات جديدة</p>
  </div>
  <div style="padding: 1.5rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
    <h3>إضافة 200 مرجع جديد</h3>
    <p style="color: #6b7280; font-size: 0.875rem;">2024-01-10</p>
    <p>توسيع قاعدة المعرفة بمراجع حديثة</p>
  </div>
  <div style="padding: 1.5rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
    <h3>ورشة عمل تدريبية</h3>
    <p style="color: #6b7280; font-size: 0.875rem;">2024-01-05</p>
    <p>تدريب المستخدمين على النظام الجديد</p>
  </div>
</div>`,
    backgroundColor: "#f9fafb",
    textColor: "#111827",
    layout: "full-width",
    isPublic: true,
  },
  {
    name: "فريق العمل",
    description: "تعريف بفريق المشروع",
    category: "team",
    title: "فريق العمل",
    content: `<div style="text-align: center;">
  <h2>فريقنا المتميز</h2>
  <p>خبراء متخصصون في الأوقاف والتكنولوجيا</p>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-top: 2rem;">
    <div>
      <div style="width: 100px; height: 100px; background: #dbeafe; border-radius: 50%; margin: 0 auto;"></div>
      <h3 style="margin-top: 1rem;">د. أحمد محمد</h3>
      <p style="color: #6b7280;">مدير المشروع</p>
    </div>
    <div>
      <div style="width: 100px; height: 100px; background: #dcfce7; border-radius: 50%; margin: 0 auto;"></div>
      <h3 style="margin-top: 1rem;">م. فاطمة علي</h3>
      <p style="color: #6b7280;">مطورة رئيسية</p>
    </div>
    <div>
      <div style="width: 100px; height: 100px; background: #fef3c7; border-radius: 50%; margin: 0 auto;"></div>
      <h3 style="margin-top: 1rem;">د. خالد حسن</h3>
      <p style="color: #6b7280;">خبير فقهي</p>
    </div>
    <div>
      <div style="width: 100px; height: 100px; background: #fce7f3; border-radius: 50%; margin: 0 auto;"></div>
      <h3 style="margin-top: 1rem;">أ. سارة يوسف</h3>
      <p style="color: #6b7280;">باحثة قانونية</p>
    </div>
  </div>
</div>`,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    layout: "full-width",
    isPublic: true,
  },
  {
    name: "خدماتنا",
    description: "عرض الخدمات المقدمة",
    category: "services",
    title: "خدماتنا",
    content: `<h2 style="text-align: center;">الخدمات التي نقدمها</h2>
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-top: 2rem;">
  <div style="padding: 2rem; background: #f9fafb; border-radius: 0.5rem;">
    <h3>🔍 البحث في المراجع</h3>
    <p>بحث متقدم في أكثر من 597 مرجع قانوني وفقهي</p>
  </div>
  <div style="padding: 2rem; background: #f9fafb; border-radius: 0.5rem;">
    <h3>💬 المحادثة الذكية</h3>
    <p>نظام محادثة ذكي يجيب على استفساراتك بدقة</p>
  </div>
  <div style="padding: 2rem; background: #f9fafb; border-radius: 0.5rem;">
    <h3>📊 إدارة الأوقاف</h3>
    <p>أدوات متقدمة لإدارة الأوقاف والعقارات</p>
  </div>
  <div style="padding: 2rem; background: #f9fafb; border-radius: 0.5rem;">
    <h3>📚 قاعدة المعرفة</h3>
    <p>وصول كامل لقاعدة معرفة شاملة ومنظمة</p>
  </div>
</div>`,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    layout: "two-columns",
    isPublic: true,
  },
];

async function seedTemplates() {
  console.log("🌱 Seeding section templates...");
  
  try {
    for (const template of templates) {
      await db.insert(sectionTemplates).values(template);
      console.log(`✅ Created template: ${template.name}`);
    }
    
    console.log("\n✅ All templates seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

seedTemplates();
