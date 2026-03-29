CREATE TABLE `tiktok_hashtag_hourly_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_hour` text NOT NULL,
	`batch_status` text DEFAULT 'pending' NOT NULL,
	`source_name` text DEFAULT 'tiktok-creative-center-hashtag' NOT NULL,
	`generated_at` text,
	`target_country_count` integer DEFAULT 0 NOT NULL,
	`success_country_count` integer DEFAULT 0 NOT NULL,
	`failed_country_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_hashtag_hourly_batches_snapshot_hour` ON `tiktok_hashtag_hourly_batches` (`snapshot_hour`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_hashtag_hourly_batches_status_hour` ON `tiktok_hashtag_hourly_batches` (`batch_status`,`snapshot_hour`);--> statement-breakpoint
CREATE TABLE `tiktok_hashtag_hourly_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`hashtag_id` text NOT NULL,
	`hashtag_name` text NOT NULL,
	`publish_count` integer,
	`video_views` integer,
	`rank_diff` integer,
	`rank_diff_type` integer,
	`industry_name` text,
	`detail_page_url` text NOT NULL,
	`trend_points_json` text,
	`creator_preview_json` text,
	`detail_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `tiktok_hashtag_hourly_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_hashtag_hourly_items_snapshot_rank` ON `tiktok_hashtag_hourly_items` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_hashtag_hourly_items_snapshot_hashtag` ON `tiktok_hashtag_hourly_items` (`snapshot_id`,`hashtag_id`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_hashtag_hourly_items_snapshot` ON `tiktok_hashtag_hourly_items` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_hashtag_hourly_items_hashtag` ON `tiktok_hashtag_hourly_items` (`hashtag_name`);--> statement-breakpoint
CREATE TABLE `tiktok_hashtag_hourly_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL,
	`status` text NOT NULL,
	`source_url` text NOT NULL,
	`list_api_url` text,
	`item_count` integer DEFAULT 0 NOT NULL,
	`error_text` text,
	`warnings_json` text,
	`timings_json` text,
	`raw_payload` text,
	FOREIGN KEY (`batch_id`) REFERENCES `tiktok_hashtag_hourly_batches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_hashtag_hourly_snapshots_batch_country_unique` ON `tiktok_hashtag_hourly_snapshots` (`batch_id`,`country_code`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_hashtag_hourly_snapshots_batch_country` ON `tiktok_hashtag_hourly_snapshots` (`batch_id`,`country_code`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_hashtag_hourly_snapshots_batch_status` ON `tiktok_hashtag_hourly_snapshots` (`batch_id`,`status`);--> statement-breakpoint
CREATE TABLE `tiktok_video_hourly_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_hour` text NOT NULL,
	`batch_status` text DEFAULT 'pending' NOT NULL,
	`source_name` text DEFAULT 'tiktok-creative-center-videos' NOT NULL,
	`generated_at` text,
	`target_scope_count` integer DEFAULT 0 NOT NULL,
	`success_scope_count` integer DEFAULT 0 NOT NULL,
	`failed_scope_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_video_hourly_batches_snapshot_hour` ON `tiktok_video_hourly_batches` (`snapshot_hour`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_video_hourly_batches_status_hour` ON `tiktok_video_hourly_batches` (`batch_status`,`snapshot_hour`);--> statement-breakpoint
CREATE TABLE `tiktok_video_hourly_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`video_id` text NOT NULL,
	`item_id` text NOT NULL,
	`item_url` text NOT NULL,
	`title` text NOT NULL,
	`cover_url` text,
	`duration_seconds` integer,
	`region_name` text,
	`raw_item_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `tiktok_video_hourly_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_video_hourly_items_snapshot_rank` ON `tiktok_video_hourly_items` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_video_hourly_items_snapshot_video` ON `tiktok_video_hourly_items` (`snapshot_id`,`video_id`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_video_hourly_items_snapshot` ON `tiktok_video_hourly_items` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_video_hourly_items_video` ON `tiktok_video_hourly_items` (`video_id`);--> statement-breakpoint
CREATE TABLE `tiktok_video_hourly_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`period` integer NOT NULL,
	`order_by` text NOT NULL,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL,
	`status` text NOT NULL,
	`source_url` text NOT NULL,
	`list_api_url` text,
	`page_count` integer DEFAULT 0 NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`total_count` integer DEFAULT 0 NOT NULL,
	`error_text` text,
	`warnings_json` text,
	`timings_json` text,
	`raw_payload` text,
	FOREIGN KEY (`batch_id`) REFERENCES `tiktok_video_hourly_batches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tiktok_video_hourly_snapshots_batch_scope_unique` ON `tiktok_video_hourly_snapshots` (`batch_id`,`country_code`,`period`,`order_by`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_video_hourly_snapshots_batch_scope` ON `tiktok_video_hourly_snapshots` (`batch_id`,`country_code`,`period`,`order_by`);--> statement-breakpoint
CREATE INDEX `idx_tiktok_video_hourly_snapshots_batch_status` ON `tiktok_video_hourly_snapshots` (`batch_id`,`status`);