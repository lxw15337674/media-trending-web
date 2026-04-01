import axios from 'axios';
import { getAppStoreGameCountryName } from './countries';
import type { AppStoreGameChartItem, AppStoreGameChartSnapshot, AppStoreGameChartType } from './types';
import { APP_STORE_GAME_FEED_LIMIT, buildAppStoreGameFeedUrl, normalizeAppStoreGameCountryCode } from './types';

interface LegacyFeedLabel {
  label?: unknown;
  attributes?: Record<string, unknown>;
}

interface LegacyFeedEntry {
  [key: string]: unknown;
}

interface LegacyFeedPayload {
  feed?: {
    title?: LegacyFeedLabel | string;
    entry?: LegacyFeedEntry | LegacyFeedEntry[];
  };
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getLabel(value: unknown) {
  if (typeof value === 'string') return getString(value);
  if (!value || typeof value !== 'object') return null;
  return getString((value as LegacyFeedLabel).label);
}

function normalizeStoreUrl(value: string | null) {
  if (!value) return null;
  return value.replace(/\?uo=2$/, '');
}

function extractArtworkUrl(entry: Record<string, unknown>) {
  const images = entry['im:image'];
  if (!Array.isArray(images)) return null;
  const sorted = [...images].sort((left, right) => {
    const leftHeight = Number((left as { attributes?: { height?: string } })?.attributes?.height ?? 0);
    const rightHeight = Number((right as { attributes?: { height?: string } })?.attributes?.height ?? 0);
    return rightHeight - leftHeight;
  });
  for (const item of sorted) {
    const url = getLabel(item);
    if (url) return url;
  }
  return null;
}

function mapEntry(entry: Record<string, unknown>, rank: number): AppStoreGameChartItem | null {
  const appName = getLabel(entry['im:name']);
  const idAttributes = ((entry.id as { attributes?: Record<string, unknown> })?.attributes ?? {}) as Record<string, unknown>;
  const appId = getString(idAttributes['im:id']);
  const storeUrl = normalizeStoreUrl(
    getString(((entry.link as { attributes?: Record<string, unknown> })?.attributes ?? {})['href']) || getLabel(entry.id),
  );
  const developerName = getLabel(entry['im:artist']);

  if (!appName || !appId || !storeUrl || !developerName) {
    return null;
  }

  const priceAttributes = ((entry['im:price'] as { attributes?: Record<string, unknown> })?.attributes ?? {}) as Record<string, unknown>;
  const categoryAttributes = ((entry.category as { attributes?: Record<string, unknown> })?.attributes ?? {}) as Record<string, unknown>;
  const releaseDate = getLabel(entry['im:releaseDate']);

  return {
    rank,
    appId,
    bundleId: getString(idAttributes['im:bundleId']),
    appName,
    developerName,
    developerUrl: getString(((entry['im:artist'] as { attributes?: Record<string, unknown> })?.attributes ?? {})['href']),
    storeUrl,
    artworkUrl: extractArtworkUrl(entry),
    summary: getLabel(entry.summary),
    priceLabel: getLabel(entry['im:price']),
    priceAmount: getString(priceAttributes.amount),
    currencyCode: getString(priceAttributes.currency),
    categoryId: getString(categoryAttributes['im:id']),
    categoryName: getString(categoryAttributes.label) || getString(categoryAttributes.term),
    releaseDate,
    rawItem: entry,
  } satisfies AppStoreGameChartItem;
}

export class AppStoreGameChartsClient {
  async fetchChart(
    countryCodeInput: string,
    chartType: AppStoreGameChartType,
    snapshotHour: string,
  ): Promise<AppStoreGameChartSnapshot> {
    const countryCode = normalizeAppStoreGameCountryCode(countryCodeInput);
    const sourceUrl = buildAppStoreGameFeedUrl(countryCode, chartType, APP_STORE_GAME_FEED_LIMIT);
    const response = await axios.get<LegacyFeedPayload>(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        Accept: 'application/json,text/plain,*/*',
      },
      timeout: 30000,
      responseType: 'json',
    });

    const payload = response.data ?? {};
    const entries = Array.isArray(payload.feed?.entry)
      ? payload.feed?.entry
      : payload.feed?.entry
        ? [payload.feed.entry]
        : [];
    const items = entries
      .map((entry, index) => mapEntry((entry ?? {}) as Record<string, unknown>, index + 1))
      .filter((item): item is AppStoreGameChartItem => item !== null);

    if (!items.length) {
      throw new Error(`App Store games ${chartType} parser returned 0 items for ${countryCode}`);
    }

    return {
      chartType,
      countryCode,
      countryName: getAppStoreGameCountryName(countryCode),
      snapshotHour,
      fetchedAt: new Date().toISOString(),
      sourceUrl,
      feedTitle: getLabel(payload.feed?.title) ?? `${countryCode} ${chartType}`,
      items,
      rawPayload: payload,
    };
  }
}
