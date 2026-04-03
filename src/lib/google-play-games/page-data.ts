import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveStandardPageDataErrorMessage } from '@/lib/page-data/runtime-error-message';
import type { SearchParamsInput } from '@/lib/server/search-params';
import { readSearchParamFirst } from '@/lib/server/search-params';
import { logServerError } from '@/lib/server/runtime-error';
import { getGooglePlayGameCountryName } from './countries';
import {
  getLatestGooglePlayGameChartSnapshot,
  listGooglePlayGameChartTypes,
  listLatestGooglePlayGameCountries,
} from './db';
import type {
  GooglePlayGameChartItem,
  GooglePlayGameChartOption,
  GooglePlayGameChartType,
  GooglePlayGameCountryOption,
} from './types';
import { GOOGLE_PLAY_GAME_CHART_TYPE_FREE, normalizeGooglePlayGameCountryCode } from './types';

export interface GooglePlayGamesPageSection {
  chartType: GooglePlayGameChartType;
  chartLabel: string;
  items: GooglePlayGameChartItem[];
  fetchedAt: string | null;
  snapshotHour: string | null;
  sourceUrl: string;
  pageTitle: string;
  itemCount: number;
}

export interface GooglePlayGamesPageData {
  country: string;
  countryName: string;
  countries: GooglePlayGameCountryOption[];
  charts: GooglePlayGameChartOption[];
  sections: GooglePlayGamesPageSection[];
  fetchedAt: string | null;
  sourceUrl: string;
  errorMessage?: string | null;
  locale: Locale;
}

function buildChartLabel(locale: Locale, chartType: GooglePlayGameChartType) {
  const t = getMessages(locale).googlePlayGames;
  if (chartType === 'toppaid') return t.chartTopPaid;
  if (chartType === 'topgrossing') return t.chartTopGrossing;
  return t.chartTopFree;
}

export async function buildGooglePlayGamesPageData(
  rawSearchParams: SearchParamsInput,
  locale: Locale,
): Promise<GooglePlayGamesPageData> {
  const t = getMessages(locale).googlePlayGames;
  const charts: GooglePlayGameChartOption[] = listGooglePlayGameChartTypes().map((chartType) => ({
    chartType,
    chartLabel: buildChartLabel(locale, chartType),
  }));
  const requestedCountry = normalizeGooglePlayGameCountryCode(readSearchParamFirst(rawSearchParams, 'country'));

  try {
    const countries = await listLatestGooglePlayGameCountries(GOOGLE_PLAY_GAME_CHART_TYPE_FREE);
    const fallbackCountry = countries.find((item) => item.countryCode === 'US')?.countryCode ?? countries[0]?.countryCode ?? 'US';
    const country = countries.some((item) => item.countryCode === requestedCountry) ? requestedCountry : fallbackCountry;
    const snapshots = await Promise.all(charts.map((chart) => getLatestGooglePlayGameChartSnapshot(chart.chartType, country)));
    const sections: GooglePlayGamesPageSection[] = charts.map((chart, index) => {
      const snapshot = snapshots[index];
      return {
        chartType: chart.chartType,
        chartLabel: chart.chartLabel,
        items: snapshot?.items ?? [],
        fetchedAt: snapshot?.fetchedAt ?? null,
        snapshotHour: snapshot?.snapshotHour ?? null,
        sourceUrl: snapshot?.sourceUrl ?? '',
        pageTitle: snapshot?.pageTitle ?? '',
        itemCount: snapshot?.itemCount ?? 0,
      };
    });
    const firstSnapshot = snapshots.find((item) => item !== null);
    const latestFetchedAt = sections
      .map((section) => section.fetchedAt)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => right.localeCompare(left))[0] ?? null;

    return {
      country,
      countryName:
        firstSnapshot?.countryName ??
        countries.find((item) => item.countryCode === country)?.countryName ??
        getGooglePlayGameCountryName(country),
      countries,
      charts,
      sections,
      fetchedAt: latestFetchedAt,
      sourceUrl: firstSnapshot?.sourceUrl ?? '',
      errorMessage: sections.every((section) => section.items.length === 0) ? t.errorNoSnapshot : null,
      locale,
    };
  } catch (error) {
    logServerError('google-play-games/page-data', error);
    return {
      country: requestedCountry,
      countryName: getGooglePlayGameCountryName(requestedCountry),
      countries: [],
      charts,
      sections: charts.map((chart) => ({
        chartType: chart.chartType,
        chartLabel: chart.chartLabel,
        items: [],
        fetchedAt: null,
        snapshotHour: null,
        sourceUrl: '',
        pageTitle: '',
        itemCount: 0,
      })),
      fetchedAt: null,
      sourceUrl: '',
      errorMessage: resolveStandardPageDataErrorMessage(error, t, { fallbackToErrorMessage: true }),
      locale,
    };
  }
}
