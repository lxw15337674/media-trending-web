import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import { getLocalizedAppStoreGameCountryLabel } from './labels';
import type { AppStoreGameChartItem, AppStoreGameChartType } from './types';
import { normalizeAppStoreGameChartType, normalizeAppStoreGameCountryCode } from './types';

const APP_STORE_GAMES_METADATA_TEXT: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'App Store Game Charts',
    description: 'Latest App Store game charts for Top Free, Top Paid, and Top Grossing apps with country switching.',
    keywords: ['app store games chart', 'ios games ranking', 'top free games ios', 'top grossing games app store'],
  },
  zh: {
    title: 'App Store 游戏榜',
    description: '基于 Apple iTunes RSS 的手机游戏榜，聚合免费榜、付费榜和畅销榜并支持地区切换。',
    keywords: ['App Store 游戏榜', 'iPhone 游戏榜', '手游排行榜', 'App Store 畅销榜'],
  },
  es: {
    title: 'Charts de juegos de App Store',
    description: 'Charts recientes de juegos de App Store con Top Free, Top Paid y Top Grossing por país.',
    keywords: ['charts app store juegos', 'ranking ios juegos', 'top free ios', 'top grossing app store'],
  },
  ja: {
    title: 'App Store ゲームチャート',
    description: 'App Store のゲーム無料、有料、売上上位チャートを国別に確認できるページです。',
    keywords: ['app store ゲームチャート', 'ios ゲームランキング', '無料ゲーム', '売上上位ゲーム'],
  },
};

function getLocalizedChartLabel(locale: Locale, chartType: AppStoreGameChartType) {
  if (locale === 'zh') {
    if (chartType === 'toppaid') return '付费榜';
    if (chartType === 'topgrossing') return '畅销榜';
    return '免费榜';
  }
  if (locale === 'es') {
    if (chartType === 'toppaid') return 'Top Paid';
    if (chartType === 'topgrossing') return 'Top Grossing';
    return 'Top Free';
  }
  if (locale === 'ja') {
    if (chartType === 'toppaid') return '有料';
    if (chartType === 'topgrossing') return '売上上位';
    return '無料';
  }
  if (chartType === 'toppaid') return 'Top Paid';
  if (chartType === 'topgrossing') return 'Top Grossing';
  return 'Top Free';
}

function buildCountryDescriptionSuffix(locale: Locale, countryLabel: string) {
  if (locale === 'zh') return `当前地区：${countryLabel}。`;
  if (locale === 'es') return `País actual: ${countryLabel}.`;
  if (locale === 'ja') return `現在の国: ${countryLabel}。`;
  return `Current country: ${countryLabel}.`;
}

function buildAlternates(chartType: AppStoreGameChartType, countryCode: string) {
  const alternates = buildLocaleAlternates('/app-store-games');
  const next = new URLSearchParams();
  if (chartType !== 'topfree') next.set('chart', chartType);
  if (countryCode !== 'US') next.set('country', countryCode);
  const query = next.toString();
  if (!query) return alternates;
  return Object.fromEntries(Object.entries(alternates).map(([key, value]) => [key, `${value}?${query}`]));
}

interface AppStoreGamesMetadataOptions {
  chartType?: string;
  countryCode?: string;
  countryName?: string;
}

function resolveMetadataText(locale: Locale, options?: AppStoreGamesMetadataOptions) {
  const base = APP_STORE_GAMES_METADATA_TEXT[locale];
  const chartType = normalizeAppStoreGameChartType(options?.chartType);
  const countryCode = normalizeAppStoreGameCountryCode(options?.countryCode);
  const chartLabel = getLocalizedChartLabel(locale, chartType);
  const countryLabel = getLocalizedAppStoreGameCountryLabel(countryCode, options?.countryName, locale);
  const params = new URLSearchParams();
  if (chartType !== 'topfree') params.set('chart', chartType);
  if (countryCode !== 'US') params.set('country', countryCode);
  const query = params.toString();
  const canonicalPath = query ? `/${locale}/app-store-games?${query}` : `/${locale}/app-store-games`;

  return {
    title: `${base.title} - ${chartLabel} - ${countryLabel}`,
    description: `${base.description} ${chartLabel}. ${buildCountryDescriptionSuffix(locale, countryLabel)}`,
    keywords: base.keywords,
    canonicalPath,
    alternates: buildAlternates(chartType, countryCode),
    inLanguage: getIntlLocale(locale),
  };
}

export function buildAppStoreGamesMetadata(locale: Locale, options?: AppStoreGamesMetadataOptions): Metadata {
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

export function buildAppStoreGamesJsonLd(locale: Locale, items: AppStoreGameChartItem[], options?: AppStoreGamesMetadataOptions) {
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
