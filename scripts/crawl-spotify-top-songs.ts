import process from 'node:process';
import { loadScriptEnv } from './_shared/load-env';
import { parseMusicCrawlerCliArgs, runSerialCountryChartCrawl } from './crawl-youtube-music-shared';
import { SpotifyChartsCrawler } from '../src/lib/spotify/crawler';
import { DEFAULT_SPOTIFY_TOP_SONGS_COUNTRY_CODES } from '../src/lib/spotify/types';
import { normalizeSpotifyCountryCode } from '../src/lib/spotify/countries';

loadScriptEnv();

function parsePositiveNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

async function main() {
  const argv = process.argv.slice(2);
  const options = parseMusicCrawlerCliArgs(argv);
  const timeoutMs = parsePositiveNumber(
    argv.find((arg) => arg.startsWith('--timeout-ms='))?.split('=')[1],
    45_000,
    5_000,
    180_000,
  );
  const waitAfterLoadMs = parsePositiveNumber(
    argv.find((arg) => arg.startsWith('--wait-after-load-ms='))?.split('=')[1],
    1_500,
    0,
    30_000,
  );
  const browserExecutablePath =
    argv.find((arg) => arg.startsWith('--browser-executable-path='))?.split('=')[1]?.trim() ||
    process.env.SPOTIFY_BROWSER_EXECUTABLE_PATH?.trim() ||
    undefined;
  const adminApiKey = process.env.API_KEY?.trim() || null;
  const crawler = new SpotifyChartsCrawler({
    adminApiKey,
    headless: !argv.includes('--headed'),
    timeoutMs,
    waitAfterLoadMs,
    browserExecutablePath,
  });

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!options.dryRun && !tursoUrl) {
    throw new Error('TURSO_DATABASE_URL is missing. Set it before writing snapshots.');
  }

  if (!adminApiKey) {
    throw new Error('API_KEY is missing. Set it before crawling Spotify charts.');
  }

  try {
    const { saveSpotifyTopSongsSnapshot } = await import('../src/lib/spotify/db');
    await runSerialCountryChartCrawl({
      scriptName: 'crawl-spotify-top-songs',
      cliOptions: options,
      envCountries:
        process.env.SPOTIFY_TOP_SONGS_COUNTRY_CODES ??
        DEFAULT_SPOTIFY_TOP_SONGS_COUNTRY_CODES.join(','),
      discoverCountries: async () => [...DEFAULT_SPOTIFY_TOP_SONGS_COUNTRY_CODES],
      fetchSnapshot: (countryCode) => crawler.fetchDailyTopSongs(countryCode),
      saveSnapshot: saveSpotifyTopSongsSnapshot,
      topLabel: (snapshot) => snapshot.items[0]?.trackName ?? 'N/A',
      normalizeCountryCode: normalizeSpotifyCountryCode,
    });
  } finally {
    await crawler.close();
  }
}

main().catch((error) => {
  console.error('crawl-spotify-top-songs failed:', error);
  process.exit(1);
});
