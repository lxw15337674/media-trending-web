CREATE TABLE `apple_music_chart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`track_name` text NOT NULL,
	`artist_names` text NOT NULL,
	`apple_song_id` text NOT NULL,
	`apple_song_url` text NOT NULL,
	`duration_ms` integer,
	`thumbnail_url` text,
	`raw_item_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `apple_music_chart_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_apple_music_chart_items_snapshot_rank` ON `apple_music_chart_items` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_apple_music_chart_items_snapshot_song` ON `apple_music_chart_items` (`snapshot_id`,`apple_song_id`);--> statement-breakpoint
CREATE INDEX `idx_apple_music_chart_items_snapshot` ON `apple_music_chart_items` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_apple_music_chart_items_song` ON `apple_music_chart_items` (`apple_song_id`);--> statement-breakpoint
CREATE INDEX `idx_apple_music_chart_items_track` ON `apple_music_chart_items` (`track_name`);--> statement-breakpoint
CREATE TABLE `apple_music_chart_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chart_type` text NOT NULL,
	`period_type` text NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`chart_end_date` text NOT NULL,
	`fetched_at` text NOT NULL,
	`source_url` text NOT NULL,
	`playlist_id` text NOT NULL,
	`playlist_slug` text NOT NULL,
	`playlist_title` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`error_text` text,
	`raw_payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_apple_music_chart_snapshots_unique` ON `apple_music_chart_snapshots` (`chart_type`,`period_type`,`country_code`,`chart_end_date`);--> statement-breakpoint
CREATE INDEX `idx_apple_music_chart_snapshots_latest` ON `apple_music_chart_snapshots` (`chart_type`,`period_type`,`country_code`,`chart_end_date`);--> statement-breakpoint
CREATE INDEX `idx_apple_music_chart_snapshots_status` ON `apple_music_chart_snapshots` (`status`,`chart_end_date`);