CREATE TABLE `home_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`order` int NOT NULL,
	`backgroundColor` varchar(50) DEFAULT '#ffffff',
	`textColor` varchar(50) DEFAULT '#000000',
	`layout` enum('full-width','centered','two-columns','three-columns','grid') DEFAULT 'centered',
	`imageUrl` varchar(1000),
	`ctaText` varchar(200),
	`ctaLink` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`publishAt` timestamp,
	`unpublishAt` timestamp,
	`scheduledStatus` enum('draft','scheduled','published','unpublished') NOT NULL DEFAULT 'draft',
	`templateId` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `home_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageName` varchar(100) NOT NULL,
	`pageTitle` varchar(500) NOT NULL,
	`pageDescription` text,
	`metaKeywords` text,
	`showInNav` boolean NOT NULL DEFAULT true,
	`navOrder` int NOT NULL DEFAULT 0,
	`navLabel` varchar(200),
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_settings_pageName_unique` UNIQUE(`pageName`)
);
--> statement-breakpoint
CREATE TABLE `section_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`category` enum('welcome','about','features','statistics','faq','contact','partners','news','team','services','custom') NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`backgroundColor` varchar(50) DEFAULT '#ffffff',
	`textColor` varchar(50) DEFAULT '#000000',
	`layout` enum('full-width','centered','two-columns','three-columns','grid') DEFAULT 'centered',
	`imageUrl` varchar(1000),
	`ctaText` varchar(200),
	`ctaLink` varchar(500),
	`isPublic` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `section_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `table_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableName` varchar(100) NOT NULL,
	`headerAlignment` enum('left','center','right') NOT NULL DEFAULT 'center',
	`contentAlignment` enum('left','center','right') NOT NULL DEFAULT 'right',
	`rowsPerPage` int NOT NULL DEFAULT 10,
	`showPagination` boolean NOT NULL DEFAULT true,
	`columnWidths` text,
	`sortable` boolean NOT NULL DEFAULT true,
	`searchable` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `table_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `table_settings_tableName_unique` UNIQUE(`tableName`)
);
--> statement-breakpoint
ALTER TABLE `home_sections` ADD CONSTRAINT `home_sections_templateId_section_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `section_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `home_sections` ADD CONSTRAINT `home_sections_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_settings` ADD CONSTRAINT `page_settings_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_templates` ADD CONSTRAINT `section_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `table_settings` ADD CONSTRAINT `table_settings_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `section_order_idx` ON `home_sections` (`order`);--> statement-breakpoint
CREATE INDEX `section_status_idx` ON `home_sections` (`scheduledStatus`);--> statement-breakpoint
CREATE INDEX `section_publish_at_idx` ON `home_sections` (`publishAt`);--> statement-breakpoint
CREATE INDEX `page_name_idx` ON `page_settings` (`pageName`);--> statement-breakpoint
CREATE INDEX `template_category_idx` ON `section_templates` (`category`);--> statement-breakpoint
CREATE INDEX `template_name_idx` ON `section_templates` (`name`);--> statement-breakpoint
CREATE INDEX `table_name_idx` ON `table_settings` (`tableName`);