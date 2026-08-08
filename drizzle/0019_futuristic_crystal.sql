CREATE TABLE `favorite_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favorite_conversations` ADD CONSTRAINT `favorite_conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_conversations` ADD CONSTRAINT `favorite_conversations_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `favorite_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `conversation_idx` ON `favorite_conversations` (`conversationId`);--> statement-breakpoint
CREATE INDEX `unique_favorite` ON `favorite_conversations` (`userId`,`conversationId`);