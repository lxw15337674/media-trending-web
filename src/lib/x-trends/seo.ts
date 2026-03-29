import type { Metadata } from 'next';
import { type Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import { X_TREND_COPY } from '@/lib/x-trends/copy';
import type { XTrendQueryItem } from '@/lib/x-trends/types';

function buildTrendHref(item: XTrendQueryItem) {
  if (item.trendUrl) {
    return item.trendUrl;
  }

  const query = encodeURIComponent(item.queryText || item.trendName);
  return `https://x.com/search?q=${query}&src=trend_click`;
}

export function buildXTrendMetadata(locale: Locale): Metadata {
  const canonicalPath = `/${locale}/x-trending`;
  const absoluteCanonical = toAbsoluteUrl(canonicalPath);

  return {
    title: X_TREND_COPY.metadataTitle,
    description: X_TREND_COPY.metadataDescription,
    keywords: ['x trends', 'twitter trends', 'x trending topics', 'twitter trending topics', 'x hot topics'],
    alternates: {
      canonical: absoluteCanonical,
      languages: buildLocaleAlternates('/x-trending'),
    },
    openGraph: {
      type: 'website',
      url: absoluteCanonical,
      title: X_TREND_COPY.metadataTitle,
      description: X_TREND_COPY.metadataDescription,
      locale: getIntlLocale('zh'),
      siteName: 'Galaxy Trending',
    },
    twitter: {
      card: 'summary_large_image',
      title: X_TREND_COPY.metadataTitle,
      description: X_TREND_COPY.metadataDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildXTrendJsonLd(
  locale: Locale,
  items: XTrendQueryItem[],
  regionLabel: string | null,
) {
  const canonicalPath = `/${locale}/x-trending`;
  const itemListElement = items.slice(0, 10).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.trendName,
    url: buildTrendHref(item),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: regionLabel ? `${X_TREND_COPY.title} - ${regionLabel}` : X_TREND_COPY.title,
    description: X_TREND_COPY.metadataDescription,
    url: toAbsoluteUrl(canonicalPath),
    inLanguage: getIntlLocale('zh'),
    mainEntity: {
      '@type': 'ItemList',
      name: regionLabel ? `${regionLabel} ${X_TREND_COPY.title}` : X_TREND_COPY.title,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
}
