ALTER TABLE `home_sections` MODIFY COLUMN `displayOrder` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `home_sections` ADD `key` varchar(100);--> statement-breakpoint
ALTER TABLE `home_sections` ADD `order` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `home_sections` ADD `type` enum('hero','features','stats','cta','testimonials','faq','custom') DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE `home_sections` ADD `isVisible` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `home_sections` ADD `maxItems` int;--> statement-breakpoint
ALTER TABLE `home_sections` ADD `config` text;