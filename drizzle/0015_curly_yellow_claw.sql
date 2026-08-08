ALTER TABLE `fetched_content` ADD `doc_date` varchar(10);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `doc_number` varchar(64);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `issuer` varchar(255);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `doc_type` varchar(32);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `language` varchar(8);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `page_count` int;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `extracted_at` varchar(19);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `extraction_version` varchar(32);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `extraction_error` text;