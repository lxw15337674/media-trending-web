import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { TwitchGameGridPage } from '@/components/twitch/TwitchGameGridPage';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { buildTwitchGamePageData } from '@/lib/twitch/page-data';
import { buildTwitchGameJsonLd, buildTwitchGameMetadata } from '@/lib/twitch/seo';

interface TwitchGamePageProps {
  params: Promise<{ locale: string; gameId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 120;

function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({ params, searchParams }: TwitchGamePageProps): Promise<Metadata> {
  const [{ locale: requestedLocale, gameId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const pageData = await buildTwitchGamePageData(gameId, resolvedSearchParams, locale);

  if (!pageData.game) {
    return {
      title: getFallbackTitle(locale),
    };
  }

  return buildTwitchGameMetadata(locale, pageData.game);
}

function getFallbackTitle(locale: Locale) {
  return {
    en: 'Twitch Game Streams',
    zh: 'Twitch 游戏直播榜',
    es: 'Streams de juegos en Twitch',
    ja: 'Twitch ゲーム別ライブ',
  }[locale];
}

export default async function TwitchGamePage({ params, searchParams }: TwitchGamePageProps) {
  const [{ locale: requestedLocale, gameId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const pageData = await buildTwitchGamePageData(gameId, resolvedSearchParams, locale);
  const jsonLd = pageData.game ? buildTwitchGameJsonLd(locale, pageData.game, pageData.items) : null;

  return <TwitchGameGridPage initialData={pageData} jsonLd={jsonLd} />;
}
