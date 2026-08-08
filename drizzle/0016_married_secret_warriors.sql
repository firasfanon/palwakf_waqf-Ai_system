CREATE TABLE `cached_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question_normalized` varchar(1000) NOT NULL,
	`question_original` text NOT NULL,
	`answer` text NOT NULL,
	`sources` text,
	`category` enum('general','legal','jurisprudence','administrative','historical') NOT NULL DEFAULT 'general',
	`hit_count` int NOT NULL DEFAULT 0,
	`rating` decimal(3,2),
	`rating_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_used_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `cached_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `cached_responses_question_normalized_unique` UNIQUE(`question_normalized`)
);
--> statement-breakpoint
CREATE INDEX `question_idx` ON `cached_responses` (`question_normalized`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `cached_responses` (`category`);--> statement-breakpoint
CREATE INDEX `hit_count_idx` ON `cached_responses` (`hit_count`);--> statement-breakpoint
CREATE INDEX `last_used_idx` ON `cached_responses` (`last_used_at`);