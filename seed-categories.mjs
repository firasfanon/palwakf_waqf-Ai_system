import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { waqfCategories } from "./drizzle/schema.js";

// إنشاء الاتصال بقاعدة البيانات
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// التصنيفات الافتراضية مع أيقونات وألوان
const defaultCategories = [
  {
    name: "Religious Sites",
    nameAr: "مواقع دينية",
    description: "المساجد والمقامات والمواقع الدينية",
    icon: "Mosque",
    color: "#10b981", // green-500
    order: 1,
  },
  {
    name: "Educational",
    nameAr: "تعليمية",
    description: "المدارس والمراكز التعليمية",
    icon: "GraduationCap",
    color: "#3b82f6", // blue-500
    order: 2,
  },
  {
    name: "Healthcare",
    nameAr: "صحية",
    description: "العيادات والمراكز الصحية",
    icon: "Heart",
    color: "#ef4444", // red-500
    order: 3,
  },
  {
    name: "Agricultural",
    nameAr: "زراعية",
    description: "الأراضي الزراعية والمزارع",
    icon: "Sprout",
    color: "#22c55e", // green-600
    order: 4,
  },
  {
    name: "Commercial",
    nameAr: "تجارية",
    description: "المباني التجارية والمحلات",
    icon: "Store",
    color: "#f59e0b", // amber-500
    order: 5,
  },
  {
    name: "Residential",
    nameAr: "سكنية",
    description: "المباني السكنية",
    icon: "Home",
    color: "#8b5cf6", // violet-500
    order: 6,
  },
  {
    name: "Historical",
    nameAr: "تاريخية",
    description: "المواقع والمباني التاريخية",
    icon: "Landmark",
    color: "#d97706", // amber-600
    order: 7,
  },
  {
    name: "Cemeteries",
    nameAr: "مقابر",
    description: "المقابر الإسلامية",
    icon: "Cross",
    color: "#6b7280", // gray-500
    order: 8,
  },
];

async function seedCategories() {
  try {
    console.log("🌱 بدء إضافة التصنيفات الافتراضية...");

    for (const category of defaultCategories) {
      await db.insert(waqfCategories).values({
        ...category,
        isActive: true,
        createdBy: 1, // افتراضياً المستخدم الأول (admin)
      });
      console.log(`✅ تمت إضافة التصنيف: ${category.nameAr}`);
    }

    console.log("\n🎉 تمت إضافة جميع التصنيفات بنجاح!");
    console.log(`📊 عدد التصنيفات المضافة: ${defaultCategories.length}`);
  } catch (error) {
    console.error("❌ خطأ في إضافة التصنيفات:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedCategories();
