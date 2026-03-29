import { Fragment } from 'react';

interface RankingMetaItem {
  label: string;
  value: string;
}

interface RankingMetaRowProps {
  items: RankingMetaItem[];
  className?: string;
}

export function RankingMetaRow({ items, className }: RankingMetaRowProps) {
  return (
    <div className={['flex flex-wrap items-center gap-x-3 gap-y-2 text-sm', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${item.value}-${index}`}>
          {index > 0 ? <span className="text-zinc-300 dark:text-zinc-700">·</span> : null}
          <span className="inline-flex items-center gap-1">
            <span className="text-zinc-400 dark:text-zinc-500">{item.label}</span>
            <span className="text-zinc-600 dark:text-zinc-300">{item.value}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}
