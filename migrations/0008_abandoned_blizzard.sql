CREATE TABLE `google_play_game_chart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`app_id` text NOT NULL,
	`app_name` text NOT NULL,
	`developer_name` text,
	`store_url` text NOT NULL,
	`artwork_url` text,
	`rating_text` text,
	`rating_value` text,
	`price_text` text,
	`primary_genre` text,
	`genre_summary` text,
	`raw_item_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `google_play_game_chart_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_google_play_game_chart_items_snapshot_rank` ON `google_play_game_chart_items` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_google_play_game_chart_items_snapshot_app` ON `google_play_game_chart_items` (`snapshot_id`,`app_id`);--> statement-breakpoint
CREATE INDEX `idx_google_play_game_chart_items_snapshot` ON `google_play_game_chart_items` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_google_play_game_chart_items_app` ON `google_play_game_chart_items` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_google_play_game_chart_items_name` ON `google_play_game_chart_items` (`app_name`);--> statement-breakpoint
CREATE TABLE `google_play_game_chart_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chart_type` text NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`snapshot_hour` text NOT NULL,
	`fetched_at` text NOT NULL,
	`source_url` text NOT NULL,
	`page_title` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`error_text` text,
	`raw_payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_google_play_game_chart_snapshots_unique` ON `google_play_game_chart_snapshots` (`chart_type`,`country_code`,`snapshot_hour`);--> statement-breakpoint
CREATE INDEX `idx_google_play_game_chart_snapshots_latest` ON `google_play_game_chart_snapshots` (`chart_type`,`country_code`,`snapshot_hour`);--> statement-breakpoint
CREATE INDEX `idx_google_play_game_chart_snapshots_status` ON `google_play_game_chart_snapshots` (`status`,`snapshot_hour`);