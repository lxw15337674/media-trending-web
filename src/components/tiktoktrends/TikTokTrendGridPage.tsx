'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type ComboboxOption } from '@/components/ui/combobox';
import { RankingFilterBar } from '@/components/rankings/RankingFilterBar';
import { RankingFilterField } from '@/components/rankings/RankingFilterField';
import { RankingPageShell } from '@/components/rankings/RankingPageShell';
import { RankingStatusCard } from '@/components/rankings/RankingStatusCard';
import { TikTokTrendCard } from '@/components/tiktoktrends/TikTokTrendCard';
import { getMessages } from '@/i18n/messages';
import { prioritizePreferredItem } from '@/lib/filters/prioritize-preferred-item';
import { createRegionDisplayNames, getLocalizedYouTubeRegionLabel } from '@/lib/youtube-hot/labels';
import { cn } from '@/lib/utils';
import type { TikTokTrendPageData } from '@/lib/tiktok-hashtag-trends/page-data';

interface TikTokTrendGridPageProps {
  initialData: TikTokTrendPageData;
  userCountry?: string | null;
  jsonLd?: unknown;
}

function buildCountryOptions(
  countries: TikTokTrendPageData['countries'],
  userCountry: string | null | undefined,
  locale: TikTokTrendPageData['locale'],
  allCountriesLabel: string,
) {
  const sortedCountries = prioritizePreferredItem(countries, (item) => item.countryCode, userCountry?.toUpperCase());
  const regionDisplayNames = createRegionDisplayNames(locale);
  return [
    {
      value: 'all',
      label: allCountriesLabel,
      keywords: ['all', allCountriesLabel],
    },
    ...sortedCountries.map((country) => ({
      value: country.countryCode.toLowerCase(),
      label: getLocalizedYouTubeRegionLabel(country.countryCode, country.countryName, locale, regionDisplayNames),
      keywords: [country.countryCode, country.countryName],
    })),
  ] satisfies ComboboxOption[];
}

export function TikTokTrendGridPage({ initialData, userCountry, jsonLd }: TikTokTrendGridPageProps) {
  const t = getMessages(initialData.locale).tiktokTrending;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCountry = (searchParams.get('country')?.trim().toUpperCase() || initialData.focusCountry).toLowerCase();
  const [selectedCountry, setSelectedCountry] = useState(activeCountry);

  useEffect(() => {
    setSelectedCountry(activeCountry);
  }, [activeCountry]);

  const availableCountryCodes = useMemo(
    () => new Set(initialData.countries.map((item) => item.countryCode.toLowerCase())),
    [initialData.countries],
  );
  const visibleCountry =
    selectedCountry !== 'all' && availableCountryCodes.has(selectedCountry)
      ? selectedCountry
      : 'all';
  const visibleGroups = useMemo(() => {
    if (visibleCountry === 'all') {
      return prioritizePreferredItem(initialData.groups, (group) => group.countryCode, userCountry?.toUpperCase());
    }

    return initialData.groups.filter((group) => group.countryCode.toLowerCase() === visibleCountry);
  }, [initialData.groups, userCountry, visibleCountry]);
  const countryOptions = useMemo(
    () => buildCountryOptions(initialData.countries, userCountry, initialData.locale, t.allCountries),
    [initialData.countries, initialData.locale, t.allCountries, userCountry],
  );

  const onCountryChange = (value: string) => {
    const nextCountry = value.trim().toLowerCase();
    if (!nextCountry || nextCountry === visibleCountry) {
      return;
    }

    setSelectedCountry(nextCountry);

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextCountry === 'all') {
      nextParams.delete('country');
    } else {
      nextParams.set('country', nextCountry.toUpperCase());
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  return (
    <RankingPageShell
      title={t.title}
      jsonLd={jsonLd}
      className="min-h-screen bg-[#090a0d] pb-10 text-zinc-100"
      sectionClassName="mx-auto flex w-full max-w-[1900px] flex-col gap-4 px-4 pt-3 md:px-6 md:pt-6 xl:px-8"
    >
      <RankingFilterBar>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full min-[420px]:w-[260px] xl:w-[300px]">
            <RankingFilterField
              label={t.filterCountryLabel}
              options={countryOptions}
              value={visibleCountry}
              placeholder={t.filterCountrySearchPlaceholder}
              emptyText={t.filterNoMatch}
              clearLabel={t.clearSearch}
              disabled={countryOptions.length === 0}
              onValueChange={onCountryChange}
            />
          </div>
          <div className="ml-auto text-xs font-medium text-zinc-500">
            {t.updatedAtLabel}: {initialData.snapshotHour ?? initialData.generatedAt}
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
            <TikTokTrendCard
              key={group.countryCode}
              label={group.countryName}
              countryCode={group.countryCode}
              items={group.items}
              locale={initialData.locale}
            />
          ))}
        </div>
      ) : null}
    </RankingPageShell>
  );
}
