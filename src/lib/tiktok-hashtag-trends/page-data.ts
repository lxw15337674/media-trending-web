import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveStandardPageDataErrorMessage } from '@/lib/page-data/runtime-error-message';
import { normalizeCountryCode } from '@/lib/page-data/search-param-utils';
import { logServerError } from '@/lib/server/runtime-error';
import { readSearchParamRaw, type SearchParamsInput } from '@/lib/server/search-params';
import { queryLatestTikTokHashtagCountryGroups } from './db';
import type { TikTokHashtagCountryFilter, TikTokHashtagCountryGroup } from './types';

const DEFAULT_PAGE_SIZE = 20;

export interface TikTokTrendPageData {
  focusCountry: string;
  groups: TikTokHashtagCountryGroup[];
  countries: TikTokHashtagCountryFilter[];
  generatedAt: string;
  snapshotHour: string | null;
  sourceUrl: string;
  totalCountries: number;
  errorMessage?: string | null;
  locale: Locale;
}

export async function buildTikTokTrendPageData(
  rawSearchParams: SearchParamsInput,
  locale: Locale,
  preferredCountryCode?: string | null,
): Promise<TikTokTrendPageData> {
  const t = getMessages(locale).tiktokTrending;
  const fallbackNow = new Date().toISOString();
  const sourceUrl = 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en';

  try {
    const overview = await queryLatestTikTokHashtagCountryGroups(DEFAULT_PAGE_SIZE);
    const countries = overview.groups.map((group) => ({
      countryCode: group.countryCode,
      countryName: group.countryName,
      itemCount: group.itemCount,
    }));

    if (!overview.batch || !countries.length) {
      return {
        focusCountry: 'all',
        groups: [],
        countries: [],
        generatedAt: fallbackNow,
        snapshotHour: null,
        sourceUrl,
        totalCountries: 0,
        errorMessage: t.errorNoSnapshot,
        locale,
      };
    }

    const requestedCountry = normalizeCountryCode(readSearchParamRaw(rawSearchParams, 'country'));
    const focusCountry = requestedCountry && countries.some((item) => item.countryCode === requestedCountry) ? requestedCountry : 'all';

    const groups =
      focusCountry === 'all'
        ? overview.groups
        : overview.groups.filter((group) => group.countryCode === focusCountry);

    return {
      focusCountry,
      groups,
      countries,
      generatedAt: overview.batch.generatedAt ?? fallbackNow,
      snapshotHour: overview.batch.snapshotHour ?? null,
      sourceUrl,
      totalCountries: countries.length,
      locale,
    };
  } catch (error) {
    logServerError('tiktok-hashtag-trends/page-data', error);
    const errorMessage = resolveStandardPageDataErrorMessage(error, t);

    return {
      focusCountry: preferredCountryCode?.trim().toUpperCase() || 'all',
      groups: [],
      countries: [],
      generatedAt: fallbackNow,
      snapshotHour: null,
      sourceUrl,
      totalCountries: 0,
      errorMessage,
      locale,
    };
  }
}
