import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { normalizeAppleMusicArtworkUrl } from './artwork';
import {
  getAppleMusicCountrySlug,
  normalizeAppleMusicCountryCode,
} from './countries';
import {
  APPLE_MUSIC_DAILY_PERIOD_TYPE,
  APPLE_MUSIC_GLOBAL_COUNTRY_CODE,
  APPLE_MUSIC_GLOBAL_COUNTRY_NAME,
  APPLE_MUSIC_TOP_SONGS_CHART_TYPE,
  APPLE_MUSIC_TOP_SONGS_INDEX_URL,
  type AppleMusicChartItem,
  type AppleMusicCountryOption,
  type AppleMusicTopSongsSnapshot,
} from './types';

const REQUEST_TIMEOUT_MS = 15000;
const COUNTRY_DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000;
const COUNTRY_LINK_RE = /"title":"Top 100: (?<country>[^"]+)".+?"url":"https:\/\/music\.apple\.com\/us\/playlist\/(?<slug>[^/]+)\/(?<playlist>pl\.[^"]+)"/gs;
const TRACK_BLOCK_MARKER = '"id":"track-lockup - ';
const TRACK_LIST_END_MARKER = '],"header":{"kind":"default"';
const execFileAsync = promisify(execFile);

let countryCache:
  | {
      expiresAt: number;
      data: AppleMusicCountryOption[];
    }
  | null = null;

function cloneCountryOptions(items: AppleMusicCountryOption[]) {
  return items.map((item) => ({ ...item }));
}

function getCountryCache() {
  if (!countryCache) return null;
  if (Date.now() > countryCache.expiresAt) return null;
  return cloneCountryOptions(countryCache.data);
}

function decodeJsonString(fragment: string | null | undefined) {
  if (!fragment) return null;

  try {
    return JSON.parse(fragment) as string;
  } catch {
    return null;
  }
}

function extractJsonString(input: string, pattern: RegExp) {
  const match = input.match(pattern);
  return decodeJsonString(match?.groups?.value ?? null);
}

function extractNumber(input: string, pattern: RegExp) {
  const match = input.match(pattern);
  if (!match?.groups?.value) return null;
  const parsed = Number(match.groups.value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchTextViaCurl(url: string) {
  const command = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const args = [
    '-L',
    '--max-time',
    String(Math.ceil(REQUEST_TIMEOUT_MS / 1000)),
    '-A',
    'Mozilla/5.0',
    '-H',
    'Accept-Language: en-US,en;q=0.9',
    url,
  ];
  const { stdout } = await execFileAsync(command, args, { maxBuffer: 12 * 1024 * 1024 });
  if (!stdout || !stdout.trim()) {
    throw new Error(`Empty response while fetching Apple Music URL: ${url}`);
  }
  return stdout;
}

async function fetchText(url: string) {
  try {
    return await fetchTextViaCurl(url);
  } catch (curlError) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'accept-language': 'en-US,en;q=0.9',
          'user-agent': 'Mozilla/5.0',
        },
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      if (!text || !text.trim()) {
        throw new Error(`Empty response while fetching Apple Music URL: ${url}`);
      }
      return text;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const curlMessage = curlError instanceof Error ? curlError.message : String(curlError);
      throw new Error(`Apple Music fetch failed for ${url}. curl=${curlMessage}; fetch=${message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

function toCountryCode(playlistSlug: string) {
  const normalizedPlaylistSlug = playlistSlug.trim().toLowerCase();
  if (!normalizedPlaylistSlug) return APPLE_MUSIC_GLOBAL_COUNTRY_CODE;

  const slugSuffix = normalizedPlaylistSlug.startsWith('top-100-')
    ? normalizedPlaylistSlug.slice('top-100-'.length)
    : normalizedPlaylistSlug;

  return normalizeAppleMusicCountryCode(slugSuffix);
}

function parseCountryOptions(html: string) {
  const countries: AppleMusicCountryOption[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(COUNTRY_LINK_RE)) {
    const countryName = match.groups?.country?.trim() ?? '';
    const playlistId = match.groups?.playlist?.trim() ?? '';
    const playlistSlug = match.groups?.slug?.trim() ?? '';
    const countryCode = toCountryCode(playlistSlug);
    const sourceUrl = playlistSlug && playlistId ? `https://music.apple.com/us/playlist/${playlistSlug}/${playlistId}` : '';

    if (!countryName || !playlistId || !playlistSlug || !sourceUrl || seen.has(countryCode)) {
      continue;
    }

    seen.add(countryCode);
    countries.push({
      countryCode,
      countryName,
      playlistId,
      playlistSlug,
      sourceUrl,
    });
  }

  if (!countries.length) {
    throw new Error('Unable to locate Apple Music top song country links in chart index HTML');
  }

  return countries;
}

function splitTrackBlocks(html: string) {
  const blocks: string[] = [];
  const listEnd = html.indexOf(TRACK_LIST_END_MARKER);
  if (listEnd < 0) return blocks;

  let cursor = html.indexOf(TRACK_BLOCK_MARKER);
  while (cursor >= 0 && cursor < listEnd) {
    const next = html.indexOf(TRACK_BLOCK_MARKER, cursor + TRACK_BLOCK_MARKER.length);
    const end = next >= 0 && next < listEnd ? next - 2 : listEnd;
    blocks.push(html.slice(cursor, end));
    if (next < 0 || next >= listEnd) {
      break;
    }
    cursor = next;
  }

  return blocks;
}

function parseTrackBlock(block: string, index: number): AppleMusicChartItem | null {
  const idMatch = block.match(/"id":"track-lockup - [^"]+ - (?<value>\d+)"/);
  const songId = idMatch?.groups?.value?.trim() ?? '';
  const trackName = extractJsonString(block, /"title":(?<value>"(?:\\.|[^"\\])*")/);
  const artistNames = extractJsonString(block, /"artistName":(?<value>"(?:\\.|[^"\\])*")/);
  const appleSongUrl = extractJsonString(
    block,
    /"contentDescriptor":\{"kind":"song","identifiers":\{"storeAdamID":"\d+"\},"url":(?<value>"(?:\\.|[^"\\])*")/,
  );
  const thumbnailUrl = extractJsonString(
    block,
    /"artwork":\{"dictionary":\{[^}]*"url":(?<value>"(?:\\.|[^"\\])*")/,
  );
  const durationMs = extractNumber(block, /"duration":(?<value>\d+)/);
  const normalizedThumbnailUrl = normalizeAppleMusicArtworkUrl(thumbnailUrl);

  if (!songId || !trackName || !artistNames || !appleSongUrl) {
    return null;
  }

  return {
    rank: index + 1,
    trackName,
    artistNames,
    appleSongId: songId,
    appleSongUrl,
    durationMs,
    thumbnailUrl: normalizedThumbnailUrl,
    rawItem: {
      trackName,
      artistNames,
      appleSongId: songId,
      appleSongUrl,
      durationMs,
      thumbnailUrl: normalizedThumbnailUrl,
    },
  };
}

function parsePlaylistTitle(html: string, fallbackCountryName: string) {
  const match = html.match(/<meta name="apple:title" content="(?<value>[^"]+)">/);
  return match?.groups?.value?.trim() || `Top 100: ${fallbackCountryName}`;
}

function parseTopSongsItems(html: string) {
  return splitTrackBlocks(html)
    .map((block, index) => parseTrackBlock(block, index))
    .filter((item): item is AppleMusicChartItem => Boolean(item));
}

export class AppleMusicChartsClient {
  async listAvailableTopSongsCountries(): Promise<AppleMusicCountryOption[]> {
    const cached = getCountryCache();
    if (cached) {
      return cached;
    }

    const html = await fetchText(APPLE_MUSIC_TOP_SONGS_INDEX_URL);
    const countries = parseCountryOptions(html);
    countryCache = {
      expiresAt: Date.now() + COUNTRY_DISCOVERY_CACHE_TTL_MS,
      data: cloneCountryOptions(countries),
    };
    return cloneCountryOptions(countries);
  }

  async fetchDailyTopSongs(countryCodeInput: string): Promise<AppleMusicTopSongsSnapshot> {
    const countryCode = normalizeAppleMusicCountryCode(countryCodeInput);
    const requestedCountrySlug = getAppleMusicCountrySlug(countryCodeInput);
    const countries = await this.listAvailableTopSongsCountries();
    const country =
      countries.find((item) => item.countryCode === countryCode) ??
      countries.find((item) => item.playlistSlug === requestedCountrySlug);

    if (!country) {
      throw new Error(`Unsupported Apple Music country code: ${countryCode}`);
    }

    const html = await fetchText(country.sourceUrl);
    const items = parseTopSongsItems(html);
    if (!items.length) {
      throw new Error(`No Apple Music top songs found for country=${country.countryCode}`);
    }

    const fetchedAt = new Date().toISOString();
    const chartEndDate = fetchedAt.slice(0, 10);
    const playlistTitle = parsePlaylistTitle(html, country.countryName);

    return {
      chartType: APPLE_MUSIC_TOP_SONGS_CHART_TYPE,
      periodType: APPLE_MUSIC_DAILY_PERIOD_TYPE,
      countryCode: country.countryCode,
      countryName:
        country.countryName ||
        (country.countryCode === APPLE_MUSIC_GLOBAL_COUNTRY_CODE
          ? APPLE_MUSIC_GLOBAL_COUNTRY_NAME
          : country.countryCode),
      chartEndDate,
      fetchedAt,
      sourceUrl: country.sourceUrl,
      playlistId: country.playlistId,
      playlistSlug: country.playlistSlug,
      playlistTitle,
      items,
      rawPayload: {
        sourceIndexUrl: APPLE_MUSIC_TOP_SONGS_INDEX_URL,
        playlistId: country.playlistId,
        playlistSlug: country.playlistSlug,
        playlistTitle,
        countryCode: country.countryCode,
        trackCount: items.length,
      },
    };
  }
}
