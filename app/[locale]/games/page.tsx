import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { AppStoreGameGridPage } from '@/components/appstoregames/AppStoreGameGridPage';
import { GooglePlayGameGridPage } from '@/components/googleplaygames/GooglePlayGameGridPage';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import {
  GAME_CHART_PLATFORM_ANDROID,
  normalizeGameChartPlatform,
} from '@/lib/game-charts/platform';
import { buildAppStoreGamesPageData } from '@/lib/app-store-games/page-data';
import { buildGooglePlayGamesPageData } from '@/lib/google-play-games/page-data';
import { toAbsoluteUrl } from '@/lib/seo/site-origin';

interface GamesPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 3600;

function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

function buildGamesCanonicalPath(locale: Locale, searchParams?: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  const platform = normalizeGameChartPlatform(searchParams?.platform);
  const country = Array.isArray(searchParams?.country) ? searchParams?.country[0] : searchParams?.country;

  if (platform === GAME_CHART_PLATFORM_ANDROID) {
    params.set('platform', GAME_CHART_PLATFORM_ANDROID);
  }

  if (country) {
    params.set('country', country);
  }

  const query = params.toString();
  return query ? `/${locale}/games?${query}` : `/${locale}/games`;
}

export async function generateMetadata({ params, searchParams }: GamesPageProps): Promise<Metadata> {
  const [{ locale: requestedLocale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const canonicalPath = buildGamesCanonicalPath(locale, resolvedSearchParams);
  const platform = normalizeGameChartPlatform(resolvedSearchParams?.platform);
  const pageData =
    platform === GAME_CHART_PLATFORM_ANDROID
      ? await buildGooglePlayGamesPageData(resolvedSearchParams, locale)
      : await buildAppStoreGamesPageData(resolvedSearchParams, locale);

  return {
    title:
      platform === GAME_CHART_PLATFORM_ANDROID
        ? `${pageData.countryName} - Google Play Game Charts`
        : `${pageData.countryName} - App Store Game Charts`,
    description:
      platform === GAME_CHART_PLATFORM_ANDROID
        ? `Latest Google Play game charts for ${pageData.countryName}.`
        : `Latest App Store game charts for ${pageData.countryName}.`,
    alternates: {
      canonical: toAbsoluteUrl(canonicalPath),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function GamesPage({ params, searchParams }: GamesPageProps) {
  const [{ locale: requestedLocale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const platform = normalizeGameChartPlatform(resolvedSearchParams?.platform);

  if (platform === GAME_CHART_PLATFORM_ANDROID) {
    const pageData = await buildGooglePlayGamesPageData(resolvedSearchParams, locale);
    return <GooglePlayGameGridPage {...pageData} />;
  }

  const pageData = await buildAppStoreGamesPageData(resolvedSearchParams, locale);
  return <AppStoreGameGridPage {...pageData} />;
}
