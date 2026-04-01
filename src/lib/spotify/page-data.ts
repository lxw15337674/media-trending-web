import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import type { SearchParamsInput } from '@/lib/server/search-params';
import { readSearchParamRaw } from '@/lib/server/search-params';
import { classifyRuntimeError, logServerError } from '@/lib/server/runtime-error';
import { normalizeSpotifyCountryCode } from './countries';
import { getLatestSpotifyTopSongsSnapshot, listLatestSpotifyTopSongsCountries } from './db';
import type { SpotifyChartItem, SpotifyCountryOption } from './types';

export interface SpotifyPageData {
  country: string;
  countryName: string;
  countries: SpotifyCountryOption[];
  items: SpotifyChartItem[];
  fetchedAt: string | null;
  chartEndDate: string;
  sourceUrl: string;
  itemCount: number;
  errorMessage?: string | null;
  locale: Locale;
}

function normalizeCountryValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return normalizeSpotifyCountryCode(rawValue);
}

export async function buildSpotifyPageData(rawSearchParams: SearchParamsInput, locale: Locale): Promise<SpotifyPageData> {
  const t = getMessages(locale).spotify;
  let country = 'global';
  let countryName = '';
  let countries: SpotifyCountryOption[] = [];
  let items: SpotifyChartItem[] = [];
  let fetchedAt: string | null = null;
  let chartEndDate = '';
  let sourceUrl = '';
  let itemCount = 0;
  let errorMessage: string | null = null;

  try {
    countries = await listLatestSpotifyTopSongsCountries();
    const fallbackCountry = countries.find((item) => item.countryCode === 'global')?.countryCode ?? countries[0]?.countryCode ?? 'global';
    const requestedCountry = normalizeCountryValue(readSearchParamRaw(rawSearchParams, 'country'));
    country = countries.some((item) => item.countryCode === requestedCountry) ? requestedCountry : fallbackCountry;

    const snapshot = await getLatestSpotifyTopSongsSnapshot(country);
    if (!snapshot) {
      errorMessage = t.errorNoSnapshot;
    } else {
      country = snapshot.countryCode;
      countryName = snapshot.countryName;
      items = snapshot.items;
      fetchedAt = snapshot.fetchedAt;
      chartEndDate = snapshot.chartEndDate;
      sourceUrl = snapshot.sourceUrl;
      itemCount = snapshot.itemCount;
    }
  } catch (error) {
    logServerError('spotify/page-data', error);
    const category = classifyRuntimeError(error);
    if (category === 'missing_db_env') {
      errorMessage = t.errorNoDbEnv;
    } else if (category === 'missing_table') {
      errorMessage = t.errorNoTable;
    } else if (category === 'query_failed' || category === 'network' || category === 'auth') {
      errorMessage = t.errorQueryFailed;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = t.errorLoad;
    }
  }

  return {
    country,
    countryName,
    countries,
    items,
    fetchedAt,
    chartEndDate,
    sourceUrl,
    itemCount,
    errorMessage,
    locale,
  };
}
