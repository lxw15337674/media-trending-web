import type { SpotifyChartItem } from './types';

export function dedupeSpotifyItemsByRank(items: readonly SpotifyChartItem[]) {
  const seenRanks = new Set<number>();
  const deduped: SpotifyChartItem[] = [];
  let duplicateCount = 0;

  for (const item of items) {
    if (seenRanks.has(item.rank)) {
      duplicateCount += 1;
      continue;
    }

    seenRanks.add(item.rank);
    deduped.push(item);
  }

  return {
    items: deduped,
    duplicateCount,
  };
}
