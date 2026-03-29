import type { Metadata } from 'next';
import { type Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { getIntlLocale } from '@/i18n/locale-meta';
import { buildLocaleAlternates } from '@/lib/seo/locale-alternates';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';
import type { XTrendQueryItem } from '@/lib/x-trends/types';

function buildTrendHref(item: XTrendQueryItem) {
  if (item.trendUrl) {
    return item.trendUrl;
  }

  const query = encodeURIComponent(item.queryText || item.trendName);
  return `https://x.com/search?q=${query}&src=trend_click`;
}

export function buildXTrendMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).xTrending;
  const canonicalPath = `/${locale}/x-trending`;
  const absoluteCanonical = toAbsoluteUrl(canonicalPath);

  return {
    title: t.metadataTitle,
    description: t.metadataDescription,
    keywords: ['x trends', 'twitter trends', 'x trending topics', 'twitter trending topics', 'x hot topics'],
    alternates: {
      canonical: absoluteCanonical,
      languages: buildLocaleAlternates('/x-trending'),
    },
    openGraph: {
      type: 'website',
      url: absoluteCanonical,
      title: t.metadataTitle,
      description: t.metadataDescription,
      locale: getIntlLocale(locale),
      siteName: 'Galaxy Trending',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.metadataTitle,
      description: t.metadataDescription,
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
  const t = getMessages(locale).xTrending;
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
    name: regionLabel ? `${t.title} - ${regionLabel}` : t.title,
    description: t.metadataDescription,
    url: toAbsoluteUrl(canonicalPath),
    inLanguage: getIntlLocale(locale),
    mainEntity: {
      '@type': 'ItemList',
      name: regionLabel ? `${regionLabel} ${t.title}` : t.title,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
}
