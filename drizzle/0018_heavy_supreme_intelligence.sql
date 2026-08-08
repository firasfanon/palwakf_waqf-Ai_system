CREATE TABLE `classification_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fetched_content_id` int NOT NULL,
	`rating` enum('positive','negative') NOT NULL,
	`feedback` text,
	`rated_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classification_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `classification_ratings` ADD CONSTRAINT `classification_ratings_fetched_content_id_fetched_content_id_fk` FOREIGN KEY (`fetched_content_id`) REFERENCES `fetched_content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classification_ratings` ADD CONSTRAINT `classification_ratings_rated_by_users_id_fk` FOREIGN KEY (`rated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `fetched_content_idx` ON `classification_ratings` (`fetched_content_id`);--> statement-breakpoint
CREATE INDEX `rating_idx` ON `classification_ratings` (`rating`);--> statement-breakpoint
CREATE INDEX `rated_by_idx` ON `classification_ratings` (`rated_by`);