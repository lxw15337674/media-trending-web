import { existsSync } from 'node:fs';
import { chromium, type Browser, type BrowserContext, type LaunchOptions, type Page, type Response } from 'playwright-core';
import { resolveSpotifyStorageState } from './storage-state';
import { getSpotifyCountryName, getSpotifyCountrySlug, normalizeSpotifyCountryCode } from './countries';
import {
  SPOTIFY_CHARTS_BASE_URL,
  SPOTIFY_DAILY_PERIOD_TYPE,
  SPOTIFY_TOP_SONGS_CHART_TYPE,
  type SpotifyChartArtist,
  type SpotifyChartItem,
  type SpotifyTopSongsSnapshot,
} from './types';

const CHART_RESPONSE_PREFIX = 'https://charts-spotify-com-service.spotify.com/auth/v0/charts/';
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_WAIT_AFTER_LOAD_MS = 1_500;
const DEFAULT_WINDOWS_BROWSER_EXECUTABLE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEFAULT_DARWIN_BROWSER_EXECUTABLE_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
] as const;
const DEFAULT_LINUX_BROWSER_EXECUTABLE_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
] as const;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

interface SpotifyCrawlerOptions {
  adminApiKey: string | null | undefined;
  headless?: boolean;
  timeoutMs?: number;
  waitAfterLoadMs?: number;
  browserExecutablePath?: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

function findValueDeep<T>(value: unknown, predicate: (candidate: unknown) => candidate is T): T | null {
  const queue: unknown[] = [value];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (seen.has(current)) continue;
    seen.add(current);

    if (predicate(current)) {
      return current;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    queue.push(...Object.values(current as Record<string, unknown>));
  }

  return null;
}

function isSpotifyEntry(candidate: unknown): candidate is Record<string, unknown> {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
  const record = candidate as Record<string, unknown>;
  return !!record.trackMetadata && typeof record.trackMetadata === 'object';
}

function extractSpotifyEntries(payload: unknown) {
  const queue: unknown[] = [payload];
  const seen = new Set<unknown>();
  const entries: Record<string, unknown>[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (isSpotifyEntry(current)) {
      entries.push(current);
    }

    queue.push(...Object.values(current as Record<string, unknown>));
  }

  return entries;
}

function extractArtists(trackMetadata: Record<string, unknown>) {
  const directArtists = Array.isArray(trackMetadata.artists) ? trackMetadata.artists : [];
  const artists: SpotifyChartArtist[] = directArtists
    .map((artist) => {
      if (!artist || typeof artist !== 'object') return null;
      const name = getString((artist as Record<string, unknown>).name);
      return name ? ({ name } satisfies SpotifyChartArtist) : null;
    })
    .filter((artist): artist is SpotifyChartArtist => artist !== null);

  if (artists.length > 0) {
    return artists;
  }

  const artistName = getString(trackMetadata.artistName) || getString(trackMetadata.artistNames);
  if (!artistName) {
    return [];
  }

  return artistName
    .split(/\s*,\s*/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function extractTrackId(trackMetadata: Record<string, unknown>) {
  const directId =
    getString(trackMetadata.trackId) ||
    getString(trackMetadata.entityId) ||
    getString(trackMetadata.id) ||
    getString(trackMetadata.gid);
  if (directId) return directId;

  const uri =
    getString(trackMetadata.trackUri) ||
    getString(trackMetadata.uri) ||
    getString(trackMetadata.spotifyUri);
  if (!uri) return null;

  const match = uri.match(/spotify:track:([A-Za-z0-9]+)/i);
  return match?.[1] ?? null;
}

function extractTrackUrl(trackMetadata: Record<string, unknown>, trackId: string | null) {
  return (
    getString(trackMetadata.trackUrl) ||
    getString(trackMetadata.externalUrl) ||
    getString(trackMetadata.spotifyUrl) ||
    (trackId ? `https://open.spotify.com/track/${trackId}` : null)
  );
}

function extractThumbnailUrl(trackMetadata: Record<string, unknown>) {
  const direct =
    getString(trackMetadata.displayImageUri) ||
    getString(trackMetadata.albumArtUrl) ||
    getString(trackMetadata.imageUrl) ||
    getString(trackMetadata.coverArtUrl);
  if (direct) return direct;

  const image = findValueDeep(trackMetadata, (candidate): candidate is { url?: unknown } => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
    return typeof (candidate as { url?: unknown }).url === 'string';
  });

  return getString(image?.url);
}

function resolveChartDate(payload: unknown, fetchedAt: string) {
  const dateMatch = findValueDeep(payload, (candidate): candidate is string => {
    return typeof candidate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.trim());
  });

  return dateMatch ?? fetchedAt.slice(0, 10);
}

function mapSpotifyItems(entries: Record<string, unknown>[]) {
  return entries
    .map((entry, index) => {
      const trackMetadata =
        entry.trackMetadata && typeof entry.trackMetadata === 'object' && !Array.isArray(entry.trackMetadata)
          ? (entry.trackMetadata as Record<string, unknown>)
          : entry;
      const chartEntryData =
        entry.chartEntryData && typeof entry.chartEntryData === 'object' && !Array.isArray(entry.chartEntryData)
          ? (entry.chartEntryData as Record<string, unknown>)
          : entry;

      const trackName =
        getString(trackMetadata.trackName) ||
        getString(trackMetadata.name) ||
        getString(trackMetadata.songName);
      if (!trackName) return null;

      const artists = extractArtists(trackMetadata);
      const artistNames = artists.map((artist) => artist.name).join(', ') || getString(trackMetadata.artistName) || 'Unknown';
      const spotifyTrackId = extractTrackId(trackMetadata);

      return {
        rank:
          getNumber(chartEntryData.currentRank) ||
          getNumber(chartEntryData.rank) ||
          getNumber((entry as Record<string, unknown>).currentRank) ||
          index + 1,
        previousRank: getNumber(chartEntryData.previousRank),
        peakRank: getNumber(chartEntryData.peakRank),
        appearancesOnChart:
          getNumber(chartEntryData.appearancesOnChart) ||
          getNumber(chartEntryData.consecutiveAppearances) ||
          getNumber(chartEntryData.weeksOnChart),
        trackName,
        artistNames,
        artists,
        spotifyTrackId,
        spotifyTrackUri:
          getString(trackMetadata.trackUri) ||
          getString(trackMetadata.uri) ||
          getString(trackMetadata.spotifyUri),
        spotifyTrackUrl: extractTrackUrl(trackMetadata, spotifyTrackId),
        albumName: getString(trackMetadata.albumName) || getString(trackMetadata.releaseName),
        thumbnailUrl: extractThumbnailUrl(trackMetadata),
        streamCount:
          getNumber(chartEntryData.streamCount) ||
          getNumber(chartEntryData.streams) ||
          getNumber(chartEntryData.value),
        rawItem: entry,
      } satisfies SpotifyChartItem;
    })
    .filter((item): item is SpotifyChartItem => item !== null)
    .sort((left, right) => left.rank - right.rank);
}

function resolveBrowserExecutablePath(explicitPath?: string | null) {
  const normalizedExplicitPath = explicitPath?.trim();
  if (normalizedExplicitPath) {
    return normalizedExplicitPath;
  }

  const candidates =
    process.platform === 'win32'
      ? [DEFAULT_WINDOWS_BROWSER_EXECUTABLE_PATH]
      : process.platform === 'darwin'
        ? DEFAULT_DARWIN_BROWSER_EXECUTABLE_PATHS
        : DEFAULT_LINUX_BROWSER_EXECUTABLE_PATHS;

  return candidates.find((candidate) => existsSync(candidate));
}

function getLaunchOptions(options: SpotifyCrawlerOptions): LaunchOptions {
  const executablePath = resolveBrowserExecutablePath(options.browserExecutablePath);
  const launchOptions: LaunchOptions = {
    headless: options.headless ?? true,
    args: ['--disable-blink-features=AutomationControlled'],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  return launchOptions;
}

function buildChartAlias(countryCodeInput: string) {
  const countryCode = normalizeSpotifyCountryCode(countryCodeInput);
  const slug = getSpotifyCountrySlug(countryCode);
  return `regional-${slug}-daily`;
}

function buildChartPageUrl(countryCodeInput: string) {
  return `${SPOTIFY_CHARTS_BASE_URL}/charts/view/${buildChartAlias(countryCodeInput)}/latest`;
}

function isLoginPage(url: string) {
  return /\/home(?:[/?#]|$)/i.test(url);
}

async function openContext(options: SpotifyCrawlerOptions): Promise<{ browser: Browser; context: BrowserContext }> {
  const storageState = await resolveSpotifyStorageState({
    adminApiKey: options.adminApiKey,
    subject: 'spotify charts',
  });
  const browser = await chromium.launch(getLaunchOptions(options));

  try {
    const context = await browser.newContext({
      locale: 'en-US',
      storageState,
      viewport: { width: 1440, height: 1600 },
      userAgent: DEFAULT_USER_AGENT,
    });

    return { browser, context };
  } catch (error) {
    await browser.close().catch(() => {});
    throw error;
  }
}

async function extractChartPayload(page: Page, chartAlias: string, timeoutMs: number): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().startsWith(CHART_RESPONSE_PREFIX) &&
      response.url().includes(`/${chartAlias}/`) &&
      response.status() < 500,
    { timeout: timeoutMs },
  );
}

export class SpotifyChartsCrawler {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private readonly options: SpotifyCrawlerOptions) {}

  private async ensureContext() {
    if (this.browser && this.context) {
      return { browser: this.browser, context: this.context };
    }

    const session = await openContext(this.options);
    this.browser = session.browser;
    this.context = session.context;
    return session;
  }

  async fetchDailyTopSongs(countryCodeInput: string): Promise<SpotifyTopSongsSnapshot> {
    const { context } = await this.ensureContext();
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const waitAfterLoadMs = this.options.waitAfterLoadMs ?? DEFAULT_WAIT_AFTER_LOAD_MS;
    const countryCode = normalizeSpotifyCountryCode(countryCodeInput);
    const countryName = getSpotifyCountryName(countryCode) ?? countryCode;
    const chartAlias = buildChartAlias(countryCode);
    const sourceUrl = buildChartPageUrl(countryCode);
    const page = await context.newPage();

    try {
      const payloadResponsePromise = extractChartPayload(page, chartAlias, timeoutMs);
      await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      await page.waitForLoadState('networkidle', { timeout: Math.min(timeoutMs, 10_000) }).catch(() => {});

      if (isLoginPage(page.url())) {
        throw new Error(`Spotify charts redirected to login page for country=${countryCode}`);
      }

      const payloadResponse = await payloadResponsePromise;
      if (!payloadResponse.ok()) {
        throw new Error(`Spotify charts API failed status=${payloadResponse.status()} url=${payloadResponse.url()}`);
      }

      if (waitAfterLoadMs > 0) {
        await sleep(waitAfterLoadMs);
      }

      const rawPayload = (await payloadResponse.json()) as unknown;
      const fetchedAt = new Date().toISOString();
      const items = mapSpotifyItems(extractSpotifyEntries(rawPayload));
      if (items.length === 0) {
        throw new Error(`Spotify charts payload returned no entries for country=${countryCode}`);
      }

      return {
        chartType: SPOTIFY_TOP_SONGS_CHART_TYPE,
        periodType: SPOTIFY_DAILY_PERIOD_TYPE,
        countryCode,
        countryName,
        chartEndDate: resolveChartDate(rawPayload, fetchedAt),
        fetchedAt,
        sourceUrl,
        chartAlias,
        items,
        rawPayload: {
          chartAlias,
          chartApiUrl: payloadResponse.url(),
          finalPageUrl: page.url(),
          payload: rawPayload,
        },
      } satisfies SpotifyTopSongsSnapshot;
    } finally {
      await page.close().catch(() => {});
    }
  }

  async close() {
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
    this.context = null;
    this.browser = null;
  }
}
