CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchlist_id` int NOT NULL,
	`source_item_id` int NOT NULL,
	`matched_on` varchar(32),
	`score` int DEFAULT 0,
	`status` varchar(16) DEFAULT 'new',
	`created_at` timestamp DEFAULT now(),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `alerts_watchlist_source_unique` UNIQUE(`watchlist_id`,`source_item_id`)
);
--> statement-breakpoint
CREATE TABLE `watchlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`is_active` tinyint DEFAULT 1,
	`query` text NOT NULL,
	`categories` text,
	`source_types` text,
	`statuses` varchar(100) DEFAULT 'pending,approved',
	`created_by` varchar(255),
	`created_at` timestamp DEFAULT now(),
	`updated_at` timestamp DEFAULT now() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_watchlist_id_watchlists_id_fk` FOREIGN KEY (`watchlist_id`) REFERENCES `watchlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_source_item_id_fetched_content_id_fk` FOREIGN KEY (`source_item_id`) REFERENCES `fetched_content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `watchlists_is_active` ON `watchlists` (`is_active`);--> statement-breakpoint
CREATE INDEX `watchlists_created_by` ON `watchlists` (`created_by`);