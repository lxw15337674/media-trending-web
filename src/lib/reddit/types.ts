import type { Locale } from '@/i18n/config';
import type { RedditDirectoryItem } from './catalog';

export const REDDIT_LISTING_TYPES = ['hot', 'rising', 'top'] as const;
export type RedditListingType = (typeof REDDIT_LISTING_TYPES)[number];

export const REDDIT_TOP_WINDOWS = ['day', 'week', 'month'] as const;
export type RedditTopWindow = (typeof REDDIT_TOP_WINDOWS)[number];

export interface RedditPostItem {
  id: string;
  subreddit: string;
  title: string;
  author: string;
  permalink: string;
  outboundUrl: string;
  domain: string;
  score: number;
  commentCount: number;
  createdAt: string;
  isNsfw: boolean;
  isVideo: boolean;
  thumbnailUrl: string | null;
}

export interface RedditPageData {
  locale: Locale;
  subreddit: string;
  title: string;
  subtitle: string;
  listingType: RedditListingType;
  topWindow: RedditTopWindow;
  fetchedAt: string;
  posts: RedditPostItem[];
  directoryItems: RedditDirectoryItem[];
  errorMessage?: string | null;
}
