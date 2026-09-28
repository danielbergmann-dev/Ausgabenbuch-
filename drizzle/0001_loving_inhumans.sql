CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`cents` integer NOT NULL,
	`created_at` text NOT NULL,
	`cancelled_at` text,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
