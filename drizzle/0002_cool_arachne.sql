CREATE TABLE `waqf_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`color` varchar(50),
	`order` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waqf_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `waqf_properties` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `waqf_categories` ADD CONSTRAINT `waqf_categories_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_idx` ON `waqf_categories` (`order`);--> statement-breakpoint
ALTER TABLE `waqf_properties` ADD CONSTRAINT `waqf_properties_categoryId_waqf_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `waqf_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `category_idx` ON `waqf_properties` (`categoryId`);