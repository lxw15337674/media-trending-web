import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { YouTubeHotGridPage } from '@/components/youtubehot/YouTubeHotGridPage';
import type { Locale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getRequestCountryCode } from '@/lib/server/request-country';
import { buildYouTubeHotPageData } from '@/lib/youtube-hot/page-data';
import { getYouTubeHotCategoryPage } from '@/lib/youtube-hot/category-pages';
import { buildYouTubeHotCategoryJsonLd, buildYouTubeHotCategoryMetadata } from '@/lib/youtube-hot/seo';

interface YouTubeHotCategoryPageProps {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 600;

function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

function buildSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  categoryId: string,
) {
  return {
    ...searchParams,
    category: categoryId,
  };
}

export async function generateMetadata({ params }: Pick<YouTubeHotCategoryPageProps, 'params'>): Promise<Metadata> {
  const { locale: requestedLocale, categorySlug } = await params;
  const locale = resolveLocale(requestedLocale);
  const categoryPage = getYouTubeHotCategoryPage(categorySlug);

  if (!categoryPage) {
    notFound();
  }

  return buildYouTubeHotCategoryMetadata(locale, categoryPage);
}

export default async function YouTubeHotCategoryPage({ params, searchParams }: YouTubeHotCategoryPageProps) {
  const [{ locale: requestedLocale, categorySlug }, requestHeaders, resolvedSearchParams] = await Promise.all([
    params,
    headers(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  const locale = resolveLocale(requestedLocale);
  const categoryPage = getYouTubeHotCategoryPage(categorySlug);

  if (!categoryPage) {
    notFound();
  }

  const pageData = await buildYouTubeHotPageData(
    buildSearchParams(resolvedSearchParams, categoryPage.categoryId),
    locale,
  );
  const userRegion = getRequestCountryCode(requestHeaders);
  const jsonLd = buildYouTubeHotCategoryJsonLd(locale, categoryPage, pageData.items);

  return (
    <YouTubeHotGridPage
      locale={locale}
      userRegion={userRegion}
      jsonLd={jsonLd}
      initialData={pageData}
      hideCategoryFilter
      headerTitle={categoryPage.title[locale]}
      headerDescription={categoryPage.description[locale]}
    />
  );
}
