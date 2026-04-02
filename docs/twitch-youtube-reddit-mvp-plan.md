# Twitch, YouTube Category, and Reddit MVP Plan

Updated: 2026-04-02

## Scope

This document records the implementation plan and MVP boundaries for three new product areas:

1. Twitch game detail charts
2. YouTube category landing pages
3. Reddit hot posts

The goal of this pass is to ship user-facing routes and navigation entry points inside the existing Vinext app without adding a new background ingestion pipeline unless it is already required by the current project shape.

## Product decisions

### 1. Twitch game detail charts

Use the existing Twitch official API integration and extend it from:

- `/[locale]/twitch-live`
- `/[locale]/twitch-categories`

to a new detail route:

- `/[locale]/twitch-games/[gameId]`

MVP behavior:

- fetch the selected game details from the Twitch Helix API
- fetch top streams for the selected game
- support query filters for `language` and `sort`
- reuse the existing Twitch card and scaffold visual language
- update category cards to link internally to the new detail route instead of the external Twitch directory page

MVP non-goals:

- no historical persistence yet
- no hourly aggregation table for Twitch game snapshots in this pass
- no "rising games" leaderboard yet

### 2. YouTube category landing pages

Keep the existing YouTube Trending data model and snapshot tables. Add SEO-friendly category routes on top of the current category-aware query layer:

- `/[locale]/youtube-trending/[categorySlug]`

Initial curated slugs:

- `gaming`
- `music`
- `sports`
- `news`

MVP behavior:

- each slug maps to one fixed YouTube category id
- page content reuses the existing YouTube Trending query pipeline
- category is locked by route while region and sort remain filterable
- metadata and canonical URLs become category-specific

MVP non-goals:

- no extra crawler changes
- no new YouTube tables
- no free-form category routing in this pass

### 3. Reddit hot posts

Add a new official-source MVP using Reddit listing endpoints and stable SSR/ISR pages.

New routes:

- `/[locale]/reddit`
- `/[locale]/reddit/[subreddit]`

MVP behavior:

- fixed curated subreddit directory on the index page
- subreddit page supports listing types:
  - `hot`
  - `rising`
  - `top`
- `top` supports time windows:
  - `day`
  - `week`
  - `month`
- fetch directly during page render with ISR instead of adding a new crawler first
- add header and homepage navigation entry points

MVP non-goals:

- no Reddit persistence tables in this pass
- no open search across all subreddits
- no cross-subreddit aggregation page yet

## Route map

### Existing routes extended

- `/[locale]/twitch-categories`
  - category cards now point to internal game detail pages
- `/[locale]/youtube-trending`
  - remains the main generic YouTube ranking page

### New routes

- `/[locale]/twitch-games/[gameId]`
- `/[locale]/youtube-trending/[categorySlug]`
- `/[locale]/reddit`
- `/[locale]/reddit/[subreddit]`

## Data sources

### Twitch

Official Helix API:

- `GET /helix/games/top`
- `GET /helix/streams`

### YouTube

Existing project snapshots backed by the YouTube Data API crawler:

- `videos.list` with `chart=mostPopular`
- existing category ids already stored in `youtube_hot_hourly_items`

### Reddit

Official Reddit listing endpoints used for SSR/ISR:

- subreddit listings for `hot`
- subreddit listings for `rising`
- subreddit listings for `top`

## Schema impact

This MVP intentionally avoids new schema changes.

Reasons:

- Twitch game detail pages can ship using live Helix reads
- YouTube category pages reuse existing snapshot tables
- Reddit MVP can ship with direct ISR fetches before committing to long-term storage

If the product performs well, the next phase should add:

- Twitch game snapshot tables
- Reddit snapshot and post tables
- crawler workflows for both

## Navigation impact

### Header

Add:

- `Reddit`

### Homepage

Add:

- `Reddit` card

Keep Twitch and YouTube as their current top-level cards because the new Twitch game detail pages and YouTube category pages sit under the existing platform groups.

## Validation

After implementation, validate with:

- `pnpm lint`
- `pnpm build`

If route additions touch translations or dynamic route params, also manually verify:

- locale switching
- homepage card targets
- header active states
- category and subreddit filter state in query strings
