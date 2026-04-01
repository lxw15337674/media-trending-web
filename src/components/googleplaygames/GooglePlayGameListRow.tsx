'use client';

import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import type { GooglePlayGameChartItem } from '@/lib/google-play-games/types';

interface GooglePlayGameListRowProps {
  item: GooglePlayGameChartItem;
  locale: Locale;
}

export function GooglePlayGameListRow({ item, locale }: GooglePlayGameListRowProps) {
  const t = getMessages(locale).googlePlayGames;
  const subtitle = item.genreSummary || item.appId;

  return (
    <a
      href={item.storeUrl}
      target="_blank"
      rel="noreferrer"
      className="grid grid-cols-[36px,48px,1fr] items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/[0.035] xl:grid-cols-[36px,52px,1fr]"
    >
      <div className="pt-0.5 text-[12px] font-semibold tabular-nums text-cyan-300">#{item.rank}</div>

      <div className="relative size-12 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/8 xl:size-[52px]">
        {item.artworkUrl ? (
          <Image src={item.artworkUrl} alt={item.appName} fill sizes="52px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] leading-4 text-zinc-500">
            {t.cardNoThumbnail}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold tracking-tight text-zinc-50">{item.appName}</div>
        <div className="mt-0.5 truncate text-[11px] leading-4.5 text-zinc-400">{subtitle}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {item.ratingValue ? (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              {item.ratingValue}
            </span>
          ) : null}
          {item.priceText ? (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-200">
              {item.priceText}
            </span>
          ) : null}
          {item.primaryGenre ? (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              {item.primaryGenre}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}
