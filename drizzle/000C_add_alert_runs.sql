-- Create alert_runs table for tracking scheduled runs
CREATE TABLE `alert_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `started_at` varchar(19) NOT NULL,
  `finished_at` varchar(19),
  `status` varchar(16) NOT NULL DEFAULT 'running',
  `created_count` int NOT NULL DEFAULT 0,
  `error_message` text,
  `trigger` varchar(16) NOT NULL DEFAULT 'manual',
  `lock_key` varchar(64) NOT NULL DEFAULT 'watchlists_cron',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_trigger` (`trigger`),
  KEY `idx_created_at` (`created_at`)
);

-- Create scheduler_locks table for distributed locking
CREATE TABLE `scheduler_locks` (
  `lock_key` varchar(64) NOT NULL,
  `locked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`lock_key`),
  KEY `idx_expires_at` (`expires_at`)
);
