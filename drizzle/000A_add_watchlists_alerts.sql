-- Watchlists table
CREATE TABLE IF NOT EXISTS `watchlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`query` text NOT NULL,
	`categories` text,
	`source_types` text,
	`statuses` varchar(100) DEFAULT 'pending,approved',
	`created_by` varchar(255),
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlists_id` PRIMARY KEY(`id`),
	INDEX `watchlists_is_active` (`is_active`),
	INDEX `watchlists_created_by` (`created_by`)
);
--> statement-breakpoint

-- Alerts table
CREATE TABLE IF NOT EXISTS `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchlist_id` int NOT NULL,
	`source_item_id` int NOT NULL,
	`matched_on` varchar(32),
	`score` int DEFAULT 0,
	`status` varchar(16) DEFAULT 'new',
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `alerts_watchlist_id_fk` FOREIGN KEY (`watchlist_id`) REFERENCES `watchlists`(`id`) ON DELETE CASCADE,
	CONSTRAINT `alerts_source_item_id_fk` FOREIGN KEY (`source_item_id`) REFERENCES `fetched_content`(`id`) ON DELETE CASCADE,
	UNIQUE `alerts_watchlist_source_unique` (`watchlist_id`, `source_item_id`)
);
--> statement-breakpoint
