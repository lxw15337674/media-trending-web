import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveStandardPageDataErrorMessage } from '@/lib/page-data/runtime-error-message';
import { normalizeLowercaseKey } from '@/lib/page-data/search-param-utils';
import { resolvePreferredCode } from '@/lib/page-data/selection-utils';
import { logServerError } from '@/lib/server/runtime-error';
import { readSearchParamRaw, type SearchParamsInput } from '@/lib/server/search-params';
import { queryLatestXTrendRegionGroups } from '@/lib/x-trends/db';
import type { XTrendRegionGroup, XTrendRegionOption } from '@/lib/x-trends/types';

const DEFAULT_PAGE_SIZE = 20;

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

    const requestedRegion = normalizeLowercaseKey(readSearchParamRaw(rawSearchParams, 'region'));
    const focusRegion = resolvePreferredCode({
      items: regions,
      candidates: [requestedRegion],
      getCode: (item) => item.regionKey,
      fallback: 'all',
    });

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
    const errorMessage = resolveStandardPageDataErrorMessage(error, t);

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
