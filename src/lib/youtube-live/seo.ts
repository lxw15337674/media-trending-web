import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import type { YouTubeLiveItem } from '@/lib/youtube-hot/types';

function resolveMetadataCopy(locale: Locale) {
  if (locale === 'en') {
    return {
      title: 'YouTube Live Ranking',
      description: 'Track global YouTube live rankings with language and category filters from scheduled snapshots.',
      keywords: [
        'youtube live ranking',
        'youtube live trending',
        'youtube live viewers',
        'youtube livestream leaderboard',
        'youtube live by language',
      ],
      canonicalPath: '/en/youtube-live',
      inLanguage: 'en-US',
    };
  }

  return {
    title: 'YouTube 直播热榜',
    description: '基于定时抓取的 YouTube 全球直播热榜，支持语言和分类筛选，持续追踪热门直播走势。',
    keywords: ['YouTube 直播热榜', 'YouTube 直播排行', 'YouTube 实时直播', 'YouTube 热门直播', 'YouTube 直播榜单'],
    canonicalPath: '/zh/youtube-live',
    inLanguage: 'zh-CN',
  };
}

export function buildYouTubeLiveMetadata(locale: Locale): Metadata {
  const copy = resolveMetadataCopy(locale);
  const absoluteCanonical = toAbsoluteUrl(copy.canonicalPath);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical: copy.canonicalPath,
      languages: {
        'zh-CN': '/zh/youtube-live',
        en: '/en/youtube-live',
        'x-default': '/en/youtube-live',
      },
    },
    openGraph: {
      type: 'website',
      url: absoluteCanonical,
      title: copy.title,
      description: copy.description,
      locale: copy.inLanguage,
      siteName: 'Media Trending Web',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildYouTubeLiveJsonLd(locale: Locale, items: YouTubeLiveItem[]) {
  const copy = resolveMetadataCopy(locale);
  const itemListElement = items.slice(0, 10).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.title,
    url: item.videoUrl,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.title,
    description: copy.description,
    url: toAbsoluteUrl(copy.canonicalPath),
    inLanguage: copy.inLanguage,
    about: copy.keywords,
    mainEntity: {
      '@type': 'ItemList',
      name: copy.title,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
}
