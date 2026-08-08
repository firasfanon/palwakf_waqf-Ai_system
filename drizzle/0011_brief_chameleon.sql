CREATE TABLE `page_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`page_name` varchar(100) NOT NULL,
	`title` varchar(200),
	`description` text,
	`meta_keywords` text,
	`og_image` varchar(500),
	`custom_css` text,
	`custom_js` text,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_settings_page_name_unique` UNIQUE(`page_name`)
);
