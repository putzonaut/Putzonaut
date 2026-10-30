CREATE TABLE `crew_recovery` (
	`household_id` text PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`source_revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crew_recovery_events` (
	`household_id` text NOT NULL,
	`event_id` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crew_recovery_event` ON `crew_recovery_events` (`household_id`,`event_id`);