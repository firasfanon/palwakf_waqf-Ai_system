DROP TABLE `land_references`;--> statement-breakpoint
DROP TABLE `waqf_categories`;--> statement-breakpoint
ALTER TABLE `waqf_properties` DROP FOREIGN KEY `waqf_properties_categoryId_waqf_categories_id_fk`;
--> statement-breakpoint
DROP INDEX `category_idx` ON `waqf_properties`;--> statement-breakpoint
ALTER TABLE `waqf_properties` DROP COLUMN `categoryId`;