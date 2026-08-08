CREATE TABLE `fetched_content_review_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fetched_content_id` int NOT NULL,
	`event_type` enum('route','extraction','classification','decision','approval','rejection','manual_update','bulk_action') NOT NULL,
	`event_source` enum('system','ai','reviewer','admin') NOT NULL DEFAULT 'system',
	`route` varchar(32),
	`previous_status` enum('pending','approved','rejected','processing'),
	`next_status` enum('pending','approved','rejected','processing'),
	`confidence` decimal(5,4),
	`notes` text,
	`payload` text,
	`actor_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
ALTER TABLE `fetched_content_review_events` ADD CONSTRAINT `fetched_content_review_events_fetched_content_id_fetched_content_id_fk` FOREIGN KEY (`fetched_content_id`) REFERENCES `fetched_content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fetched_content_review_events` ADD CONSTRAINT `fetched_content_review_events_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `review_event_content_idx` ON `fetched_content_review_events` (`fetched_content_id`);--> statement-breakpoint
CREATE INDEX `review_event_type_idx` ON `fetched_content_review_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `review_event_actor_idx` ON `fetched_content_review_events` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `review_event_created_idx` ON `fetched_content_review_events` (`created_at`);