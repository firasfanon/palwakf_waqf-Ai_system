/**
 * Publish Scheduler - Cron Job
 * 
 * يتحقق كل دقيقة من الأقسام المجدولة للنشر أو إلغاء النشر
 * ويقوم بتحديث حالتها تلقائياً
 */

import {
  getScheduledSectionsToPublish,
  getPublishedSectionsToUnpublish,
  updateHomeSection,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

/**
 * Check and publish scheduled sections
 */
export async function checkScheduledSections() {
  try {
    // Get sections that need to be published
    const sectionsToPublish = await getScheduledSectionsToPublish();
    
    // Get sections that need to be unpublished
    const sectionsToUnpublish = await getPublishedSectionsToUnpublish();

    let publishedCount = 0;
    let unpublishedCount = 0;

    // Publish scheduled sections
    for (const section of sectionsToPublish) {
      await publishSection(section.id, section.title);
      publishedCount++;
    }

    // Unpublish expired sections
    for (const section of sectionsToUnpublish) {
      await unpublishSection(section.id, section.title);
      unpublishedCount++;
    }

    // Log results
    if (publishedCount > 0 || unpublishedCount > 0) {
      console.log(`[Publish Scheduler] Published: ${publishedCount}, Unpublished: ${unpublishedCount}`);
      
      // Notify owner if there were changes
      await notifyOwner({
        title: "تحديث الأقسام التلقائي",
        content: `تم نشر ${publishedCount} قسم وإلغاء نشر ${unpublishedCount} قسم تلقائياً.`,
      });
    }

    return {
      success: true,
      publishedCount,
      unpublishedCount,
    };
  } catch (error: any) {
    console.error("[Publish Scheduler] Error:", error);
    
    // Notify owner of error
    await notifyOwner({
      title: "خطأ في الجدولة التلقائية",
      content: `حدث خطأ أثناء تحديث الأقسام: ${error.message}`,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Publish a section
 */
async function publishSection(sectionId: number, sectionTitle: string) {
  try {
    await updateHomeSection(sectionId, {
      scheduledStatus: "published",
      isVisible: 1,
    });

    console.log(`[Publish Scheduler] Published section: ${sectionTitle} (ID: ${sectionId})`);
  } catch (error: any) {
    console.error(`[Publish Scheduler] Failed to publish section ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Unpublish a section
 */
async function unpublishSection(sectionId: number, sectionTitle: string) {
  try {
    await updateHomeSection(sectionId, {
      scheduledStatus: "unpublished",
      isVisible: 0,
    });

    console.log(`[Publish Scheduler] Unpublished section: ${sectionTitle} (ID: ${sectionId})`);
  } catch (error: any) {
    console.error(`[Publish Scheduler] Failed to unpublish section ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Start the cron job (runs every minute)
 */
export function startPublishScheduler() {
  if (!ENV.publishSchedulerEnabled) {
    console.log("[Publish Scheduler] Disabled by configuration");
    return;
  }

  console.log("[Publish Scheduler] Starting cron job...");
  
  // Run immediately on startup
  checkScheduledSections();
  
  // Then run every minute
  setInterval(async () => {
    await checkScheduledSections();
  }, 60 * 1000); // 60 seconds
}
