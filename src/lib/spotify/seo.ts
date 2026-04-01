import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import { getLocalizedSpotifyCountryLabel } from './labels';
import type { SpotifyChartItem } from './types';

const SPOTIFY_METADATA_TEXT: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'Spotify Top Songs',
    description: 'Latest Spotify daily top songs chart with country switching and stable URLs.',
    keywords: ['spotify top songs', 'spotify charts', 'spotify global chart', 'spotify country chart'],
  },
  zh: {
    title: 'Spotify 热门歌曲榜',
    description: '基于 Spotify Charts 抓取的每日热门歌曲榜，支持全球与国家切换。',
    keywords: ['Spotify 榜单', 'Spotify 热门歌曲', 'Spotify 全球榜', 'Spotify 国家榜'],
  },
  es: {
    title: 'Top Songs de Spotify',
    description: 'Último ranking diario de canciones de Spotify con cambio entre global y países.',
    keywords: ['spotify top songs', 'spotify charts', 'ranking spotify', 'spotify global'],
  },
  ja: {
    title: 'Spotify 人気楽曲チャート',
    description: 'Spotify Charts をもとにした日次トップソング。グローバルと国別の切り替えに対応しています。',
    keywords: ['spotify トップソング', 'spotify charts', 'spotify グローバル', 'spotify 国別'],
  },
};

interface SpotifyMetadataOptions {
  countryCode?: string;
  countryName?: string;
}

function buildCountryDescriptionSuffix(locale: Locale, countryLabel: string) {
  if (locale === 'zh') return `当前国家：${countryLabel}。`;
  if (locale === 'es') return `País actual: ${countryLabel}.`;
  if (locale === 'ja') return `現在の国: ${countryLabel}。`;
  return `Current country: ${countryLabel}.`;
}

function buildLocaleAlternatesWithCountry(countryCode: string | undefined) {
  const alternates = buildLocaleAlternates('/spotify');
  if (!countryCode || countryCode === 'global') {
    return alternates;
  }

  const querySuffix = `?country=${encodeURIComponent(countryCode)}`;
  return Object.fromEntries(Object.entries(alternates).map(([key, value]) => [key, `${value}${querySuffix}`]));
}

function resolveMetadataText(locale: Locale, options?: SpotifyMetadataOptions) {
  const base = SPOTIFY_METADATA_TEXT[locale];
  const normalizedCountryCode = options?.countryCode?.trim() || 'global';
  const countryLabel =
    normalizedCountryCode !== 'global'
      ? getLocalizedSpotifyCountryLabel(normalizedCountryCode, options?.countryName, locale)
      : null;
  const canonicalPath =
    normalizedCountryCode !== 'global'
      ? `/${locale}/spotify?country=${encodeURIComponent(normalizedCountryCode)}`
      : `/${locale}/spotify`;

  return {
    title: countryLabel ? `${base.title} - ${countryLabel}` : base.title,
    description: countryLabel ? `${base.description} ${buildCountryDescriptionSuffix(locale, countryLabel)}` : base.description,
    keywords: base.keywords,
    canonicalPath,
    alternates: buildLocaleAlternatesWithCountry(countryLabel ? normalizedCountryCode : undefined),
    inLanguage: getIntlLocale(locale),
  };
}

export function buildSpotifyMetadata(locale: Locale, options?: SpotifyMetadataOptions): Metadata {
  const t = resolveMetadataText(locale, options);
  const absoluteCanonical = toAbsoluteUrl(t.canonicalPath);

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    alternates: {
      canonical: absoluteCanonical,
      languages: t.alternates,
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

export function buildSpotifyJsonLd(locale: Locale, items: SpotifyChartItem[], options?: SpotifyMetadataOptions) {
  const t = resolveMetadataText(locale, options);
  const itemListElement = items.slice(0, 10).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.trackName,
    url: item.spotifyTrackUrl ?? toAbsoluteUrl(t.canonicalPath),
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
