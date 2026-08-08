import { getDb } from "./db";
import {
  conversations,
  messages,
  bookmarks,
  favoriteConversations,
  knowledgeDocuments,
  searchLogs,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Export user conversations to JSON/CSV format
 */
export async function exportUserConversations(userId: number, format: "json" | "csv") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all user conversations with messages
  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt));

  const conversationsWithMessages = await Promise.all(
    userConversations.map(async (conversation) => {
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(messages.createdAt);

      return {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        })),
      };
    })
  );

  if (format === "json") {
    return {
      format: "json" as const,
      data: JSON.stringify(conversationsWithMessages, null, 2),
      filename: `conversations_${new Date().toISOString().split("T")[0]}.json`,
    };
  } else {
    // CSV format - flatten conversations
    const csvRows = [
      ["رقم المحادثة", "العنوان", "تاريخ الإنشاء", "عدد الرسائل", "آخر تحديث"],
    ];

    conversationsWithMessages.forEach((conv) => {
      csvRows.push([
        conv.id.toString(),
        conv.title || "محادثة",
        new Date(conv.createdAt).toLocaleDateString("ar-EG"),
        conv.messages.length.toString(),
        new Date(conv.updatedAt).toLocaleDateString("ar-EG"),
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    return {
      format: "csv" as const,
      data: "\uFEFF" + csvContent, // BOM for Excel Arabic support
      filename: `conversations_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }
}

/**
 * Export user bookmarks to JSON/CSV format
 */
export async function exportUserBookmarks(userId: number, format: "json" | "csv") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userBookmarks = await db
    .select({
      id: bookmarks.id,
      documentId: bookmarks.documentId,
      collectionName: bookmarks.collectionName,
      notes: bookmarks.notes,
      createdAt: bookmarks.createdAt,
      document: {
        id: knowledgeDocuments.id,
        title: knowledgeDocuments.title,
        category: knowledgeDocuments.category,
        source: knowledgeDocuments.source,
      },
    })
    .from(bookmarks)
    .leftJoin(knowledgeDocuments, eq(bookmarks.documentId, knowledgeDocuments.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));

  if (format === "json") {
    return {
      format: "json" as const,
      data: JSON.stringify(userBookmarks, null, 2),
      filename: `bookmarks_${new Date().toISOString().split("T")[0]}.json`,
    };
  } else {
    // CSV format
    const csvRows = [
      ["رقم المرجع", "العنوان", "التصنيف", "المجموعة", "الملاحظات", "تاريخ الحفظ"],
    ];

    userBookmarks.forEach((bookmark) => {
      csvRows.push([
        bookmark.documentId.toString(),
        bookmark.document?.title || "وثيقة",
        bookmark.document?.category || "عام",
        bookmark.collectionName || "غير مصنف",
        bookmark.notes || "",
        new Date(bookmark.createdAt).toLocaleDateString("ar-EG"),
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    return {
      format: "csv" as const,
      data: "\uFEFF" + csvContent, // BOM for Excel Arabic support
      filename: `bookmarks_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }
}

/**
 * Export user search history to JSON/CSV format
 */
export async function exportUserSearchHistory(userId: number, format: "json" | "csv") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searches = await db
    .select()
    .from(searchLogs)
    .where(eq(searchLogs.userId, userId))
    .orderBy(desc(searchLogs.createdAt));

  if (format === "json") {
    return {
      format: "json" as const,
      data: JSON.stringify(searches, null, 2),
      filename: `search_history_${new Date().toISOString().split("T")[0]}.json`,
    };
  } else {
    // CSV format
    const csvRows = [["الاستعلام", "النوع", "عدد النتائج", "التاريخ"]];

    searches.forEach((search) => {
      csvRows.push([
        search.query,
        "عام",
        search.resultsCount?.toString() || "0",
        new Date(search.createdAt).toLocaleDateString("ar-EG"),
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    return {
      format: "csv" as const,
      data: "\uFEFF" + csvContent, // BOM for Excel Arabic support
      filename: `search_history_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }
}

/**
 * Export all user data (comprehensive export)
 */
export async function exportAllUserData(userId: number, format: "json" | "csv") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (format === "json") {
    // For JSON, combine all data types
    const [conversationsData, bookmarksData, searchHistoryData] = await Promise.all([
      exportUserConversations(userId, "json"),
      exportUserBookmarks(userId, "json"),
      exportUserSearchHistory(userId, "json"),
    ]);

    const allData = {
      exportDate: new Date().toISOString(),
      userId,
      conversations: JSON.parse(conversationsData.data),
      bookmarks: JSON.parse(bookmarksData.data),
      searchHistory: JSON.parse(searchHistoryData.data),
    };

    return {
      format: "json" as const,
      data: JSON.stringify(allData, null, 2),
      filename: `all_data_${new Date().toISOString().split("T")[0]}.json`,
    };
  } else {
    // For CSV, return a note that individual exports are recommended
    const csvRows = [
      ["نوع البيانات", "عدد السجلات", "ملاحظة"],
      [
        "المحادثات",
        "-",
        "يُنصح بتصدير كل نوع بيانات على حدة للحصول على تفاصيل كاملة",
      ],
      ["المراجع المحفوظة", "-", "استخدم خيار تصدير المراجع المحفوظة"],
      ["سجل البحث", "-", "استخدم خيار تصدير سجل البحث"],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    return {
      format: "csv" as const,
      data: "\uFEFF" + csvContent,
      filename: `export_guide_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }
}
