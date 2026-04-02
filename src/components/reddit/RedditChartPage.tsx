'use client';

import Link from 'next/link';
import { startTransition, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RankingFilterField } from '@/components/rankings/RankingFilterField';
import { RankingMetaRow } from '@/components/rankings/RankingMetaRow';
import { RankingPageShell } from '@/components/rankings/RankingPageShell';
import { Card, CardContent } from '@/components/ui/card';
import type { ComboboxOption } from '@/components/ui/combobox';
import { formatRelativeUpdate } from '@/i18n/format';
import { getMessages } from '@/i18n/messages';
import type { RedditPageData } from '@/lib/reddit/types';
import { RedditPostCard } from './RedditPostCard';

interface RedditChartPageProps {
  initialData: RedditPageData;
  jsonLd?: unknown;
}

const CARD_GRID_CLASS = 'mt-2 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4';

export function RedditChartPage({ initialData, jsonLd }: RedditChartPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages(initialData.locale).reddit;
  const listingOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'hot', label: t.listingHot, keywords: ['hot', t.listingHot] },
      { value: 'rising', label: t.listingRising, keywords: ['rising', t.listingRising] },
      { value: 'top', label: t.listingTop, keywords: ['top', t.listingTop] },
    ],
    [t.listingHot, t.listingRising, t.listingTop],
  );
  const topWindowOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'day', label: t.topDay, keywords: ['day', t.topDay] },
      { value: 'week', label: t.topWeek, keywords: ['week', t.topWeek] },
      { value: 'month', label: t.topMonth, keywords: ['month', t.topMonth] },
    ],
    [t.topDay, t.topMonth, t.topWeek],
  );

  const updateQuery = (patch: Partial<Record<'listing' | 't', string>>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || (key === 'listing' && value === 'hot') || (key === 't' && value === 'day')) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    if ((patch.listing && patch.listing !== 'top') || (patch.listing === 'hot' || patch.listing === 'rising')) {
      nextParams.delete('t');
    }

    const nextQuery = nextParams.toString();
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  };

  return (
    <RankingPageShell title={initialData.title} jsonLd={jsonLd}>
      <div className="mb-4 max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-3xl">
          {initialData.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{initialData.subtitle}</p>
        <RankingMetaRow
          className="mt-3"
          items={[
            { label: t.updatedAtLabel, value: formatRelativeUpdate(initialData.fetchedAt, initialData.locale) },
            { label: t.itemsLabel, value: String(initialData.posts.length) },
            {
              label: t.currentSourceLabel,
              value: initialData.subreddit === 'popular' ? t.sourcePopular : `r/${initialData.subreddit}`,
            },
          ]}
        />
      </div>

      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
        <CardContent className="flex flex-wrap items-end gap-2 p-4">
          <div className="w-full min-[360px]:w-[220px]">
            <RankingFilterField
              label={t.filterListingLabel}
              options={listingOptions}
              value={initialData.listingType}
              placeholder={t.filterListingSearchPlaceholder}
              emptyText={t.filterNoMatch}
              clearLabel={t.clearSearch}
              onValueChange={(value) => updateQuery({ listing: value })}
            />
          </div>
          {initialData.listingType === 'top' ? (
            <div className="w-full min-[360px]:w-[220px]">
              <RankingFilterField
                label={t.filterTopWindowLabel}
                options={topWindowOptions}
                value={initialData.topWindow}
                placeholder={t.filterTopWindowSearchPlaceholder}
                emptyText={t.filterNoMatch}
                clearLabel={t.clearSearch}
                onValueChange={(value) => updateQuery({ t: value })}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-2 border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
        <CardContent className="p-4">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t.directoryTitle}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/${initialData.locale}/reddit`}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                initialData.subreddit === 'popular'
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                  : 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              {t.sourcePopular}
            </Link>
            {initialData.directoryItems.map((item) => {
              const active = item.subreddit.toLowerCase() === initialData.subreddit.toLowerCase();
              return (
                <Link
                  key={item.subreddit}
                  href={`/${initialData.locale}/reddit/${item.subreddit}`}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                      : 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {initialData.errorMessage ? (
        <Card className="mt-2 border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-4 text-base text-red-700 dark:text-red-200">{initialData.errorMessage}</CardContent>
        </Card>
      ) : null}

      {!initialData.errorMessage && initialData.posts.length === 0 ? (
        <Card className="mt-2 border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <CardContent className="p-10 text-center text-zinc-500 dark:text-zinc-400">{t.emptyState}</CardContent>
        </Card>
      ) : null}

      {!initialData.errorMessage && initialData.posts.length > 0 ? (
        <div className={CARD_GRID_CLASS}>
          {initialData.posts.map((post) => (
            <RedditPostCard key={post.id} item={post} locale={initialData.locale} />
          ))}
        </div>
      ) : null}
    </RankingPageShell>
  );
}
