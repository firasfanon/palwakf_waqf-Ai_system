CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int NOT NULL,
	`content` text NOT NULL,
	`parent_id` int,
	`is_approved` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int NOT NULL,
	`rating` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_entity_rating` UNIQUE(`user_id`,`entity_type`,`entity_id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('announcement','update','maintenance','alert','reply','comment','approval','system') NOT NULL;--> statement-breakpoint
ALTER TABLE `suggested_questions` MODIFY COLUMN `display_order` int NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `related_id` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `related_type` varchar(50);--> statement-breakpoint
ALTER TABLE `notifications` ADD `is_read` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `comment_user_idx` ON `comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `comment_entity_idx` ON `comments` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `comment_approved_idx` ON `comments` (`is_approved`);--> statement-breakpoint
CREATE INDEX `rating_user_idx` ON `ratings` (`user_id`);--> statement-breakpoint
CREATE INDEX `rating_entity_idx` ON `ratings` (`entity_type`,`entity_id`);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;