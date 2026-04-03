import { sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { dedupeItemsByRank } from './snapshot-utils';
import { createSnapshotCache } from './snapshot-cache';

/**
 * Configuration for generic snapshot saving with transaction.
 */
export interface SnapshotSaveConfig<TSnapshot, TItem extends { rank: number }> {
  /** Deduplicate items before saving */
  dedupe?: boolean;
  /** Main upsert SQL that returns the inserted snapshot id */
  upsertSnapshot: (snapshot: TSnapshot, items: TItem[]) => Promise<number>;
  /** Delete existing items for this snapshot */
  deleteItems: (snapshotId: number) => Promise<void>;
  /** Insert all items */
  insertItems: (snapshotId: number, items: TItem[], snapshot: TSnapshot) => Promise<void>;
  /** Error message when upsert fails */
  errorMessage?: string;
}

/**
 * Execute the complete snapshot saving process:
 * 1. Deduplicate items by rank (optional, default true)
 * 2. Start transaction
 * 3. Upsert snapshot to main table
 * 4. Delete old items
 * 5. Insert new items
 * 6. Clear cache
 */
export async function saveSnapshotWithTransaction<TSnapshot extends {
  items: readonly TItem[];
  countryCode: string;
  chartEndDate: string;
  fetchedAt: string;
}, TItem extends { rank: number }>(
  snapshot: TSnapshot,
  config: SnapshotSaveConfig<TSnapshot, TItem>,
  clearCache: () => void,
): Promise<number> {
  const shouldDedupe = config.dedupe !== false;
  const { items, duplicateCount } = shouldDedupe
    ? dedupeItemsByRank(Array.from(snapshot.items))
    : { items: Array.from(snapshot.items), duplicateCount: 0 };

  if (duplicateCount > 0) {
    console.warn(
      `[snapshot] deduped ${duplicateCount} items for ${snapshot.countryCode} ${snapshot.chartEndDate}`,
    );
  }

  const snapshotId = await db.transaction(async (tx) => {
    return await config.upsertSnapshot(snapshot, items);
  });

  clearCache();
  return snapshotId;
}

/**
 * Create a complete snapshot saver with built-in caching.
 */
export function createSnapshotSaver<TSnapshot extends {
  items: readonly TItem[];
  countryCode: string;
  chartEndDate: string;
  fetchedAt: string;
}, TItem extends { rank: number }, TData>(
  config: SnapshotSaveConfig<TSnapshot, TItem> & {
    /** Cache key generator from country code */
    getCacheKey: (normalizedCountry: string) => string;
    /** Actual query to get data from DB */
    fetchLatestFromDB: (cacheKey: string, normalizedCountry: string) => Promise<TData | null>;
  },
) {
  const cache = createSnapshotCache<string, TData | null>();

  async function saveSnapshot(snapshot: TSnapshot): Promise<number> {
    return saveSnapshotWithTransaction(snapshot, config, cache.clear);
  }

  function getCachedLatest(normalizedCountry: string): TData | null {
    const cacheKey = config.getCacheKey(normalizedCountry);
    return cache.get(cacheKey) ?? null;
  }

  async function getLatest(normalizedCountry: string): Promise<TData | null> {
    const cacheKey = config.getCacheKey(normalizedCountry);
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const data = await config.fetchLatestFromDB(cacheKey, normalizedCountry);
    cache.set(cacheKey, data);
    return data;
  }

  return {
    saveSnapshot,
    getCachedLatest,
    getLatest,
    clearCache: cache.clear,
  };
}

