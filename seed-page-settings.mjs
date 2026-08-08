import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { pageSettings } from "./drizzle/schema.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const pages = [
  {
    pageName: 'home',
    title: 'نموذج الذكاء الصناعي للأوقاف الإسلامية في فلسطين',
    description: 'نظام ذكاء اصطناعي شامل يستند إلى القوانين الفلسطينية، مجلة الأحكام العدلية، والمراجع الشرعية والتاريخية',
    metaKeywords: 'أوقاف، فلسطين، ذكاء اصطناعي، قانون، مجلة الأحكام العدلية',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  },
  {
    pageName: 'about',
    title: 'من نحن - نموذج الأوقاف',
    description: 'تعرف على نموذج الذكاء الصناعي المتخصص في الأوقاف الإسلامية',
    metaKeywords: 'من نحن، أوقاف، فلسطين',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  },
  {
    pageName: 'services',
    title: 'خدماتنا - نموذج الأوقاف',
    description: 'استكشف خدماتنا المتخصصة في مجال الأوقاف',
    metaKeywords: 'خدمات، أوقاف، استشارات',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  },
  {
    pageName: 'references',
    title: 'مراجع الأوقاف',
    description: 'مراجع قانونية وشرعية شاملة للأوقاف الإسلامية',
    metaKeywords: 'مراجع، قوانين، أوقاف',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  },
  {
    pageName: 'knowledge',
    title: 'قاعدة المعرفة',
    description: 'قاعدة معرفية شاملة حول الأوقاف الإسلامية',
    metaKeywords: 'معرفة، أوقاف، مكتبة',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  },
  {
    pageName: 'contact',
    title: 'اتصل بنا',
    description: 'تواصل معنا للاستفسارات والاستشارات',
    metaKeywords: 'اتصل بنا، تواصل',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  },
  {
    pageName: 'blog',
    title: 'المدونة',
    description: 'آخر الأخبار والمقالات حول الأوقاف',
    metaKeywords: 'مدونة، أخبار، مقالات',
    ogImage: '',
    customCss: '',
    customJs: '',
    isActive: 1
  }
];

try {
  console.log('🌱 Seeding page_settings...');
  
  for (const page of pages) {
    await db.insert(pageSettings).values(page).onDuplicateKeyUpdate({ 
      set: { title: page.title, description: page.description }
    });
    console.log(`✅ Inserted/Updated: ${page.pageName}`);
  }
  
  console.log('✅ Page settings seeded successfully!');
} catch (error) {
  console.error('❌ Error seeding page_settings:', error);
} finally {
  await connection.end();
}
