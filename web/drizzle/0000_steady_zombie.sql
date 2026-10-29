CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`member_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text NOT NULL,
	`request_key` text,
	`payload` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_household_time` ON `events` (`household_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_request` ON `events` (`member_id`,`request_key`);--> statement-breakpoint
CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`account_id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`member_id` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `memberships_household` ON `memberships` (`household_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_member` ON `memberships` (`member_id`);