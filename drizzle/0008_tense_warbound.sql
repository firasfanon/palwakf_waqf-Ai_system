ALTER TABLE `home_section_items` MODIFY COLUMN `displayOrder` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `home_sections` MODIFY COLUMN `key` varchar(100);--> statement-breakpoint
ALTER TABLE `home_sections` MODIFY COLUMN `displayOrder` int NOT NULL DEFAULT 0;