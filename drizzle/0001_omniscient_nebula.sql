CREATE TABLE `land_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`author` varchar(200),
	`type` enum('ottoman_record','british_mandate','jordanian_law','israeli_document','palestinian_law','court_ruling','historical_map','land_registry','waqf_deed','other') NOT NULL,
	`region` varchar(200) NOT NULL,
	`year` int NOT NULL,
	`source_url` varchar(1000),
	`pdf_url` varchar(1000),
	`tags` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `land_references_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `land_references` ADD CONSTRAINT `land_references_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `type_idx` ON `land_references` (`type`);--> statement-breakpoint
CREATE INDEX `region_idx` ON `land_references` (`region`);--> statement-breakpoint
CREATE INDEX `year_idx` ON `land_references` (`year`);--> statement-breakpoint
CREATE INDEX `title_idx` ON `land_references` (`title`);