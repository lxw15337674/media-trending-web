export interface CrawlCliOptions {
  dryRun: boolean;
  countriesArg?: string;
}

export interface CountryChartSnapshotLike {
  countryCode: string;
  chartEndDate: string;
  fetchedAt: string;
  items: readonly unknown[];
}

export interface RunBaseCrawlOptions<TSnapshot extends CountryChartSnapshotLike> {
  scriptName: string;
  cliOptions: CrawlCliOptions;
  envCountries: string | undefined;
  discoverCountries?: () => Promise<string[]>;
  fetchSnapshot: (countryCode: string) => Promise<TSnapshot>;
  saveSnapshot: (snapshot: TSnapshot) => Promise<number>;
  topLabel: (snapshot: TSnapshot) => string;
  normalizeCountryCode?: (value: string) => string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 3000, 5000];

export function normalizeCountryCodeDefault(value: string) {
  return value.trim().toLowerCase() === 'global' ? 'global' : value.trim().toUpperCase();
}

export function parseCountryList(
  value: string | undefined,
  normalize: (value: string) => string = normalizeCountryCodeDefault,
): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[,\s]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map(normalize),
    ),
  );
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<TSnapshot>(
  countryCode: string,
  fetchSnapshot: (countryCode: string) => Promise<TSnapshot>,
): Promise<TSnapshot> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    try {
      return await fetchSnapshot(countryCode);
    } catch (error) {
      lastError = error;
      if (attempt > MAX_RETRIES) {
        break;
      }

      const delayMs = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `country=${countryCode} attempt=${attempt}/${MAX_RETRIES + 1} failed: ${message}; retrying in ${delayMs}ms`,
      );
      await delay(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function runSerialCountryChartCrawl<TSnapshot extends CountryChartSnapshotLike>({
  scriptName,
  cliOptions,
  envCountries,
  discoverCountries,
  fetchSnapshot,
  saveSnapshot,
  topLabel,
  normalizeCountryCode = normalizeCountryCodeDefault,
}: RunBaseCrawlOptions<TSnapshot>): Promise<void> {
  const explicitCountries = parseCountryList(
    cliOptions.countriesArg || envCountries,
    normalizeCountryCode,
  );
  const countries = explicitCountries.length > 0 ? explicitCountries : await (discoverCountries?.() ?? Promise.resolve([]));
  console.log(`targetCountryCount=${countries.length} countries=${countries.join(',')}`);

  const failures: Array<{ countryCode: string; errorText: string }> = [];
  let successCount = 0;

  for (const countryCode of countries) {
    try {
      const snapshot = await fetchWithRetry(countryCode, fetchSnapshot);
      console.log(
        `country=${snapshot.countryCode}, chartEndDate=${snapshot.chartEndDate}, fetchedAt=${snapshot.fetchedAt}, itemCount=${snapshot.items.length}, top=${topLabel(snapshot)}`,
      );

      if (!cliOptions.dryRun) {
        const snapshotId = await saveSnapshot(snapshot);
        console.log(
          `stored snapshot id=${snapshotId} country=${snapshot.countryCode} chartEndDate=${snapshot.chartEndDate} itemCount=${snapshot.items.length}`,
        );
      }

      successCount += 1;
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      failures.push({ countryCode, errorText });
      console.error(`country=${countryCode} failed after ${MAX_RETRIES + 1} attempts: ${errorText}`);
    }
  }

  if (cliOptions.dryRun) {
    console.log('dry-run complete, no database writes');
  }

  console.log(`summary success=${successCount} failed=${failures.length} total=${countries.length}`);
  for (const failure of failures) {
    console.log(`failure country=${failure.countryCode} error=${failure.errorText}`);
  }

  if (failures.length > 0) {
    throw new Error(`${scriptName} completed with ${failures.length} failed countries`);
  }
}
