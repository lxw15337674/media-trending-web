import { sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { parseJsonObject, toJson, toNumber } from '@/lib/db/codec';
import { getAppStoreGameCountryName } from './countries';
import type { AppStoreGameCountryOption } from './types';
import type {
  AppStoreGameChartItem as AppStoreGameChartItemData,
  AppStoreGameChartSnapshot as AppStoreGameChartSnapshotData,
  AppStoreGameChartSnapshotWithItems,
  AppStoreGameChartType,
} from './types';
import {
  APP_STORE_GAME_CHART_TYPE_FREE,
  normalizeAppStoreGameChartType,
  normalizeAppStoreGameCountryCode,
} from './types';

interface SnapshotIdRow {
  id: number;
}

interface SnapshotRow {
  id: number;
  chartType: string;
  countryCode: string;
  countryName: string;
  snapshotHour: string;
  fetchedAt: string;
  sourceUrl: string;
  feedTitle: string;
  itemCount: number;
}

interface ItemRow {
  rank: number;
  appId: string;
  bundleId: string | null;
  appName: string;
  developerName: string;
  developerUrl: string | null;
  storeUrl: string;
  artworkUrl: string | null;
  summary: string | null;
  priceLabel: string | null;
  priceAmount: string | null;
  currencyCode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  releaseDate: string | null;
  rawItemJson: string | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let latestSnapshotCache:
  | {
      expiresAt: number;
      key: string;
      data: AppStoreGameChartSnapshotWithItems | null;
    }
  | null = null;

function clearCache() {
  latestSnapshotCache = null;
}

function getCacheHit() {
  if (!latestSnapshotCache) return null;
  if (Date.now() > latestSnapshotCache.expiresAt) return null;
  return latestSnapshotCache;
}

function dedupeItemsByRank(items: AppStoreGameChartItemData[]) {
  const seenRanks = new Set<number>();
  const deduped: AppStoreGameChartItemData[] = [];

  for (const item of items) {
    if (seenRanks.has(item.rank)) continue;
    seenRanks.add(item.rank);
    deduped.push(item);
  }

  return {
    items: deduped,
    duplicateCount: items.length - deduped.length,
  };
}

export async function saveAppStoreGameChartSnapshot(snapshot: AppStoreGameChartSnapshotData) {
  const { items, duplicateCount } = dedupeItemsByRank(snapshot.items);
  if (duplicateCount > 0) {
    console.warn(`[app-store-games] deduped ${duplicateCount} items for ${snapshot.chartType} ${snapshot.countryCode}`);
  }

  const snapshotId = await db.transaction(async (tx) => {
    const rows = await tx.all<SnapshotIdRow>(sql`
      INSERT INTO app_store_game_chart_snapshots (
        chart_type,
        country_code,
        country_name,
        snapshot_hour,
        fetched_at,
        source_url,
        feed_title,
        status,
        item_count,
        error_text,
        raw_payload,
        updated_at
      )
      VALUES (
        ${snapshot.chartType},
        ${snapshot.countryCode},
        ${snapshot.countryName},
        ${snapshot.snapshotHour},
        ${snapshot.fetchedAt},
        ${snapshot.sourceUrl},
        ${snapshot.feedTitle},
        'success',
        ${items.length},
        NULL,
        ${toJson(snapshot.rawPayload)},
        ${snapshot.fetchedAt}
      )
      ON CONFLICT(chart_type, country_code, snapshot_hour)
      DO UPDATE SET
        country_name = excluded.country_name,
        fetched_at = excluded.fetched_at,
        source_url = excluded.source_url,
        feed_title = excluded.feed_title,
        status = excluded.status,
        item_count = excluded.item_count,
        error_text = excluded.error_text,
        raw_payload = excluded.raw_payload,
        updated_at = excluded.updated_at
      RETURNING id
    `);

    const newSnapshotId = rows[0]?.id;
    if (!newSnapshotId) {
      throw new Error('Failed to upsert App Store game chart snapshot');
    }

    await tx.run(sql`DELETE FROM app_store_game_chart_items WHERE snapshot_id = ${newSnapshotId}`);

    if (items.length > 0) {
      const valueRows = items.map((item) => sql`
        (
          ${newSnapshotId},
          ${item.rank},
          ${item.appId},
          ${item.bundleId},
          ${item.appName},
          ${item.developerName},
          ${item.developerUrl},
          ${item.storeUrl},
          ${item.artworkUrl},
          ${item.summary},
          ${item.priceLabel},
          ${item.priceAmount},
          ${item.currencyCode},
          ${item.categoryId},
          ${item.categoryName},
          ${item.releaseDate},
          ${toJson(item.rawItem)},
          ${snapshot.fetchedAt}
        )
      `);

      await tx.run(sql`
        INSERT INTO app_store_game_chart_items (
          snapshot_id,
          rank,
          app_id,
          bundle_id,
          app_name,
          developer_name,
          developer_url,
          store_url,
          artwork_url,
          summary,
          price_label,
          price_amount,
          currency_code,
          category_id,
          category_name,
          release_date,
          raw_item_json,
          created_at
        )
        VALUES ${sql.join(valueRows, sql`, `)}
      `);
    }

    return newSnapshotId;
  });

  clearCache();
  return snapshotId;
}

export async function listLatestAppStoreGameCountries(chartTypeInput: string): Promise<AppStoreGameCountryOption[]> {
  const chartType = normalizeAppStoreGameChartType(chartTypeInput);
  const rows = await db.all<Pick<SnapshotRow, 'countryCode' | 'countryName'>>(sql`
    SELECT
      country_code as countryCode,
      MAX(country_name) as countryName
    FROM app_store_game_chart_snapshots
    WHERE chart_type = ${chartType}
      AND status = 'success'
    GROUP BY country_code
    ORDER BY country_code ASC
  `);

  return rows.map((row) => ({
    countryCode: normalizeAppStoreGameCountryCode(row.countryCode),
    countryName: row.countryName || getAppStoreGameCountryName(row.countryCode),
  }));
}

function mapItemRow(row: ItemRow): AppStoreGameChartItemData {
  return {
    rank: toNumber(row.rank, 0),
    appId: row.appId,
    bundleId: row.bundleId,
    appName: row.appName,
    developerName: row.developerName,
    developerUrl: row.developerUrl,
    storeUrl: row.storeUrl,
    artworkUrl: row.artworkUrl,
    summary: row.summary,
    priceLabel: row.priceLabel,
    priceAmount: row.priceAmount,
    currencyCode: row.currencyCode,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    releaseDate: row.releaseDate,
    rawItem: parseJsonObject(row.rawItemJson) ?? row.rawItemJson,
  };
}

export async function getLatestAppStoreGameChartSnapshot(
  chartTypeInput: string,
  countryCodeInput: string,
): Promise<AppStoreGameChartSnapshotWithItems | null> {
  const chartType = normalizeAppStoreGameChartType(chartTypeInput);
  const countryCode = normalizeAppStoreGameCountryCode(countryCodeInput);
  const cacheKey = `${chartType}|${countryCode}`;
  const cached = getCacheHit();
  if (cached && cached.key === cacheKey) return cached.data;

  const snapshotRows = await db.all<SnapshotRow>(sql`
    SELECT
      id,
      chart_type as chartType,
      country_code as countryCode,
      country_name as countryName,
      snapshot_hour as snapshotHour,
      fetched_at as fetchedAt,
      source_url as sourceUrl,
      feed_title as feedTitle,
      item_count as itemCount
    FROM app_store_game_chart_snapshots
    WHERE chart_type = ${chartType}
      AND country_code = ${countryCode}
      AND status = 'success'
    ORDER BY snapshot_hour DESC, fetched_at DESC, id DESC
    LIMIT 1
  `);

  const snapshot = snapshotRows[0];
  if (!snapshot) {
    latestSnapshotCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      key: cacheKey,
      data: null,
    };
    return null;
  }

  const items = await db.all<ItemRow>(sql`
    SELECT
      rank as rank,
      app_id as appId,
      bundle_id as bundleId,
      app_name as appName,
      developer_name as developerName,
      developer_url as developerUrl,
      store_url as storeUrl,
      artwork_url as artworkUrl,
      summary as summary,
      price_label as priceLabel,
      price_amount as priceAmount,
      currency_code as currencyCode,
      category_id as categoryId,
      category_name as categoryName,
      release_date as releaseDate,
      raw_item_json as rawItemJson
    FROM app_store_game_chart_items
    WHERE snapshot_id = ${snapshot.id}
    ORDER BY rank ASC
  `);

  const data: AppStoreGameChartSnapshotWithItems = {
    id: snapshot.id,
    chartType: normalizeAppStoreGameChartType(snapshot.chartType),
    countryCode,
    countryName: snapshot.countryName,
    snapshotHour: snapshot.snapshotHour,
    fetchedAt: snapshot.fetchedAt,
    sourceUrl: snapshot.sourceUrl,
    feedTitle: snapshot.feedTitle,
    itemCount: toNumber(snapshot.itemCount, 0),
    items: items.map(mapItemRow),
  };

  latestSnapshotCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    key: cacheKey,
    data,
  };

  return data;
}

export async function getLatestAppStoreGameTopFreeUsSnapshot() {
  return getLatestAppStoreGameChartSnapshot(APP_STORE_GAME_CHART_TYPE_FREE, 'US');
}

export function listAppStoreGameChartTypes(): AppStoreGameChartType[] {
  return [
    normalizeAppStoreGameChartType('topfree'),
    normalizeAppStoreGameChartType('toppaid'),
    normalizeAppStoreGameChartType('topgrossing'),
  ];
}
