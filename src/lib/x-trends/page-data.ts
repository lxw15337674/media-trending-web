import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { classifyRuntimeError, logServerError } from '@/lib/server/runtime-error';
import { readSearchParamRaw, type SearchParamsInput } from '@/lib/server/search-params';
import { queryLatestXTrendRegionGroups } from '@/lib/x-trends/db';
import type { XTrendRegionGroup, XTrendRegionOption } from '@/lib/x-trends/types';

const DEFAULT_PAGE_SIZE = 20;

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeRegionKey(rawValue: string | string[] | undefined) {
  const value = takeFirst(rawValue)?.trim().toLowerCase() ?? '';
  return value || null;
}

function hasRegion(regions: XTrendRegionOption[], regionKey: string | null) {
  if (!regionKey) return false;
  return regions.some((item) => item.regionKey === regionKey);
}

export interface XTrendPageData {
  focusRegion: string;
  groups: XTrendRegionGroup[];
  regions: XTrendRegionOption[];
  generatedAt: string;
  snapshotHour: string | null;
  totalRegions: number;
  errorMessage?: string | null;
  locale: Locale;
}

export async function buildXTrendPageData(
  rawSearchParams: SearchParamsInput,
  locale: Locale,
): Promise<XTrendPageData> {
  const t = getMessages(locale).xTrending;
  const fallbackNow = new Date().toISOString();

  try {
    const overview = await queryLatestXTrendRegionGroups(DEFAULT_PAGE_SIZE);
    const regions = overview.groups.map((group) => ({
      regionKey: group.regionKey,
      regionLabel: group.regionLabel,
      itemCount: group.itemCount,
    }));

    if (!overview.batch || !regions.length) {
      return {
        focusRegion: 'all',
        groups: [],
        regions: [],
        generatedAt: fallbackNow,
        snapshotHour: null,
        totalRegions: 0,
        errorMessage: t.errorNoSnapshot,
        locale,
      };
    }

    const requestedRegion = normalizeRegionKey(readSearchParamRaw(rawSearchParams, 'region'));
    const focusRegion = hasRegion(regions, requestedRegion) ? requestedRegion ?? 'all' : 'all';

    return {
      focusRegion,
      groups: overview.groups,
      regions,
      generatedAt: overview.batch.generatedAt ?? fallbackNow,
      snapshotHour: overview.batch.snapshotHour ?? null,
      totalRegions: regions.length,
      locale,
    };
  } catch (error) {
    logServerError('x-trends/page-data', error);
    let errorMessage: string = t.errorLoad;
    const category = classifyRuntimeError(error);
    if (category === 'missing_db_env') {
      errorMessage = t.errorNoDbEnv;
    } else if (category === 'missing_table') {
      errorMessage = t.errorNoTable;
    } else if (category === 'query_failed' || category === 'network' || category === 'auth') {
      errorMessage = t.errorQueryFailed;
    }

    return {
      focusRegion: 'all',
      groups: [],
      regions: [],
      generatedAt: fallbackNow,
      snapshotHour: null,
      totalRegions: 0,
      errorMessage,
      locale,
    };
  }
}
