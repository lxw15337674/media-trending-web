import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import type { AppleMusicChartItem } from './types';

const APPLE_MUSIC_METADATA_TEXT: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'Apple Music Top Songs',
    description: 'Latest public Apple Music Top 100 songs chart with country switching and stable indexable URLs.',
    keywords: ['apple music top songs', 'apple music chart', 'apple music top 100', 'apple music country chart'],
  },
  zh: {
    title: 'Apple Music 热门歌曲榜',
    description: '基于 Apple Music 公开榜单页抓取的 Top 100 歌曲榜，支持国家切换。',
    keywords: ['Apple Music 榜单', 'Apple Music 热门歌曲', 'Apple Music Top 100', 'Apple Music 国家榜'],
  },
  es: {
    title: 'Top Songs de Apple Music',
    description: 'Ranking Top 100 de canciones de Apple Music obtenido de páginas públicas con cambio por país.',
    keywords: ['apple music top songs', 'apple music top 100', 'ranking apple music', 'apple music por país'],
  },
  ja: {
    title: 'Apple Music 人気楽曲チャート',
    description: 'Apple Music の公開チャートページをもとにした Top 100 楽曲ランキング。国切り替えに対応しています。',
    keywords: ['apple music トップソング', 'apple music top 100', 'apple music チャート', 'apple music 国別'],
  },
};

function resolveMetadataText(locale: Locale) {
  return {
    ...APPLE_MUSIC_METADATA_TEXT[locale],
    canonicalPath: `/${locale}/apple-music`,
    inLanguage: getIntlLocale(locale),
  };
}

export function buildAppleMusicMetadata(locale: Locale): Metadata {
  const t = resolveMetadataText(locale);
  const absoluteCanonical = toAbsoluteUrl(t.canonicalPath);

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    alternates: {
      canonical: absoluteCanonical,
      languages: buildLocaleAlternates('/apple-music'),
    },
    openGraph: {
      type: 'website',
      url: absoluteCanonical,
      title: t.title,
      description: t.description,
      locale: t.inLanguage,
      siteName: 'Galaxy Trending',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildAppleMusicJsonLd(locale: Locale, items: AppleMusicChartItem[]) {
  const t = resolveMetadataText(locale);
  const itemListElement = items.slice(0, 10).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.trackName,
    url: item.appleSongUrl ?? toAbsoluteUrl(t.canonicalPath),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.title,
    description: t.description,
    url: toAbsoluteUrl(t.canonicalPath),
    inLanguage: t.inLanguage,
    about: t.keywords,
    mainEntity: {
      '@type': 'ItemList',
      name: t.title,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
}
