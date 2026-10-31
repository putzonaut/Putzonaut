CREATE TABLE `push_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`member_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`hour` integer NOT NULL,
	`last_day` text,
	`last_status` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `push_member` ON `push_devices` (`member_id`);--> statement-breakpoint
CREATE TABLE `push_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
