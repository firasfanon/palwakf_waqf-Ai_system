CREATE TABLE `knowledge_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_item_id` int NOT NULL,
	`chunk_no` int NOT NULL,
	`chunk_text` text NOT NULL,
	`chunk_hash` varchar(64) NOT NULL,
	`ai_category` varchar(32),
	`tags` text,
	`source_type` varchar(32),
	`source_id` int,
	`canonical_url` varchar(1000),
	`created_at` varchar(19) NOT NULL,
	CONSTRAINT `knowledge_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_kc_item_no` ON `knowledge_chunks` (`source_item_id`,`chunk_no`);--> statement-breakpoint
CREATE INDEX `idx_kc_hash` ON `knowledge_chunks` (`chunk_hash`);--> statement-breakpoint
CREATE INDEX `idx_kc_source_type` ON `knowledge_chunks` (`source_type`);