import { config as loadEnv } from 'dotenv';
import { AppleMusicChartsClient } from '../src/lib/apple-music/client';
import { normalizeAppleMusicCountryCode } from '../src/lib/apple-music/countries';
import { DEFAULT_APPLE_MUSIC_TOP_SONGS_COUNTRY_CODES } from '../src/lib/apple-music/types';
import { parseMusicCrawlerCliArgs, runSerialCountryChartCrawl } from './crawl-youtube-music-shared';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });
loadEnv({ path: '.dev.vars', override: true });

async function main() {
  const options = parseMusicCrawlerCliArgs(process.argv.slice(2));
  const client = new AppleMusicChartsClient();

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!options.dryRun && !tursoUrl) {
    throw new Error('TURSO_DATABASE_URL is missing. Set it before writing snapshots.');
  }

  const { saveAppleMusicTopSongsSnapshot } = await import('../src/lib/apple-music/db');
  await runSerialCountryChartCrawl({
    scriptName: 'crawl-apple-music-top-songs',
    cliOptions: options,
    envCountries:
      process.env.APPLE_MUSIC_TOP_SONGS_COUNTRY_CODES ??
      DEFAULT_APPLE_MUSIC_TOP_SONGS_COUNTRY_CODES.join(','),
    discoverCountries: async () => (await client.listAvailableTopSongsCountries()).map((entry) => entry.countryCode),
    fetchSnapshot: (countryCode) => client.fetchDailyTopSongs(countryCode),
    saveSnapshot: saveAppleMusicTopSongsSnapshot,
    topLabel: (snapshot) => snapshot.items[0]?.trackName ?? 'N/A',
    normalizeCountryCode: normalizeAppleMusicCountryCode,
  });
}

main().catch((error) => {
  console.error('crawl-apple-music-top-songs failed:', error);
  process.exit(1);
});
