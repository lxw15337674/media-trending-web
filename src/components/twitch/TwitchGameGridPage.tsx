'use client';

import Image from 'next/image';
import { startTransition, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RankingFilterField } from '@/components/rankings/RankingFilterField';
import { RankingMetaRow } from '@/components/rankings/RankingMetaRow';
import { RankingPageShell } from '@/components/rankings/RankingPageShell';
import { Card, CardContent } from '@/components/ui/card';
import type { ComboboxOption } from '@/components/ui/combobox';
import { TwitchStreamCard } from '@/components/twitch/TwitchStreamCard';
import { formatRelativeUpdate } from '@/i18n/format';
import { getIntlLocale } from '@/i18n/locale-meta';
import { getMessages } from '@/i18n/messages';
import {
  normalizeTwitchLiveLanguage,
  normalizeTwitchLiveSort,
  type TwitchGamePageData,
} from '@/lib/twitch/page-data';

interface TwitchGameGridPageProps {
  initialData: TwitchGamePageData;
  jsonLd?: unknown;
}

const CARD_GRID_CLASS = 'mt-2 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4';

function getLanguageLabel(value: string, locale: string) {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const normalized = value.trim().toLowerCase();
    const label = displayNames.of(normalized);
    if (label && label.toLowerCase() !== normalized) {
      return `${label} (${normalized.toUpperCase()})`;
    }
  } catch {
    // ignore
  }

  return value.trim().toUpperCase();
}

export function TwitchGameGridPage({ initialData, jsonLd }: TwitchGameGridPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages(initialData.locale).twitchGame;
  const activeLanguage = normalizeTwitchLiveLanguage(searchParams.get('language') ?? undefined);
  const activeSort = normalizeTwitchLiveSort(searchParams.get('sort') ?? undefined);
  const languageOptions: ComboboxOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: t.allLanguages,
        keywords: ['all', t.allLanguages],
      },
      ...initialData.languages.map((item) => ({
        value: item.value,
        label: getLanguageLabel(item.label, getIntlLocale(initialData.locale)),
        keywords: [item.value, item.label],
      })),
    ],
    [initialData.languages, initialData.locale, t.allLanguages],
  );
  const sortOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'viewers', label: t.sortViewers, keywords: ['viewers', t.sortViewers] },
      { value: 'started', label: t.sortStartedNewest, keywords: ['started', t.sortStartedNewest] },
    ],
    [t.sortStartedNewest, t.sortViewers],
  );

  const visibleItems = useMemo(() => {
    const filtered = initialData.items.filter((item) => {
      if (activeLanguage !== 'all' && item.language.trim().toLowerCase() !== activeLanguage) {
        return false;
      }

      return true;
    });

    return filtered.sort((left, right) => {
      if (activeSort === 'started') {
        return new Date(right.startedAt).valueOf() - new Date(left.startedAt).valueOf();
      }

      return right.viewerCount - left.viewerCount;
    });
  }, [activeLanguage, activeSort, initialData.items]);

  const updateQuery = (patch: Partial<Record<'language' | 'sort', string>>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === 'all' || (key === 'sort' && value === 'viewers')) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    const nextQuery = nextParams.toString();
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  };

  return (
    <RankingPageShell title={initialData.game?.name ?? t.title} jsonLd={jsonLd}>
      <div className="mb-4 max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-3xl">
          {initialData.game ? `${t.title} - ${initialData.game.name}` : t.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t.subtitle}</p>
      </div>

      {initialData.game ? (
        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <div className="relative h-28 w-20 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              {initialData.game.boxArtUrl ? (
                <Image src={initialData.game.boxArtUrl} alt={initialData.game.name} fill sizes="80px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{initialData.game.name}</div>
              <RankingMetaRow
                className="mt-2"
                items={[
                  { label: t.updatedAtLabel, value: formatRelativeUpdate(initialData.fetchedAt, initialData.locale) },
                  { label: t.itemsLabel, value: String(initialData.items.length) },
                ]}
              />
              <a
                href={initialData.game.directoryUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 dark:text-zinc-300 dark:decoration-zinc-700 dark:hover:text-zinc-50"
              >
                {t.openOfficialDirectory}
              </a>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-2 border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
        <CardContent className="flex flex-wrap items-end gap-2 p-4">
          <div className="w-full min-[360px]:w-[260px]">
            <RankingFilterField
              label={t.filterLanguageLabel}
              options={languageOptions}
              value={activeLanguage}
              placeholder={t.filterLanguageSearchPlaceholder}
              emptyText={t.filterNoMatch}
              clearLabel={t.clearSearch}
              onValueChange={(value) => updateQuery({ language: value })}
            />
          </div>
          <div className="w-full min-[360px]:w-[240px]">
            <RankingFilterField
              label={t.filterSortLabel}
              options={sortOptions}
              value={activeSort}
              placeholder={t.filterSortSearchPlaceholder}
              emptyText={t.filterNoMatch}
              clearLabel={t.clearSearch}
              onValueChange={(value) => updateQuery({ sort: value })}
            />
          </div>
        </CardContent>
      </Card>

      {initialData.errorMessage ? (
        <Card className="mt-2 border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-4 text-base text-red-700 dark:text-red-200">{initialData.errorMessage}</CardContent>
        </Card>
      ) : null}

      {!initialData.errorMessage && visibleItems.length === 0 ? (
        <Card className="mt-2 border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <CardContent className="p-10 text-center text-zinc-500 dark:text-zinc-400">{t.emptyState}</CardContent>
        </Card>
      ) : null}

      {!initialData.errorMessage && visibleItems.length > 0 ? (
        <div className={CARD_GRID_CLASS}>
          {visibleItems.map((item, index) => (
            <TwitchStreamCard key={item.streamId} item={item} locale={initialData.locale} rank={index + 1} />
          ))}
        </div>
      ) : null}
    </RankingPageShell>
  );
}
