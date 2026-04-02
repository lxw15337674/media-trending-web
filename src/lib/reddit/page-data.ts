import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { readSearchParamRaw, type SearchParamsInput } from '@/lib/server/search-params';
import { logServerError } from '@/lib/server/runtime-error';
import { RedditClient } from './client';
import { REDDIT_DIRECTORY_ITEMS, getRedditDirectoryItem } from './catalog';
import {
  REDDIT_LISTING_TYPES,
  REDDIT_TOP_WINDOWS,
  type RedditListingType,
  type RedditPageData,
  type RedditTopWindow,
} from './types';

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeListingType(value: string | string[] | undefined): RedditListingType {
  const normalized = takeFirst(value)?.trim().toLowerCase();
  return REDDIT_LISTING_TYPES.includes(normalized as RedditListingType) ? (normalized as RedditListingType) : 'hot';
}

function normalizeTopWindow(value: string | string[] | undefined): RedditTopWindow {
  const normalized = takeFirst(value)?.trim().toLowerCase();
  return REDDIT_TOP_WINDOWS.includes(normalized as RedditTopWindow) ? (normalized as RedditTopWindow) : 'day';
}

function buildRedditTitle(locale: Locale, subreddit: string) {
  const t = getMessages(locale).reddit;
  return subreddit === 'popular' ? t.title : `${t.title} - r/${subreddit}`;
}

function buildRedditSubtitle(locale: Locale, subreddit: string) {
  const t = getMessages(locale).reddit;
  if (subreddit === 'popular') {
    return t.subtitle;
  }

  const directoryItem = getRedditDirectoryItem(subreddit);
  return directoryItem?.description ?? `${t.subredditPrefix} r/${subreddit}`;
}

export async function buildRedditPageData(
  subreddit: string,
  rawSearchParams: SearchParamsInput,
  locale: Locale,
): Promise<RedditPageData> {
  const t = getMessages(locale).reddit;
  const listingType = normalizeListingType(readSearchParamRaw(rawSearchParams, 'listing'));
  const topWindow = normalizeTopWindow(readSearchParamRaw(rawSearchParams, 't'));
  const normalizedSubreddit = subreddit.trim() || 'popular';

  try {
    const client = new RedditClient();
    const result = await client.listPosts(normalizedSubreddit, listingType, topWindow);

    return {
      locale,
      subreddit: normalizedSubreddit,
      title: buildRedditTitle(locale, normalizedSubreddit),
      subtitle: buildRedditSubtitle(locale, normalizedSubreddit),
      listingType,
      topWindow,
      fetchedAt: result.fetchedAt,
      posts: result.posts,
      directoryItems: [...REDDIT_DIRECTORY_ITEMS],
      errorMessage: result.posts.length ? null : t.errorEmpty,
    };
  } catch (error) {
    logServerError('reddit/page-data', error);
    return {
      locale,
      subreddit: normalizedSubreddit,
      title: buildRedditTitle(locale, normalizedSubreddit),
      subtitle: buildRedditSubtitle(locale, normalizedSubreddit),
      listingType,
      topWindow,
      fetchedAt: new Date().toISOString(),
      posts: [],
      directoryItems: [...REDDIT_DIRECTORY_ITEMS],
      errorMessage: error instanceof Error ? error.message : t.errorLoad,
    };
  }
}
