CREATE TABLE `app_store_game_chart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`app_id` text NOT NULL,
	`bundle_id` text,
	`app_name` text NOT NULL,
	`developer_name` text NOT NULL,
	`developer_url` text,
	`store_url` text NOT NULL,
	`artwork_url` text,
	`summary` text,
	`price_label` text,
	`price_amount` text,
	`currency_code` text,
	`category_id` text,
	`category_name` text,
	`release_date` text,
	`raw_item_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `app_store_game_chart_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_app_store_game_chart_items_snapshot_rank` ON `app_store_game_chart_items` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_app_store_game_chart_items_snapshot_app` ON `app_store_game_chart_items` (`snapshot_id`,`app_id`);--> statement-breakpoint
CREATE INDEX `idx_app_store_game_chart_items_snapshot` ON `app_store_game_chart_items` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_app_store_game_chart_items_app` ON `app_store_game_chart_items` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_app_store_game_chart_items_bundle` ON `app_store_game_chart_items` (`bundle_id`);--> statement-breakpoint
CREATE INDEX `idx_app_store_game_chart_items_name` ON `app_store_game_chart_items` (`app_name`);--> statement-breakpoint
CREATE TABLE `app_store_game_chart_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chart_type` text NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`snapshot_hour` text NOT NULL,
	`fetched_at` text NOT NULL,
	`source_url` text NOT NULL,
	`feed_title` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`error_text` text,
	`raw_payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_app_store_game_chart_snapshots_unique` ON `app_store_game_chart_snapshots` (`chart_type`,`country_code`,`snapshot_hour`);--> statement-breakpoint
CREATE INDEX `idx_app_store_game_chart_snapshots_latest` ON `app_store_game_chart_snapshots` (`chart_type`,`country_code`,`snapshot_hour`);--> statement-breakpoint
CREATE INDEX `idx_app_store_game_chart_snapshots_status` ON `app_store_game_chart_snapshots` (`status`,`snapshot_hour`);