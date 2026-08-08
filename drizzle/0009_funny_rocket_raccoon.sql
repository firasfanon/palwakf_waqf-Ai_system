CREATE TABLE `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`name_ar` varchar(200) NOT NULL,
	`description` text,
	`description_ar` text,
	`type` enum('landing','about','services','portfolio','blog','documentation','dashboard','ecommerce','educational','nonprofit') NOT NULL,
	`sections` text NOT NULL,
	`layout` enum('full-width','centered','two-columns','three-columns','grid','sidebar') DEFAULT 'centered',
	`color_scheme` varchar(100) DEFAULT 'blue',
	`thumbnail` varchar(1000),
	`config` text,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`usage_count` int NOT NULL DEFAULT 0,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `content_templates` ADD CONSTRAINT `content_templates_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `type_idx` ON `content_templates` (`type`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `content_templates` (`is_active`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `content_templates` (`created_by`);