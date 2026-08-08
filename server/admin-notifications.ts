import { getDb } from "./db";
import { users, notifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const admins = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"));

  return admins;
}

/**
 * Create notification for all admins
 */
export async function createAdminNotification(data: {
  type: "announcement" | "update" | "maintenance" | "alert" | "reply" | "comment" | "approval" | "system";
  title: string;
  content: string;
  relatedId?: number;
  relatedType?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all admin users
  const admins = await getAdminUsers();

  if (admins.length === 0) {
    console.warn("No admin users found to send notification");
    return [];
  }

  // Create notification for each admin
  const notificationPromises = admins.map(async (admin) => {
    const result = await db.insert(notifications).values({
      userId: admin.id,
      type: data.type,
      title: data.title,
      content: data.content,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      isRead: 0,
      targetAudience: "specific",
      status: "sent",
      createdBy: data.createdBy || admin.id,
      sentCount: 1,
      readCount: 0,
    });

    const insertedId = result[0]?.insertId;
    if (!insertedId) return null;

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, insertedId))
      .limit(1);

    return notification;
  });

  const createdNotifications = await Promise.all(notificationPromises);
  return createdNotifications.filter((n) => n !== null);
}

/**
 * Notify admins about new comment
 */
export async function notifyAdminsNewComment(data: {
  commentId: number;
  entityType: string;
  entityId: number;
  userName: string;
  content: string;
}) {
  const entityTypeLabels: Record<string, string> = {
    knowledge: "قاعدة المعرفة",
    faq: "الأسئلة الشائعة",
    property: "عقار وقفي",
    case: "قضية وقفية",
    ruling: "حكم قضائي",
    instruction: "تعليمات وزارية",
  };

  const entityLabel = entityTypeLabels[data.entityType] || data.entityType;

  return await createAdminNotification({
    type: "comment",
    title: "تعليق جديد",
    content: `أضاف ${data.userName} تعليقاً جديداً على ${entityLabel}: "${data.content.substring(0, 50)}${data.content.length > 50 ? "..." : ""}"`,
    relatedId: data.commentId,
    relatedType: "comment",
  });
}

/**
 * Notify admins about low rating
 */
export async function notifyAdminsLowRating(data: {
  ratingId: number;
  entityType: string;
  entityId: number;
  rating: number;
  userName?: string;
}) {
  const entityTypeLabels: Record<string, string> = {
    knowledge: "قاعدة المعرفة",
    faq: "الأسئلة الشائعة",
    property: "عقار وقفي",
    case: "قضية وقفية",
    ruling: "حكم قضائي",
    instruction: "تعليمات وزارية",
  };

  const entityLabel = entityTypeLabels[data.entityType] || data.entityType;
  const userName = data.userName || "مستخدم";

  return await createAdminNotification({
    type: "alert",
    title: "تقييم منخفض",
    content: `أعطى ${userName} تقييم ${data.rating} نجوم لـ ${entityLabel}. قد يحتاج المحتوى إلى مراجعة.`,
    relatedId: data.ratingId,
    relatedType: "rating",
  });
}

/**
 * Notify admins about comment pending approval
 */
export async function notifyAdminsCommentPendingApproval(data: {
  commentId: number;
  entityType: string;
  entityId: number;
  userName: string;
  content: string;
}) {
  const entityTypeLabels: Record<string, string> = {
    knowledge: "قاعدة المعرفة",
    faq: "الأسئلة الشائعة",
    property: "عقار وقفي",
    case: "قضية وقفية",
    ruling: "حكم قضائي",
    instruction: "تعليمات وزارية",
  };

  const entityLabel = entityTypeLabels[data.entityType] || data.entityType;

  return await createAdminNotification({
    type: "approval",
    title: "تعليق بانتظار الموافقة",
    content: `تعليق من ${data.userName} على ${entityLabel} بحاجة إلى موافقتك: "${data.content.substring(0, 50)}${data.content.length > 50 ? "..." : ""}"`,
    relatedId: data.commentId,
    relatedType: "comment",
  });
}
