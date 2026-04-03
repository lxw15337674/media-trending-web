import process from 'node:process';
import { loadScriptEnv } from './_shared/load-env';
import { parseCountryList, parseEnumList, parseSnapshotHourArg } from './_shared/cli-parsers';
import { GooglePlayGameChartsCrawler } from '../src/lib/google-play-games/crawler';
import { saveGooglePlayGameChartSnapshot } from '../src/lib/google-play-games/db';
import {
  DEFAULT_GOOGLE_PLAY_GAME_COUNTRY_CODES,
  GOOGLE_PLAY_GAME_CHART_TYPES,
  type GooglePlayGameChartType,
} from '../src/lib/google-play-games/types';
import { parseSnapshotHour, toSnapshotHour } from '../src/lib/youtube-hot/time';

loadScriptEnv();

const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [1500, 4000];

function parseCliArgs(argv: string[]) {
  const chartsInlineArg = argv.find((arg) => arg.startsWith('--charts='))?.split('=')[1];
  const chartsFlagIndex = argv.findIndex((arg) => arg === '--charts');
  const chartsArg =
    chartsInlineArg ||
    (chartsFlagIndex >= 0 && chartsFlagIndex < argv.length - 1 ? argv[chartsFlagIndex + 1] : undefined);

  const countriesInlineArg = argv.find((arg) => arg.startsWith('--countries='))?.split('=')[1];
  const countriesFlagIndex = argv.findIndex((arg) => arg === '--countries');
  const countriesArg =
    countriesInlineArg ||
    (countriesFlagIndex >= 0 && countriesFlagIndex < argv.length - 1 ? argv[countriesFlagIndex + 1] : undefined);

  return {
    dryRun: argv.includes('--dry-run'),
    snapshotHour: parseSnapshotHourArg(argv, {
      parseSnapshotHour,
      toSnapshotHour,
      example: '2026-04-01 12:00:00',
    }),
    chartTypes: parseEnumList(chartsArg, GOOGLE_PLAY_GAME_CHART_TYPES) ?? [...GOOGLE_PLAY_GAME_CHART_TYPES],
    countryCodes: parseCountryList(countriesArg) ?? [...DEFAULT_GOOGLE_PLAY_GAME_COUNTRY_CODES],
  } satisfies {
    dryRun: boolean;
    snapshotHour: string;
    chartTypes: GooglePlayGameChartType[];
    countryCodes: string[];
  };
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  crawler: GooglePlayGameChartsCrawler,
  countryCode: string,
  chartType: GooglePlayGameChartType,
  snapshotHour: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    try {
      return await crawler.fetchChart(countryCode, chartType, snapshotHour);
    } catch (error) {
      lastError = error;
      if (attempt > MAX_RETRIES) {
        break;
      }

      const delayMs = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `country=${countryCode} chart=${chartType} attempt=${attempt}/${MAX_RETRIES + 1} failed: ${message}; retrying in ${delayMs}ms`,
      );
      await delay(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const crawler = new GooglePlayGameChartsCrawler({
    browserExecutablePath: process.env.GOOGLE_PLAY_BROWSER_EXECUTABLE_PATH ?? null,
  });
  const failures: Array<{ chartType: GooglePlayGameChartType; countryCode: string; errorText: string }> = [];
  let successCount = 0;

  console.log(
    `snapshotHour=${options.snapshotHour} dryRun=${options.dryRun} charts=${options.chartTypes.join(',')} countries=${options.countryCodes.join(',')}`,
  );

  try {
    for (const chartType of options.chartTypes) {
      for (const countryCode of options.countryCodes) {
        try {
          const snapshot = await fetchWithRetry(crawler, countryCode, chartType, options.snapshotHour);
          console.log(
            `chart=${chartType}, country=${countryCode}, fetchedAt=${snapshot.fetchedAt}, itemCount=${snapshot.items.length}, top=${snapshot.items[0]?.appName ?? 'N/A'}`,
          );

          if (!options.dryRun) {
            const snapshotId = await saveGooglePlayGameChartSnapshot(snapshot);
            console.log(
              `stored snapshot id=${snapshotId} chart=${chartType} country=${countryCode} snapshotHour=${snapshot.snapshotHour}`,
            );
          }

          successCount += 1;
        } catch (error) {
          const errorText = error instanceof Error ? error.message : String(error);
          failures.push({ chartType, countryCode, errorText });
          console.error(`chart=${chartType} country=${countryCode} failed after ${MAX_RETRIES + 1} attempts: ${errorText}`);
        }
      }
    }
  } finally {
    await crawler.close().catch(() => {});
  }

  if (options.dryRun) {
    console.log('dry-run complete, no database writes');
  }

  console.log(
    `summary success=${successCount} failed=${failures.length} total=${options.chartTypes.length * options.countryCodes.length}`,
  );
  for (const failure of failures) {
    console.log(`failure chart=${failure.chartType} country=${failure.countryCode} error=${failure.errorText}`);
  }

  if (failures.length > 0) {
    if (successCount === 0) {
      throw new Error('crawl-google-play-games completed with 0 successful chart snapshots');
    }

    console.warn(
      `crawl-google-play-games completed with partial failures: failed=${failures.length} successful=${successCount}`,
    );
  }
}

main().catch((error) => {
  console.error('crawl-google-play-games failed:', error);
  process.exit(1);
});
