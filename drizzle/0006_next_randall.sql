CREATE TABLE `waqf_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`nameEn` varchar(200),
	`description` text,
	`descriptionEn` text,
	`color` varchar(50) DEFAULT '#3b82f6',
	`icon` varchar(100),
	`order` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waqf_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `waqf_categories` ADD CONSTRAINT `waqf_categories_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `waqf_category_order_idx` ON `waqf_categories` (`order`);--> statement-breakpoint
CREATE INDEX `waqf_category_active_idx` ON `waqf_categories` (`isActive`);