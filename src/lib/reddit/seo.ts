import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import type { RedditPostItem } from './types';

function buildPath(locale: Locale, subreddit: string) {
  return subreddit === 'popular' ? `/${locale}/reddit` : `/${locale}/reddit/${subreddit}`;
}

export function buildRedditMetadata(locale: Locale, subreddit: string, title: string, description: string): Metadata {
  const path = buildPath(locale, subreddit);
  const absoluteCanonical = toAbsoluteUrl(path);
  const barePath = subreddit === 'popular' ? '/reddit' : `/reddit/${subreddit}`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteCanonical,
      languages: buildLocaleAlternates(barePath),
    },
    openGraph: {
      type: 'website',
      url: absoluteCanonical,
      title,
      description,
      locale: getIntlLocale(locale),
      siteName: 'Galaxy Trending',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildRedditJsonLd(
  locale: Locale,
  subreddit: string,
  title: string,
  description: string,
  posts: RedditPostItem[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: toAbsoluteUrl(buildPath(locale, subreddit)),
    inLanguage: getIntlLocale(locale),
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: Math.min(10, posts.length),
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: post.permalink,
      })),
    },
  };
}
