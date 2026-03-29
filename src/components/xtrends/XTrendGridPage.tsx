'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type ComboboxOption } from '@/components/ui/combobox';
import { RankingFilterBar } from '@/components/rankings/RankingFilterBar';
import { RankingFilterField } from '@/components/rankings/RankingFilterField';
import { RankingPageShell } from '@/components/rankings/RankingPageShell';
import { RankingStatusCard } from '@/components/rankings/RankingStatusCard';
import { XTrendRegionCard } from '@/components/xtrends/XTrendRegionCard';
import { getMessages } from '@/i18n/messages';
import { prioritizePreferredItem } from '@/lib/filters/prioritize-preferred-item';
import type { XTrendPageData } from '@/lib/x-trends/page-data';
import { cn } from '@/lib/utils';

interface XTrendGridPageProps {
  initialData: XTrendPageData;
  userRegion?: string | null;
}

function normalizeRegion(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized || fallback;
}

function buildRegionOptions(
  regions: XTrendPageData['regions'],
  allRegionsLabel: string,
  userRegion: string | null | undefined,
) {
  const sortedRegions = prioritizePreferredItem(regions, (item) => item.regionKey, userRegion);
  return [
    {
      value: 'all',
      label: allRegionsLabel,
      keywords: ['all', allRegionsLabel],
    },
    ...sortedRegions.map((region) => ({
      value: region.regionKey,
      label: region.regionLabel,
      keywords: [region.regionKey, region.regionLabel],
    })),
  ] satisfies ComboboxOption[];
}

export function XTrendGridPage({ initialData, userRegion }: XTrendGridPageProps) {
  const t = getMessages(initialData.locale).xTrending;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedRegion, setSelectedRegion] = useState(initialData.focusRegion);

  const activeRegion = normalizeRegion(searchParams.get('region'), initialData.focusRegion);

  useEffect(() => {
    setSelectedRegion(activeRegion);
  }, [activeRegion]);

  const availableRegionKeys = useMemo(() => new Set(initialData.regions.map((item) => item.regionKey)), [initialData.regions]);
  const visibleRegion = selectedRegion !== 'all' && availableRegionKeys.has(selectedRegion) ? selectedRegion : 'all';
  const visibleGroups = useMemo(
    () =>
      visibleRegion === 'all'
        ? initialData.groups
        : initialData.groups.filter((group) => group.regionKey === visibleRegion),
    [initialData.groups, visibleRegion],
  );
  const regionOptions = useMemo(
    () => buildRegionOptions(initialData.regions, t.allRegions, userRegion),
    [initialData.regions, t.allRegions, userRegion],
  );

  const onRegionChange = (value: string) => {
    const nextRegion = value.trim().toLowerCase();
    if (!nextRegion || nextRegion === visibleRegion) {
      return;
    }

    setSelectedRegion(nextRegion);

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextRegion === 'all') {
      nextParams.delete('region');
    } else {
      nextParams.set('region', nextRegion);
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  return (
    <RankingPageShell
      title={t.title}
      className="min-h-screen bg-[#090a0d] pb-10 text-zinc-100"
      sectionClassName="mx-auto flex w-full max-w-[1900px] flex-col gap-4 px-4 pt-3 md:px-6 md:pt-6 xl:px-8"
    >
      <RankingFilterBar>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full min-[420px]:w-[260px] xl:w-[300px]">
            <RankingFilterField
              label={t.filterRegionSearchPlaceholder}
              options={regionOptions}
              value={visibleRegion}
              placeholder={t.filterRegionSearchPlaceholder}
              emptyText={t.filterNoMatch}
              clearLabel={t.clearSearch}
              onValueChange={onRegionChange}
            />
          </div>
        </div>
      </RankingFilterBar>

      {initialData.errorMessage ? (
        <RankingStatusCard
          variant="error"
          className="border-red-500/30 bg-red-950/30 shadow-none dark:border-red-500/30 dark:bg-red-950/30"
          contentClassName="p-4 text-base text-red-100 dark:text-red-100"
        >
          {initialData.errorMessage}
        </RankingStatusCard>
      ) : null}

      {!initialData.errorMessage && visibleGroups.length === 0 ? (
        <RankingStatusCard
          variant="empty"
          className="border-white/8 bg-[#131418] shadow-none dark:border-white/8 dark:bg-[#131418]"
          contentClassName="p-8 text-left text-sm text-zinc-400 dark:text-zinc-400"
        >
          {t.emptyState}
        </RankingStatusCard>
      ) : null}

      {visibleGroups.length > 0 ? (
        <div
          className={cn(
            'grid gap-4',
            visibleGroups.length === 1 ? 'grid-cols-1 xl:max-w-5xl' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
          )}
        >
          {visibleGroups.map((group) => (
            <XTrendRegionCard
              key={group.regionKey}
              label={group.regionLabel}
              regionKey={group.regionKey.toUpperCase()}
              items={group.items}
              updatedAt={initialData.generatedAt}
              locale={initialData.locale}
            />
          ))}
        </div>
      ) : null}
    </RankingPageShell>
  );
}
