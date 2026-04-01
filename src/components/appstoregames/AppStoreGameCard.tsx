'use client';

import { YouTubeVideoCard, type YouTubeVideoCardTag } from '@/components/youtubehot/YouTubeVideoCard';
import type { Locale } from '@/i18n/config';
import { formatMonthDay } from '@/i18n/format';
import { getMessages } from '@/i18n/messages';
import type { AppStoreGameChartItem } from '@/lib/app-store-games/types';

interface AppStoreGameCardProps {
  item: AppStoreGameChartItem;
  locale: Locale;
}

export function AppStoreGameCard({ item, locale }: AppStoreGameCardProps) {
  const t = getMessages(locale).appStoreGames;
  const tags: YouTubeVideoCardTag[] = [
    {
      text: `#${item.rank}`,
      variant: 'default',
      className: 'bg-sky-700 text-white dark:bg-sky-500 dark:text-zinc-950',
    },
  ];

  if (item.priceLabel) {
    tags.push({
      text: item.priceLabel,
      variant: 'outline',
      className: 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
    });
  }

  if (item.categoryName) {
    tags.push({
      text: item.categoryName,
      variant: 'outline',
      className: 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300',
    });
  }

  const releaseDateText = item.releaseDate ? `${t.cardReleaseDate} ${formatMonthDay(item.releaseDate, locale)}` : null;

  return (
    <YouTubeVideoCard
      videoHref={item.storeUrl}
      videoTitle={item.appName}
      thumbnailUrl={item.artworkUrl}
      noThumbnailText={t.cardNoThumbnail}
      channelHref={item.developerUrl || item.storeUrl}
      channelTitle={item.developerName}
      channelAvatarUrl={null}
      metaLeft={item.summary || item.categoryName || t.platformName}
      metaRightTop={item.priceAmount ? `${item.priceAmount}${item.currencyCode ? ` ${item.currencyCode}` : ''}` : item.priceLabel || undefined}
      metaRightBottom={releaseDateText || undefined}
      tags={tags}
    />
  );
}
