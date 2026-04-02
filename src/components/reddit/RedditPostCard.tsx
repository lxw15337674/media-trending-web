'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Locale } from '@/i18n/config';
import { formatCompactNumber, formatMonthDayTime } from '@/i18n/format';
import { getMessages } from '@/i18n/messages';
import type { RedditPostItem } from '@/lib/reddit/types';

interface RedditPostCardProps {
  item: RedditPostItem;
  locale: Locale;
}

export function RedditPostCard({ item, locale }: RedditPostCardProps) {
  const t = getMessages(locale).reddit;

  return (
    <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">r/{item.subreddit}</span>
          {item.isNsfw ? (
            <span className="rounded-full border border-rose-300 px-2 py-0.5 text-rose-700 dark:border-rose-900 dark:text-rose-300">
              NSFW
            </span>
          ) : null}
          {item.isVideo ? (
            <span className="rounded-full border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">Video</span>
          ) : null}
        </div>

        <a
          href={item.permalink}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-lg font-semibold leading-7 text-zinc-950 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-200"
        >
          {item.title}
        </a>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span>{t.cardScore} {formatCompactNumber(item.score, locale)}</span>
          <span>{t.cardComments} {formatCompactNumber(item.commentCount, locale)}</span>
          <span>{t.cardAuthor} u/{item.author}</span>
          <span>{t.cardPostedAt} {formatMonthDayTime(item.createdAt, locale)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href={item.permalink}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:text-zinc-300"
          >
            {t.openOnReddit}
          </a>
          <a
            href={item.outboundUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 dark:text-zinc-300 dark:decoration-zinc-700 dark:hover:text-zinc-50"
          >
            {t.openOutbound}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
