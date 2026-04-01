import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { SpotifyGridPage } from '@/components/spotify/SpotifyGridPage';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { buildSpotifyPageData } from '@/lib/spotify/page-data';
import { buildSpotifyJsonLd, buildSpotifyMetadata } from '@/lib/spotify/seo';

interface SpotifyPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 600;

function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({ params, searchParams }: SpotifyPageProps): Promise<Metadata> {
  const [{ locale: requestedLocale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const pageData = await buildSpotifyPageData(resolvedSearchParams, locale);

  return buildSpotifyMetadata(locale, {
    countryCode: pageData.country,
    countryName: pageData.countryName,
  });
}

export default async function SpotifyPage({ params, searchParams }: SpotifyPageProps) {
  const [{ locale: requestedLocale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const pageData = await buildSpotifyPageData(resolvedSearchParams, locale);
  const jsonLd = buildSpotifyJsonLd(locale, pageData.items, {
    countryCode: pageData.country,
    countryName: pageData.countryName,
  });

  return <SpotifyGridPage {...pageData} jsonLd={jsonLd} />;
}
