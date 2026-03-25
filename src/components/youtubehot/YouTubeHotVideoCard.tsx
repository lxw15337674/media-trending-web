import type { Locale } from '@/i18n/config';
import { formatCompactNumber, formatMonthDay } from '@/i18n/format';
import { usesTightUnitSpacing } from '@/i18n/locale-meta';
import { getMessages } from '@/i18n/messages';
import { getYouTubeCategoryLabel } from '@/lib/youtube-hot/labels';
import type { YouTubeHotQueryItem } from '@/lib/youtube-hot/types';
import { YouTubeVideoCard, type YouTubeVideoCardTag } from '@/components/youtubehot/YouTubeVideoCard';

type YouTubeHotVideoCardProps =
  | {
      loading: true;
      locale?: Locale;
      item?: never;
    }
  | {
      loading?: false;
      locale: Locale;
      item: YouTubeHotQueryItem;
    };

function formatSubscriberText(item: YouTubeHotQueryItem, locale: Locale, t: ReturnType<typeof getMessages>['youtubeHot']) {
  if (item.hiddenSubscriberCount) {
    return t.cardSubscribersHidden;
  }
  return `${formatCompactNumber(item.subscriberCount, locale)} ${t.cardSubscriberSuffix}`;
}

function formatRegionCount(regionCount: number, locale: Locale, t: ReturnType<typeof getMessages>['youtubeHot']) {
  const compact = formatCompactNumber(regionCount, locale);
  return usesTightUnitSpacing(locale) ? `${compact}${t.cardRegionsListed}` : `${compact} ${t.cardRegionsListed}`;
}

function formatViewsText(value: number | null | undefined, locale: Locale, t: ReturnType<typeof getMessages>['youtubeHot']) {
  const compact = formatCompactNumber(value, locale);
  if (usesTightUnitSpacing(locale)) {
    return `${compact}${t.cardViews}`;
  }
  return `${compact} ${t.cardViews}`;
}

export function YouTubeHotVideoCard(props: YouTubeHotVideoCardProps) {
  if (props.loading) {
    return <YouTubeVideoCard loading tagsCount={2} />;
  }

  const item = props.item;
  const locale = props.locale;
  const t = getMessages(locale).youtubeHot;
  const regionCount = item.aggregateRegionCount ?? item.aggregateRegionCodes?.length ?? 0;
  const categoryLabel = getYouTubeCategoryLabel(item.categoryId, item.categoryTitle, locale);

  const tags: YouTubeVideoCardTag[] = [
    {
      text: formatRegionCount(regionCount, locale, t),
      variant: item.isGlobalAggregate ? 'default' : 'secondary',
    },
    {
      text: categoryLabel,
      variant: 'secondary',
    },
  ];

  return (
    <YouTubeVideoCard
      videoHref={item.videoUrl}
      videoTitle={item.title}
      thumbnailUrl={item.thumbnailUrl}
      noThumbnailText={t.cardNoThumbnail}
      channelHref={item.channelUrl}
      channelTitle={item.channelTitle}
      channelAvatarUrl={item.channelAvatarUrl}
      metaLeft={formatSubscriberText(item, locale, t)}
      metaRightTop={formatViewsText(item.viewCount, locale, t)}
      metaRightBottom={formatMonthDay(item.publishedAt, locale)}
      tags={tags}
    />
  );
}
