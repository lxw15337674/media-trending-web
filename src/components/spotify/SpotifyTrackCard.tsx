'use client';

import { YouTubeVideoCard, type YouTubeVideoCardTag } from '@/components/youtubehot/YouTubeVideoCard';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import type { SpotifyChartItem } from '@/lib/spotify/types';

interface SpotifyTrackCardProps {
  item: SpotifyChartItem;
  locale: Locale;
  chartEndDate: string;
  fallbackHref: string;
}

function formatChartDate(value: string, locale: Locale) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(parsed);
}

function formatCompactNumber(value: number | null | undefined, locale: Locale) {
  if (value == null || value <= 0) return null;
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function SpotifyTrackCard({ item, locale, chartEndDate, fallbackHref }: SpotifyTrackCardProps) {
  const t = getMessages(locale).spotify;
  const trackHref = item.spotifyTrackUrl || fallbackHref;
  const streamText = formatCompactNumber(item.streamCount, locale);
  const tags: YouTubeVideoCardTag[] = [
    {
      text: `#${item.rank}`,
      variant: 'default',
      className: 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-zinc-950',
    },
  ];

  if (streamText) {
    tags.push({
      text: `${streamText} ${t.cardStreams}`,
      variant: 'outline',
      className: 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
    });
  }

  if (item.previousRank != null) {
    tags.push({
      text: `${t.cardPreviousRank} #${item.previousRank}`,
      variant: 'outline',
      className: 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
    });
  }

  return (
    <YouTubeVideoCard
      videoHref={trackHref}
      videoTitle={item.trackName}
      thumbnailUrl={item.thumbnailUrl}
      noThumbnailText={t.cardNoThumbnail}
      channelHref={trackHref}
      channelTitle={item.artistNames}
      channelAvatarUrl={null}
      metaLeft={item.artistNames}
      metaRightTop={item.albumName || streamText || undefined}
      metaRightBottom={`${t.cardChartDate} ${formatChartDate(chartEndDate, locale)}`}
      tags={tags}
    />
  );
}
