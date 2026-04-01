import { sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { parseJsonObject, toJson, toNumber } from '@/lib/db/codec';
import { getGooglePlayGameCountryName } from './countries';
import type { GooglePlayGameCountryOption } from './types';
import type {
  GooglePlayGameChartItem as GooglePlayGameChartItemData,
  GooglePlayGameChartSnapshot as GooglePlayGameChartSnapshotData,
  GooglePlayGameChartSnapshotWithItems,
  GooglePlayGameChartType,
} from './types';
import {
  GOOGLE_PLAY_GAME_CHART_TYPE_FREE,
  normalizeGooglePlayGameChartType,
  normalizeGooglePlayGameCountryCode,
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
  pageTitle: string;
  itemCount: number;
}

interface ItemRow {
  rank: number;
  appId: string;
  appName: string;
  developerName: string | null;
  storeUrl: string;
  artworkUrl: string | null;
  ratingText: string | null;
  ratingValue: string | null;
  priceText: string | null;
  primaryGenre: string | null;
  genreSummary: string | null;
  rawItemJson: string | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let latestSnapshotCache:
  | {
      expiresAt: number;
      key: string;
      data: GooglePlayGameChartSnapshotWithItems | null;
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

function dedupeItemsByRank(items: GooglePlayGameChartItemData[]) {
  const seenRanks = new Set<number>();
  const deduped: GooglePlayGameChartItemData[] = [];

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

export async function saveGooglePlayGameChartSnapshot(snapshot: GooglePlayGameChartSnapshotData) {
  const { items, duplicateCount } = dedupeItemsByRank(snapshot.items);
  if (duplicateCount > 0) {
    console.warn(`[google-play-games] deduped ${duplicateCount} items for ${snapshot.chartType} ${snapshot.countryCode}`);
  }

  const snapshotId = await db.transaction(async (tx) => {
    const rows = await tx.all<SnapshotIdRow>(sql`
      INSERT INTO google_play_game_chart_snapshots (
        chart_type,
        country_code,
        country_name,
        snapshot_hour,
        fetched_at,
        source_url,
        page_title,
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
        ${snapshot.pageTitle},
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
        page_title = excluded.page_title,
        status = excluded.status,
        item_count = excluded.item_count,
        error_text = excluded.error_text,
        raw_payload = excluded.raw_payload,
        updated_at = excluded.updated_at
      RETURNING id
    `);

    const newSnapshotId = rows[0]?.id;
    if (!newSnapshotId) {
      throw new Error('Failed to upsert Google Play game chart snapshot');
    }

    await tx.run(sql`DELETE FROM google_play_game_chart_items WHERE snapshot_id = ${newSnapshotId}`);

    if (items.length > 0) {
      const valueRows = items.map((item) => sql`
        (
          ${newSnapshotId},
          ${item.rank},
          ${item.appId},
          ${item.appName},
          ${item.developerName},
          ${item.storeUrl},
          ${item.artworkUrl},
          ${item.ratingText},
          ${item.ratingValue},
          ${item.priceText},
          ${item.primaryGenre},
          ${item.genreSummary},
          ${toJson(item.rawItem)},
          ${snapshot.fetchedAt}
        )
      `);

      await tx.run(sql`
        INSERT INTO google_play_game_chart_items (
          snapshot_id,
          rank,
          app_id,
          app_name,
          developer_name,
          store_url,
          artwork_url,
          rating_text,
          rating_value,
          price_text,
          primary_genre,
          genre_summary,
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

export async function listLatestGooglePlayGameCountries(chartTypeInput: string): Promise<GooglePlayGameCountryOption[]> {
  const chartType = normalizeGooglePlayGameChartType(chartTypeInput);
  const rows = await db.all<Pick<SnapshotRow, 'countryCode' | 'countryName'>>(sql`
    SELECT
      country_code as countryCode,
      MAX(country_name) as countryName
    FROM google_play_game_chart_snapshots
    WHERE chart_type = ${chartType}
      AND status = 'success'
    GROUP BY country_code
    ORDER BY country_code ASC
  `);

  return rows.map((row) => ({
    countryCode: normalizeGooglePlayGameCountryCode(row.countryCode),
    countryName: row.countryName || getGooglePlayGameCountryName(row.countryCode),
  }));
}

function mapItemRow(row: ItemRow): GooglePlayGameChartItemData {
  return {
    rank: toNumber(row.rank, 0),
    appId: row.appId,
    appName: row.appName,
    developerName: row.developerName,
    storeUrl: row.storeUrl,
    artworkUrl: row.artworkUrl,
    ratingText: row.ratingText,
    ratingValue: row.ratingValue,
    priceText: row.priceText,
    primaryGenre: row.primaryGenre,
    genreSummary: row.genreSummary,
    rawItem: parseJsonObject(row.rawItemJson) ?? row.rawItemJson,
  };
}

export async function getLatestGooglePlayGameChartSnapshot(
  chartTypeInput: string,
  countryCodeInput: string,
): Promise<GooglePlayGameChartSnapshotWithItems | null> {
  const chartType = normalizeGooglePlayGameChartType(chartTypeInput);
  const countryCode = normalizeGooglePlayGameCountryCode(countryCodeInput);
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
      page_title as pageTitle,
      item_count as itemCount
    FROM google_play_game_chart_snapshots
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
      app_name as appName,
      developer_name as developerName,
      store_url as storeUrl,
      artwork_url as artworkUrl,
      rating_text as ratingText,
      rating_value as ratingValue,
      price_text as priceText,
      primary_genre as primaryGenre,
      genre_summary as genreSummary,
      raw_item_json as rawItemJson
    FROM google_play_game_chart_items
    WHERE snapshot_id = ${snapshot.id}
    ORDER BY rank ASC
  `);

  const data: GooglePlayGameChartSnapshotWithItems = {
    id: snapshot.id,
    chartType: normalizeGooglePlayGameChartType(snapshot.chartType),
    countryCode,
    countryName: snapshot.countryName,
    snapshotHour: snapshot.snapshotHour,
    fetchedAt: snapshot.fetchedAt,
    sourceUrl: snapshot.sourceUrl,
    pageTitle: snapshot.pageTitle,
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

export async function getLatestGooglePlayGameTopFreeUsSnapshot() {
  return getLatestGooglePlayGameChartSnapshot(GOOGLE_PLAY_GAME_CHART_TYPE_FREE, 'US');
}

export function listGooglePlayGameChartTypes(): GooglePlayGameChartType[] {
  return [
    normalizeGooglePlayGameChartType('topfree'),
    normalizeGooglePlayGameChartType('toppaid'),
    normalizeGooglePlayGameChartType('topgrossing'),
  ];
}
