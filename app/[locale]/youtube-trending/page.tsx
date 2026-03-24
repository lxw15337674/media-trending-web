import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { YouTubeHotGridPage } from '@/components/youtubehot/YouTubeHotGridPage';
import { type Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getRequestCountryCode } from '@/lib/server/request-country';
import type { SearchParamsInput } from '@/lib/server/search-params';
import { buildYouTubeHotPageData } from '@/lib/youtube-hot/page-data';
import { buildYouTubeHotJsonLd, buildYouTubeHotMetadata } from '@/lib/youtube-hot/seo';

interface YouTubeHotPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<SearchParamsInput>;
}

export const dynamic = 'force-dynamic';

function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({ params }: Pick<YouTubeHotPageProps, 'params'>): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveLocale(requestedLocale);
  return buildYouTubeHotMetadata(locale);
}

export default async function YouTubeHotPage({ params, searchParams }: YouTubeHotPageProps) {
  const [{ locale: requestedLocale }, resolvedSearchParams, requestHeaders] = await Promise.all([params, searchParams, headers()]);
  const locale = resolveLocale(requestedLocale);
  const detectedCountryCode = getRequestCountryCode(requestHeaders);

  const pageData = await buildYouTubeHotPageData(resolvedSearchParams, locale);
  const jsonLd = buildYouTubeHotJsonLd(locale, pageData.items);
  const userRegion =
    detectedCountryCode && pageData.regions.some((item) => item.regionCode === detectedCountryCode)
      ? detectedCountryCode
      : null;

  return <YouTubeHotGridPage {...pageData} userRegion={userRegion} jsonLd={jsonLd} />;
}
