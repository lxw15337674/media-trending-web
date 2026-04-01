import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import { getLocalizedGooglePlayGameCountryLabel } from './labels';
import type { GooglePlayGameChartItem } from './types';
import { normalizeGooglePlayGameCountryCode } from './types';

const GOOGLE_PLAY_GAMES_METADATA_TEXT: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'Google Play Game Charts',
    description: 'Latest Google Play game charts for Top Free, Top Paid, and Top Grossing games with country switching.',
    keywords: ['google play games chart', 'android games ranking', 'top free android games', 'top grossing google play'],
  },
  zh: {
    title: 'Google Play 游戏榜',
    description: '基于 Google Play 官方网页抓取的安卓游戏榜，聚合免费榜、付费榜和畅销榜并支持地区切换。',
    keywords: ['Google Play 游戏榜', '安卓游戏榜', 'Android 游戏排行榜', 'Google Play 畅销榜'],
  },
  es: {
    title: 'Charts de juegos de Google Play',
    description: 'Charts recientes de juegos de Google Play con Top Free, Top Paid y Top Grossing por país.',
    keywords: ['charts google play juegos', 'ranking android juegos', 'top free android', 'top grossing google play'],
  },
  ja: {
    title: 'Google Play ゲームチャート',
    description: 'Google Play のゲーム無料、有料、売上上位チャートを国別に確認できるページです。',
    keywords: ['google play ゲームチャート', 'android ゲームランキング', '無料ゲーム', '売上上位ゲーム'],
  },
};

function buildCountryDescriptionSuffix(locale: Locale, countryLabel: string) {
  if (locale === 'zh') return `当前地区：${countryLabel}。`;
  if (locale === 'es') return `País actual: ${countryLabel}.`;
  if (locale === 'ja') return `現在の国: ${countryLabel}。`;
  return `Current country: ${countryLabel}.`;
}

function buildAlternates(countryCode: string) {
  const alternates = buildLocaleAlternates('/google-play-games');
  const next = new URLSearchParams();
  if (countryCode !== 'US') next.set('country', countryCode);
  const query = next.toString();
  if (!query) return alternates;
  return Object.fromEntries(Object.entries(alternates).map(([key, value]) => [key, `${value}?${query}`]));
}

interface GooglePlayGamesMetadataOptions {
  countryCode?: string;
  countryName?: string;
}

function resolveMetadataText(locale: Locale, options?: GooglePlayGamesMetadataOptions) {
  const base = GOOGLE_PLAY_GAMES_METADATA_TEXT[locale];
  const countryCode = normalizeGooglePlayGameCountryCode(options?.countryCode);
  const countryLabel = getLocalizedGooglePlayGameCountryLabel(countryCode, options?.countryName, locale);
  const params = new URLSearchParams();
  if (countryCode !== 'US') params.set('country', countryCode);
  const query = params.toString();
  const canonicalPath = query ? `/${locale}/google-play-games?${query}` : `/${locale}/google-play-games`;

  return {
    title: `${base.title} - ${countryLabel}`,
    description: `${base.description} ${buildCountryDescriptionSuffix(locale, countryLabel)}`,
    keywords: base.keywords,
    canonicalPath,
    alternates: buildAlternates(countryCode),
    inLanguage: getIntlLocale(locale),
  };
}

export function buildGooglePlayGamesMetadata(locale: Locale, options?: GooglePlayGamesMetadataOptions): Metadata {
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

export function buildGooglePlayGamesJsonLd(
  locale: Locale,
  items: GooglePlayGameChartItem[],
  options?: GooglePlayGamesMetadataOptions,
) {
  const t = resolveMetadataText(locale, options);
  const itemListElement = items.slice(0, 10).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.appName,
    url: item.storeUrl ?? toAbsoluteUrl(t.canonicalPath),
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
