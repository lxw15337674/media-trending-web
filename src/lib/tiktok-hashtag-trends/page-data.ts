import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveStandardPageDataErrorMessage } from '@/lib/page-data/runtime-error-message';
import { normalizeCountryCode } from '@/lib/page-data/search-param-utils';
import { resolvePreferredCode } from '@/lib/page-data/selection-utils';
import { logServerError } from '@/lib/server/runtime-error';
import { readSearchParamRaw, type SearchParamsInput } from '@/lib/server/search-params';
import { listLatestTikTokHashtagCountries, queryLatestTikTokHashtags } from './db';
import type { TikTokHashtagCountryFilter, TikTokHashtagQueryItem } from './types';

export interface TikTokTrendPageData {
  focusCountry: string;
  countryName: string | null;
  countries: TikTokHashtagCountryFilter[];
  items: TikTokHashtagQueryItem[];
  generatedAt: string;
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

  try {
    const countries = await listLatestTikTokHashtagCountries();
    if (!countries.length) {
      return {
        focusCountry: 'US',
        countryName: null,
        countries: [],
        items: [],
        generatedAt: fallbackNow,
        sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
        totalCountries: 0,
        errorMessage: t.errorNoSnapshot,
        locale,
      };
    }

    const requestedCountry = normalizeCountryCode(readSearchParamRaw(rawSearchParams, 'country'));
    const preferredCountry = preferredCountryCode?.trim().toUpperCase() ?? null;
    const resolvedCountry = resolvePreferredCode({
      items: countries,
      candidates: [requestedCountry, preferredCountry],
      getCode: (item) => item.countryCode,
      fallback: 'US',
    });

    const result = await queryLatestTikTokHashtags(resolvedCountry);

    return {
      focusCountry: resolvedCountry,
      countryName: result.country?.countryName ?? countries.find((item) => item.countryCode === resolvedCountry)?.countryName ?? null,
      countries,
      items: result.data,
      generatedAt: result.batch?.generatedAt ?? fallbackNow,
      sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
      totalCountries: countries.length,
      locale,
    };
  } catch (error) {
    logServerError('tiktok-hashtag-trends/page-data', error);
    const errorMessage = resolveStandardPageDataErrorMessage(error, t);

    return {
      focusCountry: preferredCountryCode?.trim().toUpperCase() || 'US',
      countryName: null,
      countries: [],
      items: [],
      generatedAt: fallbackNow,
      sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
      totalCountries: 0,
      errorMessage,
      locale,
    };
  }
}
