import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { RedditChartPage } from '@/components/reddit/RedditChartPage';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { buildRedditPageData } from '@/lib/reddit/page-data';
import { buildRedditJsonLd, buildRedditMetadata } from '@/lib/reddit/seo';

interface RedditSubredditPageProps {
  params: Promise<{ locale: string; subreddit: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 600;

function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({ params }: Pick<RedditSubredditPageProps, 'params'>): Promise<Metadata> {
  const { locale: requestedLocale, subreddit } = await params;
  const locale = resolveLocale(requestedLocale);
  const t = getMessages(locale).reddit;

  return buildRedditMetadata(locale, subreddit, `${t.metadataTitle} - r/${subreddit}`, `${t.subredditPrefix} r/${subreddit}`);
}

export default async function RedditSubredditPage({ params, searchParams }: RedditSubredditPageProps) {
  const [{ locale: requestedLocale, subreddit }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const pageData = await buildRedditPageData(subreddit, resolvedSearchParams, locale);
  const jsonLd = buildRedditJsonLd(locale, subreddit, pageData.title, pageData.subtitle, pageData.posts);

  return <RedditChartPage initialData={pageData} jsonLd={jsonLd} />;
}
