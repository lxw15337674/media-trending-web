'use client';

import type { Locale } from '@/i18n/config';
import { formatRelativeUpdate } from '@/i18n/format';
import type { XTrendPageData } from '@/lib/x-trends/page-data';
import type { XTrendQueryItem } from '@/lib/x-trends/types';

interface XTrendRegionCardProps {
  label: string;
  regionKey: string;
  items: XTrendPageData['groups'][number]['items'];
  updatedAt: string;
  locale: Locale;
}

function buildTrendHref(item: XTrendQueryItem) {
  if (item.trendUrl) {
    return item.trendUrl;
  }

  const query = encodeURIComponent(item.queryText || item.trendName);
  return `https://x.com/search?q=${query}&src=trend_click`;
}

export function XTrendRegionCard({ label, regionKey, items, updatedAt, locale }: XTrendRegionCardProps) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-white/8 bg-[#131418] shadow-[0_16px_56px_rgba(0,0,0,0.28)]">
      <header className="flex items-center justify-between gap-2.5 border-b border-white/6 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/12 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
            {regionKey}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-zinc-50">{label}</h2>
          </div>
        </div>
        <div className="shrink-0 text-[11px] font-medium text-zinc-500">{formatRelativeUpdate(updatedAt, locale)}</div>
      </header>

      <div className="divide-y divide-white/6">
        {items.map((item) => {
          const href = buildTrendHref(item);

          return (
            <a
              key={`${item.snapshotHour}-${item.regionKey}-${item.rank}-${item.normalizedKey}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="grid grid-cols-[24px,1fr] items-start gap-2.5 px-3.5 py-2 transition-colors hover:bg-white/[0.035]"
            >
              <div className="pt-0.5 text-[13px] font-medium tabular-nums text-zinc-500">{item.rank}</div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium leading-5.5 text-zinc-100">{item.trendName}</div>
                {item.queryText && item.queryText !== item.trendName ? (
                  <div className="truncate text-[11px] leading-4.5 text-zinc-500">{item.queryText}</div>
                ) : null}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
