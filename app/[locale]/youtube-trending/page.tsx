import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { YouTubeHotGridPage } from '@/components/youtubehot/YouTubeHotGridPage';
import { type Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getRequestCountryCode } from '@/lib/server/request-country';
import { type SearchParamsInput } from '@/lib/server/search-params';
import { buildYouTubeHotPageData } from '@/lib/youtube-hot/page-data';
import { buildYouTubeHotJsonLd, buildYouTubeHotMetadata } from '@/lib/youtube-hot/seo';

interface YouTubeHotPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<SearchParamsInput>;
}

export const revalidate = 600;

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
  const [{ locale: requestedLocale }, requestHeaders, resolvedSearchParams] = await Promise.all([
    params,
    headers(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const userRegion = getRequestCountryCode(requestHeaders);
  const pageData = await buildYouTubeHotPageData(resolvedSearchParams, locale);
  const jsonLd = buildYouTubeHotJsonLd(locale, pageData.items);

  return <YouTubeHotGridPage locale={locale} userRegion={userRegion} jsonLd={jsonLd} initialData={pageData} />;
}
