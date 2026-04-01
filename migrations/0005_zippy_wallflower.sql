CREATE TABLE `spotify_chart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`previous_rank` integer,
	`peak_rank` integer,
	`appearances_on_chart` integer,
	`track_name` text NOT NULL,
	`artist_names` text NOT NULL,
	`spotify_track_id` text,
	`spotify_track_uri` text,
	`spotify_track_url` text,
	`album_name` text,
	`thumbnail_url` text,
	`stream_count` integer,
	`raw_item_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `spotify_chart_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_spotify_chart_items_snapshot_rank` ON `spotify_chart_items` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_spotify_chart_items_snapshot_track` ON `spotify_chart_items` (`snapshot_id`,`spotify_track_id`);--> statement-breakpoint
CREATE INDEX `idx_spotify_chart_items_snapshot` ON `spotify_chart_items` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_spotify_chart_items_track` ON `spotify_chart_items` (`track_name`);--> statement-breakpoint
CREATE TABLE `spotify_chart_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chart_type` text NOT NULL,
	`period_type` text NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`chart_end_date` text NOT NULL,
	`fetched_at` text NOT NULL,
	`source_url` text NOT NULL,
	`chart_alias` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`error_text` text,
	`raw_payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_spotify_chart_snapshots_unique` ON `spotify_chart_snapshots` (`chart_type`,`period_type`,`country_code`,`chart_end_date`);--> statement-breakpoint
CREATE INDEX `idx_spotify_chart_snapshots_latest` ON `spotify_chart_snapshots` (`chart_type`,`period_type`,`country_code`,`chart_end_date`);--> statement-breakpoint
CREATE INDEX `idx_spotify_chart_snapshots_status` ON `spotify_chart_snapshots` (`status`,`chart_end_date`);