'use client';

import { SpotifyChartScaffold } from '@/components/spotify/SpotifyChartScaffold';
import { SpotifyTrackCard } from '@/components/spotify/SpotifyTrackCard';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import type { SpotifyChartItem, SpotifyCountryOption } from '@/lib/spotify/types';

interface SpotifyGridPageProps {
  country: string;
  countries: SpotifyCountryOption[];
  items: SpotifyChartItem[];
  fetchedAt: string | null;
  chartEndDate: string;
  sourceUrl: string;
  itemCount: number;
  errorMessage?: string | null;
  locale: Locale;
  jsonLd?: unknown;
}

const CARD_GRID_CLASS = 'mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4';

export function SpotifyGridPage({
  country,
  countries,
  items,
  fetchedAt,
  chartEndDate,
  sourceUrl,
  errorMessage,
  locale,
  jsonLd,
}: SpotifyGridPageProps) {
  const t = getMessages(locale).spotify;
  const grid =
    items.length > 0 ? (
      <div className={CARD_GRID_CLASS}>
        {items.map((item) => (
          <SpotifyTrackCard
            key={`${chartEndDate}-${item.rank}-${item.spotifyTrackId ?? item.trackName}`}
            item={item}
            locale={locale}
            chartEndDate={chartEndDate}
            fallbackHref={sourceUrl}
          />
        ))}
      </div>
    ) : null;

  return (
    <SpotifyChartScaffold
      locale={locale}
      t={t}
      country={country}
      countries={countries}
      fetchedAt={fetchedAt}
      sourceUrl={sourceUrl}
      errorMessage={errorMessage}
      jsonLd={jsonLd}
    >
      {grid}
    </SpotifyChartScaffold>
  );
}
