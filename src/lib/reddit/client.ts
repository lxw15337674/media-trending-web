import type { RedditListingType, RedditPostItem, RedditTopWindow } from './types';

const REDDIT_BASE_URL = 'https://www.reddit.com';
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_LIMIT = 25;

interface RedditListingChild {
  data: {
    id: string;
    subreddit: string;
    title: string;
    author: string;
    permalink: string;
    url: string;
    domain: string;
    score: number;
    num_comments: number;
    created_utc: number;
    over_18: boolean;
    is_video: boolean;
    thumbnail: string;
    preview?: {
      images?: Array<{
        source?: {
          url?: string;
        };
      }>;
    };
  };
}

interface RedditListingResponse {
  data?: {
    children?: RedditListingChild[];
  };
}

function normalizeThumbnailUrl(child: RedditListingChild) {
  const previewUrl = child.data.preview?.images?.[0]?.source?.url;
  const rawValue = previewUrl || child.data.thumbnail;
  const normalized = String(rawValue ?? '').trim();

  if (!normalized || ['self', 'default', 'nsfw', 'spoiler'].includes(normalized)) {
    return null;
  }

  return normalized.replace(/&amp;/g, '&');
}

function createUserAgent() {
  return process.env.REDDIT_USER_AGENT?.trim() || 'GalaxyTrending/0.1 (+https://trending.bhwa233.com)';
}

export class RedditClient {
  async listPosts(
    subreddit: string,
    listingType: RedditListingType,
    topWindow: RedditTopWindow,
  ): Promise<{ fetchedAt: string; posts: RedditPostItem[] }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const path = subreddit === 'popular' ? `/r/popular/${listingType}.json` : `/r/${subreddit}/${listingType}.json`;
      const url = new URL(`${REDDIT_BASE_URL}${path}`);
      url.searchParams.set('limit', String(DEFAULT_LIMIT));
      if (listingType === 'top') {
        url.searchParams.set('t', topWindow);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': createUserAgent(),
          Accept: 'application/json',
        },
        signal: controller.signal,
        next: {
          revalidate: 600,
        },
      });
      const payload = (await response.json()) as RedditListingResponse;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading Reddit posts`);
      }

      const posts =
        payload.data?.children?.map((child) => ({
          id: child.data.id,
          subreddit: child.data.subreddit,
          title: child.data.title,
          author: child.data.author,
          permalink: `${REDDIT_BASE_URL}${child.data.permalink}`,
          outboundUrl: child.data.url,
          domain: child.data.domain,
          score: Number(child.data.score ?? 0),
          commentCount: Number(child.data.num_comments ?? 0),
          createdAt: new Date(Number(child.data.created_utc ?? 0) * 1000).toISOString(),
          isNsfw: Boolean(child.data.over_18),
          isVideo: Boolean(child.data.is_video),
          thumbnailUrl: normalizeThumbnailUrl(child),
        })) ?? [];

      return {
        fetchedAt: new Date().toISOString(),
        posts,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
