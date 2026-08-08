ALTER TABLE `fetched_content` ADD `ai_category` enum('law','jurisprudence','majalla','historical','administrative','reference');--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `ai_keywords` text;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `ai_summary` text;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `ai_confidence` decimal(5,4);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `ai_reasoning` text;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `processed_at` timestamp;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `processing_version` varchar(50);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `processing_error` text;