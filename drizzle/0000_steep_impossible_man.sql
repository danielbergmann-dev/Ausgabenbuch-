CREATE TABLE `meals` (
	`date` text NOT NULL,
	`person_id` text NOT NULL,
	`cents` integer NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`date`, `person_id`),
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
