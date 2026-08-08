ALTER TABLE `fetched_content` ADD `content_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `canonical_url` varchar(1000);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `version_group` varchar(64);--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `version_no` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `is_duplicate` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD `duplicate_of` int;--> statement-breakpoint
CREATE INDEX `idx_content_hash` ON `fetched_content` (`content_hash`);--> statement-breakpoint
CREATE INDEX `idx_version_group` ON `fetched_content` (`version_group`);