CREATE TABLE `fetch_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_id` int NOT NULL,
	`status` enum('running','success','partial','failed') NOT NULL,
	`items_fetched` int NOT NULL DEFAULT 0,
	`items_approved` int NOT NULL DEFAULT 0,
	`items_rejected` int NOT NULL DEFAULT 0,
	`errors` text,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `fetch_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fetched_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_id` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`author` varchar(200),
	`url` varchar(1000),
	`pdf_url` varchar(1000),
	`category` enum('law','jurisprudence','majalla','historical','administrative','reference'),
	`tags` text,
	`relevance_score` int,
	`status` enum('pending','approved','rejected','processing') NOT NULL DEFAULT 'pending',
	`fetched_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`reviewed_by` int,
	CONSTRAINT `fetched_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('wikipedia','rss','scraper','pdf_url','api') NOT NULL,
	`url` varchar(1000) NOT NULL,
	`config` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`fetch_frequency` enum('manual','daily','weekly','monthly') NOT NULL DEFAULT 'manual',
	`last_fetch_at` timestamp,
	`items_count` int NOT NULL DEFAULT 0,
	`success_count` int NOT NULL DEFAULT 0,
	`error_count` int NOT NULL DEFAULT 0,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fetch_logs` ADD CONSTRAINT `fetch_logs_source_id_knowledge_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD CONSTRAINT `fetched_content_source_id_knowledge_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fetched_content` ADD CONSTRAINT `fetched_content_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledge_sources` ADD CONSTRAINT `knowledge_sources_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `source_idx` ON `fetch_logs` (`source_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `fetch_logs` (`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `fetch_logs` (`started_at`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `fetched_content` (`source_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `fetched_content` (`status`);--> statement-breakpoint
CREATE INDEX `relevance_idx` ON `fetched_content` (`relevance_score`);--> statement-breakpoint
CREATE INDEX `fetched_at_idx` ON `fetched_content` (`fetched_at`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `knowledge_sources` (`type`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `knowledge_sources` (`is_active`);