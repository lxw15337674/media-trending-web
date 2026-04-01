import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveStandardPageDataErrorMessage } from '@/lib/page-data/runtime-error-message';
import type { SearchParamsInput } from '@/lib/server/search-params';
import { readSearchParamRaw } from '@/lib/server/search-params';
import { logServerError } from '@/lib/server/runtime-error';
import { getAppStoreGameCountryName } from './countries';
import { getLatestAppStoreGameChartSnapshot, listAppStoreGameChartTypes, listLatestAppStoreGameCountries } from './db';
import type { AppStoreGameChartItem, AppStoreGameChartOption, AppStoreGameChartType, AppStoreGameCountryOption } from './types';
import { normalizeAppStoreGameChartType, normalizeAppStoreGameCountryCode } from './types';

export interface AppStoreGamesPageData {
  chartType: AppStoreGameChartType;
  chartLabel: string;
  charts: AppStoreGameChartOption[];
  country: string;
  countryName: string;
  countries: AppStoreGameCountryOption[];
  items: AppStoreGameChartItem[];
  fetchedAt: string | null;
  snapshotHour: string | null;
  sourceUrl: string;
  feedTitle: string;
  itemCount: number;
  errorMessage?: string | null;
  locale: Locale;
}

function buildChartLabel(locale: Locale, chartType: AppStoreGameChartType) {
  const t = getMessages(locale).appStoreGames;
  if (chartType === 'toppaid') return t.chartTopPaid;
  if (chartType === 'topgrossing') return t.chartTopGrossing;
  return t.chartTopFree;
}

export async function buildAppStoreGamesPageData(
  rawSearchParams: SearchParamsInput,
  locale: Locale,
): Promise<AppStoreGamesPageData> {
  const t = getMessages(locale).appStoreGames;
  const fallbackChartType = normalizeAppStoreGameChartType(readSearchParamRaw(rawSearchParams, 'chart'));
  const charts: AppStoreGameChartOption[] = listAppStoreGameChartTypes().map((chartType) => ({
    chartType,
    chartLabel: buildChartLabel(locale, chartType),
  }));
  const requestedCountry = normalizeAppStoreGameCountryCode(readSearchParamRaw(rawSearchParams, 'country'));

  try {
    const countries = await listLatestAppStoreGameCountries(fallbackChartType);
    const fallbackCountry = countries.find((item) => item.countryCode === 'US')?.countryCode ?? countries[0]?.countryCode ?? 'US';
    const country = countries.some((item) => item.countryCode === requestedCountry) ? requestedCountry : fallbackCountry;
    const snapshot = await getLatestAppStoreGameChartSnapshot(fallbackChartType, country);

    if (!snapshot) {
      return {
        chartType: fallbackChartType,
        chartLabel: buildChartLabel(locale, fallbackChartType),
        charts,
        country,
        countryName: countries.find((item) => item.countryCode === country)?.countryName ?? getAppStoreGameCountryName(country),
        countries,
        items: [],
        fetchedAt: null,
        snapshotHour: null,
        sourceUrl: '',
        feedTitle: '',
        itemCount: 0,
        errorMessage: t.errorNoSnapshot,
        locale,
      };
    }

    return {
      chartType: snapshot.chartType,
      chartLabel: buildChartLabel(locale, snapshot.chartType),
      charts,
      country: snapshot.countryCode,
      countryName: snapshot.countryName,
      countries,
      items: snapshot.items,
      fetchedAt: snapshot.fetchedAt,
      snapshotHour: snapshot.snapshotHour,
      sourceUrl: snapshot.sourceUrl,
      feedTitle: snapshot.feedTitle,
      itemCount: snapshot.itemCount,
      locale,
    };
  } catch (error) {
    logServerError('app-store-games/page-data', error);
    return {
      chartType: fallbackChartType,
      chartLabel: buildChartLabel(locale, fallbackChartType),
      charts,
      country: requestedCountry,
      countryName: getAppStoreGameCountryName(requestedCountry),
      countries: [],
      items: [],
      fetchedAt: null,
      snapshotHour: null,
      sourceUrl: '',
      feedTitle: '',
      itemCount: 0,
      errorMessage: resolveStandardPageDataErrorMessage(error, t, { fallbackToErrorMessage: true }),
      locale,
    };
  }
}
