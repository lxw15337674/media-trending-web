'use client';

import { AppStoreGameCard } from '@/components/appstoregames/AppStoreGameCard';
import { AppStoreGameChartScaffold } from '@/components/appstoregames/AppStoreGameChartScaffold';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { getLocalizedAppStoreGameCountryLabel } from '@/lib/app-store-games/labels';
import type { AppStoreGameChartItem, AppStoreGameChartOption, AppStoreGameCountryOption } from '@/lib/app-store-games/types';
import { createRegionDisplayNames } from '@/lib/youtube-hot/labels';

interface AppStoreGameGridPageProps {
  chartType: string;
  chartLabel: string;
  charts: AppStoreGameChartOption[];
  country: string;
  countryName: string;
  countries: AppStoreGameCountryOption[];
  items: AppStoreGameChartItem[];
  fetchedAt: string | null;
  snapshotHour: string | null;
  sourceUrl: string;
  itemCount: number;
  errorMessage?: string | null;
  locale: Locale;
  jsonLd?: unknown;
}

const CARD_GRID_CLASS = 'mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4';

export function AppStoreGameGridPage({
  chartType,
  chartLabel,
  country,
  countryName,
  charts,
  countries,
  items,
  fetchedAt,
  sourceUrl,
  errorMessage,
  locale,
  jsonLd,
}: AppStoreGameGridPageProps) {
  const t = getMessages(locale).appStoreGames;
  const regionDisplayNames = createRegionDisplayNames(locale);
  const countryLabel = getLocalizedAppStoreGameCountryLabel(country, countryName, locale, regionDisplayNames);
  const subtitle = t.subtitle.replace('{chart}', chartLabel).replace('{country}', countryLabel);
  const grid =
    items.length > 0 ? (
      <div className={CARD_GRID_CLASS}>
        {items.map((item) => (
          <AppStoreGameCard key={`${chartType}-${country}-${item.rank}-${item.appId}`} item={item} locale={locale} />
        ))}
      </div>
    ) : null;

  return (
    <AppStoreGameChartScaffold
      locale={locale}
      t={{
        title: t.title,
        subtitle,
        chartSelectorLabel: t.chartSelectorLabel,
        filterCountryLabel: t.filterCountryLabel,
        filterCountrySearchPlaceholder: t.filterCountrySearchPlaceholder,
        filterNoMatch: t.filterNoMatch,
        clearSearch: t.clearSearch,
        updatedAtLabel: t.updatedAtLabel,
        emptyState: t.emptyState,
        openOfficialChart: t.openOfficialChart,
      }}
      chartType={chartType}
      charts={charts}
      country={country}
      countries={countries}
      fetchedAt={fetchedAt}
      sourceUrl={sourceUrl}
      errorMessage={errorMessage}
      jsonLd={jsonLd}
    >
      {grid}
    </AppStoreGameChartScaffold>
  );
}
