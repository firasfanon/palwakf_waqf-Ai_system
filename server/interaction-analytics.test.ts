import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import {
  getInteractionStats,
  getCommentsOverTime,
  getRatingsDistribution,
  getNotificationsByType,
  getRecentComments,
  getCommentsByEntityType,
  getRatingsByEntityType,
} from "./interaction-stats";
import {
  getAdminUsers,
  createAdminNotification,
  notifyAdminsNewComment,
  notifyAdminsLowRating,
  notifyAdminsCommentPendingApproval,
} from "./admin-notifications";

describe("Interaction Analytics", () => {
  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  describe("getInteractionStats", () => {
    it("should return interaction statistics", async () => {
      const stats = await getInteractionStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalComments");
      expect(stats).toHaveProperty("totalRatings");
      expect(stats).toHaveProperty("totalNotifications");
      expect(stats).toHaveProperty("avgRating");
      expect(stats).toHaveProperty("interactionRate");
      
      expect(typeof stats.totalComments).toBe("number");
      expect(typeof stats.totalRatings).toBe("number");
      expect(typeof stats.totalNotifications).toBe("number");
      expect(typeof stats.avgRating).toBe("string");
      expect(typeof stats.interactionRate).toBe("string");
      
      expect(stats.totalComments).toBeGreaterThanOrEqual(0);
      expect(stats.totalRatings).toBeGreaterThanOrEqual(0);
      expect(stats.totalNotifications).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getCommentsOverTime", () => {
    it("should return comments over time (last 30 days)", async () => {
      const commentsOverTime = await getCommentsOverTime();
      
      expect(Array.isArray(commentsOverTime)).toBe(true);
      
      if (commentsOverTime.length > 0) {
        const firstItem = commentsOverTime[0];
        expect(firstItem).toHaveProperty("date");
        expect(firstItem).toHaveProperty("count");
        expect(typeof firstItem.date).toBe("string");
        expect(typeof firstItem.count).toBe("number");
        expect(firstItem.count).toBeGreaterThanOrEqual(0);
      }
    });

    it("should return data within last 30 days", async () => {
      const commentsOverTime = await getCommentsOverTime();
      
      if (commentsOverTime.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        commentsOverTime.forEach((item) => {
          const itemDate = new Date(item.date);
          expect(itemDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
        });
      }
    });
  });

  describe("getRatingsDistribution", () => {
    it("should return ratings distribution (1-5 stars)", async () => {
      const ratingsDistribution = await getRatingsDistribution();
      
      expect(Array.isArray(ratingsDistribution)).toBe(true);
      
      if (ratingsDistribution.length > 0) {
        const firstItem = ratingsDistribution[0];
        expect(firstItem).toHaveProperty("rating");
        expect(firstItem).toHaveProperty("count");
        expect(typeof firstItem.rating).toBe("number");
        expect(typeof firstItem.count).toBe("number");
        expect(firstItem.rating).toBeGreaterThanOrEqual(1);
        expect(firstItem.rating).toBeLessThanOrEqual(5);
        expect(firstItem.count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getNotificationsByType", () => {
    it("should return notifications by type", async () => {
      const notificationsByType = await getNotificationsByType();
      
      expect(Array.isArray(notificationsByType)).toBe(true);
      
      if (notificationsByType.length > 0) {
        const firstItem = notificationsByType[0];
        expect(firstItem).toHaveProperty("type");
        expect(firstItem).toHaveProperty("count");
        expect(typeof firstItem.type).toBe("string");
        expect(typeof firstItem.count).toBe("number");
        expect(firstItem.count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getRecentComments", () => {
    it("should return recent comments (last 20)", async () => {
      const recentComments = await getRecentComments();
      
      expect(Array.isArray(recentComments)).toBe(true);
      expect(recentComments.length).toBeLessThanOrEqual(20);
      
      if (recentComments.length > 0) {
        const firstComment = recentComments[0];
        expect(firstComment).toHaveProperty("id");
        expect(firstComment).toHaveProperty("content");
        expect(firstComment).toHaveProperty("userId");
        expect(firstComment).toHaveProperty("entityType");
        expect(firstComment).toHaveProperty("entityId");
        expect(firstComment).toHaveProperty("createdAt");
        expect(firstComment).toHaveProperty("isApproved");
        
        expect(typeof firstComment.id).toBe("number");
        expect(typeof firstComment.content).toBe("string");
        expect(typeof firstComment.userId).toBe("number");
        expect(typeof firstComment.entityType).toBe("string");
        expect(typeof firstComment.entityId).toBe("number");
        expect(firstComment.createdAt).toBeInstanceOf(Date);
        expect(typeof firstComment.isApproved).toBe("boolean");
      }
    });

    it("should return comments in descending order by date", async () => {
      const recentComments = await getRecentComments();
      
      if (recentComments.length > 1) {
        for (let i = 0; i < recentComments.length - 1; i++) {
          const currentDate = new Date(recentComments[i].createdAt).getTime();
          const nextDate = new Date(recentComments[i + 1].createdAt).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      }
    });
  });

  describe("getCommentsByEntityType", () => {
    it("should return comments grouped by entity type", async () => {
      const commentsByEntity = await getCommentsByEntityType();
      
      expect(Array.isArray(commentsByEntity)).toBe(true);
      
      if (commentsByEntity.length > 0) {
        const firstItem = commentsByEntity[0];
        expect(firstItem).toHaveProperty("entityType");
        expect(firstItem).toHaveProperty("count");
        expect(typeof firstItem.entityType).toBe("string");
        expect(typeof firstItem.count).toBe("number");
        expect(firstItem.count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getRatingsByEntityType", () => {
    it("should return ratings grouped by entity type with average", async () => {
      const ratingsByEntity = await getRatingsByEntityType();
      
      expect(Array.isArray(ratingsByEntity)).toBe(true);
      
      if (ratingsByEntity.length > 0) {
        const firstItem = ratingsByEntity[0];
        expect(firstItem).toHaveProperty("entityType");
        expect(firstItem).toHaveProperty("count");
        expect(firstItem).toHaveProperty("avgRating");
        expect(typeof firstItem.entityType).toBe("string");
        expect(typeof firstItem.count).toBe("number");
        expect(typeof firstItem.avgRating).toBe("string");
        expect(firstItem.count).toBeGreaterThanOrEqual(0);
        
        const avgRating = parseFloat(firstItem.avgRating);
        expect(avgRating).toBeGreaterThanOrEqual(0);
        expect(avgRating).toBeLessThanOrEqual(5);
      }
    });
  });
});

describe("Admin Notifications", () => {
  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  describe("getAdminUsers", () => {
    it("should return list of admin users", async () => {
      const admins = await getAdminUsers();
      
      expect(Array.isArray(admins)).toBe(true);
      
      if (admins.length > 0) {
        const firstAdmin = admins[0];
        expect(firstAdmin).toHaveProperty("id");
        expect(firstAdmin).toHaveProperty("role");
        expect(firstAdmin.role).toBe("admin");
      }
    });
  });

  describe("createAdminNotification", () => {
    it("should create notification for all admins", async () => {
      const notifications = await createAdminNotification({
        type: "system",
        title: "Test Notification",
        content: "This is a test notification for admins",
      });
      
      expect(Array.isArray(notifications)).toBe(true);
      
      const admins = await getAdminUsers();
      expect(notifications.length).toBe(admins.length);
      
      if (notifications.length > 0) {
        const firstNotification = notifications[0];
        expect(firstNotification).toHaveProperty("id");
        expect(firstNotification).toHaveProperty("userId");
        expect(firstNotification).toHaveProperty("type");
        expect(firstNotification).toHaveProperty("title");
        expect(firstNotification).toHaveProperty("content");
        expect(firstNotification.type).toBe("system");
        expect(firstNotification.title).toBe("Test Notification");
      }
    });
  });

  describe("notifyAdminsNewComment", () => {
    it("should notify admins about new comment", async () => {
      const notifications = await notifyAdminsNewComment({
        commentId: 1,
        entityType: "knowledge",
        entityId: 1,
        userName: "Test User",
        content: "This is a test comment",
      });
      
      expect(Array.isArray(notifications)).toBe(true);
      
      if (notifications.length > 0) {
        const firstNotification = notifications[0];
        expect(firstNotification.type).toBe("comment");
        expect(firstNotification.title).toBe("تعليق جديد");
        expect(firstNotification.content).toContain("Test User");
        expect(firstNotification.relatedId).toBe(1);
        expect(firstNotification.relatedType).toBe("comment");
      }
    });
  });

  describe("notifyAdminsLowRating", () => {
    it("should notify admins about low rating", async () => {
      const notifications = await notifyAdminsLowRating({
        ratingId: 1,
        entityType: "knowledge",
        entityId: 1,
        rating: 2,
        userName: "Test User",
      });
      
      expect(Array.isArray(notifications)).toBe(true);
      
      if (notifications.length > 0) {
        const firstNotification = notifications[0];
        expect(firstNotification.type).toBe("alert");
        expect(firstNotification.title).toBe("تقييم منخفض");
        expect(firstNotification.content).toContain("2 نجوم");
        expect(firstNotification.relatedId).toBe(1);
        expect(firstNotification.relatedType).toBe("rating");
      }
    });
  });

  describe("notifyAdminsCommentPendingApproval", () => {
    it("should notify admins about comment pending approval", async () => {
      const notifications = await notifyAdminsCommentPendingApproval({
        commentId: 1,
        entityType: "knowledge",
        entityId: 1,
        userName: "Test User",
        content: "This comment needs approval",
      });
      
      expect(Array.isArray(notifications)).toBe(true);
      
      if (notifications.length > 0) {
        const firstNotification = notifications[0];
        expect(firstNotification.type).toBe("approval");
        expect(firstNotification.title).toBe("تعليق بانتظار الموافقة");
        expect(firstNotification.content).toContain("Test User");
        expect(firstNotification.relatedId).toBe(1);
        expect(firstNotification.relatedType).toBe("comment");
      }
    });
  });
});
