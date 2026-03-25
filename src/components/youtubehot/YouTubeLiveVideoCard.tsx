import { ThumbsUp } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { formatCompactNumber, formatMonthDayTime } from '@/i18n/format';
import { usesTightUnitSpacing } from '@/i18n/locale-meta';
import { getMessages } from '@/i18n/messages';
import type { YouTubeLiveItem } from '@/lib/youtube-hot/types';
import { YouTubeVideoCard, type YouTubeVideoCardTag } from '@/components/youtubehot/YouTubeVideoCard';

interface YouTubeLiveVideoCardProps {
  item: YouTubeLiveItem;
  locale: Locale;
  categoryLabel: string;
  languageLabel: string;
}

function formatSubscriberText(item: YouTubeLiveItem, locale: Locale) {
  const t = getMessages(locale).youtubeLive;
  if (item.hiddenSubscriberCount) return t.cardSubscribersHidden;
  return `${formatCompactNumber(item.subscriberCount, locale)} ${t.cardSubscriberSuffix}`;
}

function formatWatchingText(value: number | null | undefined, locale: Locale, t: ReturnType<typeof getMessages>['youtubeLive']) {
  const compact = formatCompactNumber(value, locale);
  if (usesTightUnitSpacing(locale)) {
    return `${compact}${t.cardWatching}`;
  }
  return `${compact} ${t.cardWatching}`;
}

function buildMetricTag(value: number | null | undefined, locale: Locale): YouTubeVideoCardTag | null {
  if (value == null || !Number.isFinite(value)) return null;

  return {
    text: formatCompactNumber(value, locale),
    variant: 'outline',
    className: 'border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400',
    icon: <ThumbsUp className="size-3.5" aria-hidden="true" />,
  };
}

export function YouTubeLiveVideoCard({ item, locale, categoryLabel, languageLabel }: YouTubeLiveVideoCardProps) {
  const t = getMessages(locale).youtubeLive;
  const tags: YouTubeVideoCardTag[] = [
    {
      text: languageLabel,
      variant: 'outline',
      className: 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
    },
    {
      text: categoryLabel,
      variant: 'outline',
      className: 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
    },
    buildMetricTag(item.likeCount, locale),
  ].filter((tag): tag is YouTubeVideoCardTag => tag !== null);

  return (
    <YouTubeVideoCard
      videoHref={item.videoUrl}
      videoTitle={item.title}
      thumbnailUrl={item.thumbnailUrl}
      noThumbnailText={t.cardNoThumbnail}
      channelHref={item.channelUrl}
      channelTitle={item.channelTitle}
      channelAvatarUrl={item.channelAvatarUrl}
      metaLeft={formatSubscriberText(item, locale)}
      metaRightTop={formatWatchingText(item.concurrentViewers, locale, t)}
      metaRightBottom={formatMonthDayTime(item.startedAt, locale)}
      tags={tags}
    />
  );
}
