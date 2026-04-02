export interface RedditDirectoryItem {
  subreddit: string;
  title: string;
  description: string;
}

export const REDDIT_DIRECTORY_ITEMS: readonly RedditDirectoryItem[] = [
  {
    subreddit: 'gaming',
    title: 'r/gaming',
    description: 'Broad gaming discussion and mainstream game news.',
  },
  {
    subreddit: 'technology',
    title: 'r/technology',
    description: 'Major tech news, product launches, and policy discussion.',
  },
  {
    subreddit: 'youtube',
    title: 'r/youtube',
    description: 'Creator updates, platform drama, and channel ecosystem chatter.',
  },
  {
    subreddit: 'music',
    title: 'r/music',
    description: 'Album drops, artist headlines, and broad music discussion.',
  },
  {
    subreddit: 'movies',
    title: 'r/movies',
    description: 'Film trailers, box office momentum, and community reactions.',
  },
  {
    subreddit: 'twitch',
    title: 'r/twitch',
    description: 'Streamer news, platform changes, and creator discussions.',
  },
  {
    subreddit: 'spotify',
    title: 'r/spotify',
    description: 'Spotify product discussion, features, and playback issues.',
  },
  {
    subreddit: 'apple',
    title: 'r/apple',
    description: 'Apple news, product launches, and ecosystem discussion.',
  },
  {
    subreddit: 'androidgaming',
    title: 'r/androidgaming',
    description: 'Mobile game launches, recommendations, and chart-adjacent discussion.',
  },
  {
    subreddit: 'LivestreamFail',
    title: 'r/LivestreamFail',
    description: 'High-velocity livestream clips and creator moments.',
  },
] as const;

export function getRedditDirectoryItem(subreddit: string) {
  const normalized = subreddit.trim().toLowerCase();
  return REDDIT_DIRECTORY_ITEMS.find((item) => item.subreddit.toLowerCase() === normalized) ?? null;
}
