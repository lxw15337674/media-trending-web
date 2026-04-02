'use client';

import { YouTubeVideoCard, type YouTubeVideoCardTag } from '@/components/youtubehot/YouTubeVideoCard';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { normalizeAppleMusicArtworkUrl } from '@/lib/apple-music/artwork';
import type { AppleMusicChartItem } from '@/lib/apple-music/types';

interface AppleMusicTrackCardProps {
  item: AppleMusicChartItem;
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

function formatDuration(durationMs: number | null | undefined) {
  if (durationMs == null || durationMs <= 0) return null;

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function AppleMusicTrackCard({
  item,
  locale,
  chartEndDate,
  fallbackHref,
}: AppleMusicTrackCardProps) {
  const t = getMessages(locale).appleMusic;
  const trackHref = item.appleSongUrl || fallbackHref;
  const durationText = formatDuration(item.durationMs);
  const artworkUrl = normalizeAppleMusicArtworkUrl(item.thumbnailUrl);
  const tags: YouTubeVideoCardTag[] = [
    {
      text: `#${item.rank}`,
      variant: 'default',
      className: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950',
    },
  ];

  if (durationText) {
    tags.push({
      text: durationText,
      variant: 'outline',
      className: 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
    });
  }

  return (
    <YouTubeVideoCard
      videoHref={trackHref}
      videoTitle={item.trackName}
      thumbnailUrl={artworkUrl}
      noThumbnailText={t.cardNoThumbnail}
      channelHref={trackHref}
      channelTitle={item.artistNames}
      channelAvatarUrl={null}
      metaLeft={item.artistNames}
      metaRightTop={durationText}
      metaRightBottom={`${t.cardChartDate} ${formatChartDate(chartEndDate, locale)}`}
      tags={tags}
      mediaAspect="square"
    />
  );
}
