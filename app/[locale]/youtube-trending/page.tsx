import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { YouTubeHotGridPage } from '@/components/youtubehot/YouTubeHotGridPage';
import { type Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getRequestCountryCode } from '@/lib/server/request-country';
import { buildYouTubeHotJsonLd, buildYouTubeHotMetadata } from '@/lib/youtube-hot/seo';

interface YouTubeHotPageProps {
  params: Promise<{ locale: string }>;
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

export default async function YouTubeHotPage({ params }: YouTubeHotPageProps) {
  const [{ locale: requestedLocale }, requestHeaders] = await Promise.all([params, headers()]);
  const locale = resolveLocale(requestedLocale);
  const userRegion = getRequestCountryCode(requestHeaders);
  const jsonLd = buildYouTubeHotJsonLd(locale, []);

  return <YouTubeHotGridPage locale={locale} userRegion={userRegion} jsonLd={jsonLd} />;
}
