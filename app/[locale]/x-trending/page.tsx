import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { XTrendGridPage } from '@/components/xtrends/XTrendGridPage';
import { type Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getRequestCountryCode } from '@/lib/server/request-country';
import { type SearchParamsInput } from '@/lib/server/search-params';
import { buildXTrendPageData } from '@/lib/x-trends/page-data';
import { buildXTrendMetadata } from '@/lib/x-trends/seo';

interface XTrendPageProps {
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

export async function generateMetadata({ params }: Pick<XTrendPageProps, 'params'>): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveLocale(requestedLocale);
  return buildXTrendMetadata(locale);
}

export default async function XTrendPage({ params, searchParams }: XTrendPageProps) {
  const [{ locale: requestedLocale }, requestHeaders, resolvedSearchParams] = await Promise.all([
    params,
    headers(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const pageData = await buildXTrendPageData(resolvedSearchParams, locale);
  const userRegion = getRequestCountryCode(requestHeaders)?.toLowerCase() ?? null;

  return <XTrendGridPage initialData={pageData} userRegion={userRegion} />;
}
