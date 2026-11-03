CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`household_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text,
	`request_key` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `memberships`(`member_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `memberships`(`member_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_request` ON `messages` (`sender_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `messages_pair` ON `messages` (`sender_id`,`recipient_id`,`id`);--> statement-breakpoint
CREATE INDEX `messages_unread` ON `messages` (`recipient_id`,`read_at`,`sender_id`);