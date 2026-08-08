CREATE TABLE `alert_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`started_at` varchar(19) NOT NULL,
	`finished_at` varchar(19),
	`status` varchar(16) NOT NULL DEFAULT 'running',
	`created_count` int NOT NULL DEFAULT 0,
	`error_message` text,
	`trigger` varchar(16) NOT NULL DEFAULT 'manual',
	`lock_key` varchar(64) NOT NULL DEFAULT 'watchlists_cron',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_locks` (
	`lock_key` varchar(64) NOT NULL,
	`locked_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `scheduler_locks_lock_key` PRIMARY KEY(`lock_key`)
);
--> statement-breakpoint
CREATE INDEX `idx_status` ON `alert_runs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_trigger` ON `alert_runs` (`trigger`);--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `alert_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_expires_at` ON `scheduler_locks` (`expires_at`);