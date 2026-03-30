'use client';

import { ArrowDownRight, ArrowRight, ArrowUpRight, Flame } from 'lucide-react';
import { formatCompactNumber } from '@/i18n/format';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import type { TikTokHashtagQueryItem } from '@/lib/tiktok-hashtag-trends/types';

interface TikTokTrendCardProps {
  label: string;
  countryCode: string;
  items: TikTokHashtagQueryItem[];
  locale: Locale;
}

function getMovement(item: TikTokHashtagQueryItem, t: ReturnType<typeof getMessages>['tiktokTrending']) {
  if (item.rankDiffType === 3) {
    return {
      label: t.cardMovementNew,
      tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
      icon: Flame,
    };
  }

  if ((item.rankDiff ?? 0) > 0 || item.rankDiffType === 1) {
    return {
      label: `${t.cardMovementUp} ${Math.abs(item.rankDiff ?? 0)}`,
      tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      icon: ArrowUpRight,
    };
  }

  if ((item.rankDiff ?? 0) < 0 || item.rankDiffType === 2) {
    return {
      label: `${t.cardMovementDown} ${Math.abs(item.rankDiff ?? 0)}`,
      tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      icon: ArrowDownRight,
    };
  }

  return {
    label: t.cardMovementFlat,
    tone: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
    icon: ArrowRight,
  };
}

export function TikTokTrendCard({ label, countryCode, items, locale }: TikTokTrendCardProps) {
  const t = getMessages(locale).tiktokTrending;

  return (
    <article className="overflow-hidden rounded-[20px] border border-white/8 bg-[#131418] shadow-[0_16px_56px_rgba(0,0,0,0.28)]">
      <header className="flex items-center justify-between gap-2.5 border-b border-white/6 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/12 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
            {countryCode}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-zinc-50">{label}</h2>
          </div>
        </div>
      </header>

      <div className="divide-y divide-white/6">
        {items.map((item) => {
          const movement = getMovement(item, t);
          const MovementIcon = movement.icon;

          return (
            <a
              key={`${item.snapshotHour}-${item.countryCode}-${item.rank}-${item.hashtagId}`}
              href={item.publicTagUrl}
              target="_blank"
              rel="noreferrer"
              className="grid grid-cols-[24px,1fr] items-start gap-2.5 px-3.5 py-2 transition-colors hover:bg-white/[0.035]"
            >
              <span className="pt-0.5 text-[13px] font-medium tabular-nums text-zinc-500">{item.rank}</span>
              <div className="min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 truncate text-[14px] font-medium leading-5.5 text-zinc-100">
                    #{item.hashtagName}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-1.5 py-0.5 text-[11px] leading-4.5 ${movement.tone}`}
                  >
                    <MovementIcon className="size-3" />
                    <span>{movement.label}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] leading-4.5 text-zinc-500">
                  <span>
                    {t.publishCountLabel}: {formatCompactNumber(item.publishCount, locale)}
                  </span>
                  <span>
                    {t.videoViewsLabel}: {formatCompactNumber(item.videoViews, locale)}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </article>
  );
}
