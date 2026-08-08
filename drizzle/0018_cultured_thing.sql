CREATE TABLE `watchlist_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`query` text NOT NULL,
	`categories` text,
	`source_types` text,
	`statuses` varchar(100) DEFAULT 'pending,approved',
	`created_by` varchar(255) NOT NULL,
	`is_public` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT now(),
	`updated_at` timestamp DEFAULT now() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlist_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `templates_created_by` ON `watchlist_templates` (`created_by`);--> statement-breakpoint
CREATE INDEX `templates_is_public` ON `watchlist_templates` (`is_public`);