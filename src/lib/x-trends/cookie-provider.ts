import axios from 'axios';
import type { BrowserContextOptions } from 'playwright-core';
import type { XTrendTarget } from './types';

type ResolvedStorageState = Exclude<BrowserContextOptions['storageState'], undefined>;
type InMemoryStorageState = Exclude<ResolvedStorageState, string>;
type StorageStateCookie = InMemoryStorageState['cookies'][number];

const FIXED_X_COOKIE_WEBSITE = 'x.com';
const GIST_API_BASE_URL = 'https://api.github.com';
const GIST_API_MAX_RETRIES = 3;
const GIST_API_RETRYABLE_STATUS = new Set([403, 429, 500, 502, 503, 504]);

interface RawCookieRecord {
  name?: unknown;
  value?: unknown;
  domain?: unknown;
  path?: unknown;
  expirationDate?: unknown;
  expires?: unknown;
  expiration?: unknown;
  httpOnly?: unknown;
  secure?: unknown;
  sameSite?: unknown;
}

interface GistApiFilePayload {
  filename?: unknown;
  raw_url?: unknown;
  truncated?: unknown;
  content?: unknown;
}

interface GistApiPayload {
  files?: Record<string, GistApiFilePayload>;
  message?: unknown;
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateText(value: string | null, maxLength = 240) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function getNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeSameSite(value: unknown): StorageStateCookie['sameSite'] {
  const normalized = String(value ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'strict':
      return 'Strict';
    case 'none':
    case 'no_restriction':
      return 'None';
    case 'lax':
    default:
      return 'Lax';
  }
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}

function parseJsonString(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function normalizeCookieDomain(domain: string | null) {
  return domain?.trim().replace(/^\./, '').toLowerCase() ?? null;
}

function normalizeCookie(raw: RawCookieRecord): StorageStateCookie | null {
  const name = getString(raw.name);
  const value = typeof raw.value === 'string' ? raw.value : raw.value == null ? '' : String(raw.value);
  const domain = getString(raw.domain);
  const path = getString(raw.path) ?? '/';
  const expirationCandidate = raw.expirationDate ?? raw.expires ?? raw.expiration;
  const expires =
    typeof expirationCandidate === 'number' && Number.isFinite(expirationCandidate) && expirationCandidate > 0
      ? expirationCandidate
      : -1;

  if (!name || !domain) {
    return null;
  }

  return {
    name,
    value,
    domain,
    path,
    expires,
    httpOnly: normalizeBoolean(raw.httpOnly),
    secure: normalizeBoolean(raw.secure),
    sameSite: normalizeSameSite(raw.sameSite),
  } satisfies StorageStateCookie;
}

function normalizeHeaders(headers: unknown) {
  if (!headers || typeof headers !== 'object') {
    return {} as Record<string, unknown>;
  }

  return headers as Record<string, unknown>;
}

function extractCookieArrayFromDomainCookieMapEntry(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.cookies)) {
      return record.cookies;
    }
  }

  return null;
}

function extractCookieArrayFromContent(content: unknown, matchedWebsite: string | null): unknown[] | null {
  if (typeof content === 'string') {
    const parsed = parseJsonString(content);
    if (parsed != null) {
      return extractCookieArrayFromContent(parsed, matchedWebsite);
    }
  }

  if (Array.isArray(content)) {
    return content;
  }

  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>;

    if (Array.isArray(record.cookies)) {
      return record.cookies;
    }

    if (record.domainCookieMap && typeof record.domainCookieMap === 'object') {
      const map = record.domainCookieMap as Record<string, unknown>;
      const normalizedMatchedWebsite = normalizeCookieDomain(matchedWebsite);

      if (matchedWebsite) {
        const directHit = extractCookieArrayFromDomainCookieMapEntry(map[matchedWebsite]);
        if (directHit) {
          return directHit;
        }
      }

      if (normalizedMatchedWebsite) {
        for (const [domain, entry] of Object.entries(map)) {
          if (normalizeCookieDomain(domain) === normalizedMatchedWebsite) {
            const cookies = extractCookieArrayFromDomainCookieMapEntry(entry);
            if (cookies) {
              return cookies;
            }
          }
        }
      }

      const firstEntry = Object.values(map)
        .map((entry) => extractCookieArrayFromDomainCookieMapEntry(entry))
        .find((entry): entry is unknown[] => Array.isArray(entry) && entry.length > 0);

      if (firstEntry) {
        return firstEntry;
      }
    }
  }

  return null;
}

function buildGistApiError(params: {
  status: number;
  rawText: string | null;
  attempt: number;
  regionKey: string;
  gistId: string;
  remaining: number | null;
  reset: number | null;
}) {
  const detailParts = [
    params.remaining != null ? `remaining=${params.remaining}` : null,
    params.reset != null ? `reset=${params.reset}` : null,
  ].filter((part): part is string => Boolean(part));

  const bodySnippet = truncateText(params.rawText);
  if (bodySnippet) {
    detailParts.push(`body=${bodySnippet}`);
  }

  return new Error(
    `Gist cookie fetch failed status=${params.status} attempt=${params.attempt}/${GIST_API_MAX_RETRIES} region=${params.regionKey} gistId=${params.gistId}${detailParts.length ? ` ${detailParts.join(' ')}` : ''}`,
  );
}

function extractGistId(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const directMatch = trimmed.match(/^[0-9a-f]{20,}$/i);
  if (directMatch) {
    return directMatch[0];
  }

  try {
    const url = new URL(trimmed);
    const gistPathMatch = url.pathname.match(/([0-9a-f]{20,})/i);
    if (gistPathMatch) {
      return gistPathMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

function rankGistFileCandidate(filename: string | null) {
  if (!filename) {
    return 0;
  }

  const normalized = filename.toLowerCase();
  let score = 0;

  if (normalized.includes('cookie')) score += 10;
  if (normalized.includes('default')) score += 8;
  if (normalized.includes('x.com')) score += 6;
  if (normalized.includes('twitter')) score += 4;
  if (normalized.includes('x')) score += 2;

  return score;
}

async function fetchTextWithRetries(params: {
  url: string;
  headers?: Record<string, string>;
  label: string;
  regionKey: string;
  gistId: string;
}) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= GIST_API_MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(params.url, {
        headers: params.headers,
        responseType: 'text',
        timeout: 30_000,
        transformResponse: [(value) => value],
        validateStatus: () => true,
      });

      const rawText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      if (response.status >= 200 && response.status < 300) {
        return rawText;
      }

      const headers = normalizeHeaders(response.headers);
      lastError = buildGistApiError({
        status: response.status,
        rawText,
        attempt,
        regionKey: params.regionKey,
        gistId: params.gistId,
        remaining: getNumber(headers['x-ratelimit-remaining']),
        reset: getNumber(headers['x-ratelimit-reset']),
      });

      if (attempt < GIST_API_MAX_RETRIES && GIST_API_RETRYABLE_STATUS.has(response.status)) {
        await sleep(attempt * 1_500);
        continue;
      }

      throw lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < GIST_API_MAX_RETRIES) {
        await sleep(attempt * 1_500);
        continue;
      }
    }
  }

  throw lastError ?? new Error(`${params.label} failed for region=${params.regionKey} gistId=${params.gistId}`);
}

async function fetchGistCookieConfig(target: XTrendTarget) {
  const gistUrl = target.gistUrl?.trim() || null;
  const gistId = extractGistId(gistUrl);

  if (!gistId) {
    throw new Error(`Gist cookie source requires a valid gistUrl for region=${target.regionKey}`);
  }

  const apiUrl = `${GIST_API_BASE_URL}/gists/${gistId}`;
  const apiResponseText = await fetchTextWithRetries({
    url: apiUrl,
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'website-hot-history-x-trends',
    },
    label: 'Gist metadata fetch',
    regionKey: target.regionKey,
    gistId,
  });
  const apiPayload = parseJsonString(apiResponseText) as GistApiPayload | null;
  const files = apiPayload?.files;

  if (!files || typeof files !== 'object' || !Object.keys(files).length) {
    throw new Error(
      `Gist metadata did not include files for region=${target.regionKey} gistId=${gistId}${apiPayload?.message ? ` message=${String(apiPayload.message)}` : ''}`,
    );
  }

  const orderedFiles = Object.values(files).sort((left, right) => {
    const leftFilename = getString(left.filename);
    const rightFilename = getString(right.filename);
    return rankGistFileCandidate(rightFilename) - rankGistFileCandidate(leftFilename);
  });

  const attemptedFiles: string[] = [];

  for (const file of orderedFiles) {
    const filename = getString(file.filename) ?? '(unnamed)';
    attemptedFiles.push(filename);

    const rawUrl = getString(file.raw_url);
    const inlineContent = typeof file.content === 'string' && !normalizeBoolean(file.truncated) ? file.content : null;
    const fileContent =
      inlineContent ??
      (rawUrl
        ? await fetchTextWithRetries({
            url: rawUrl,
            headers: {
              Accept: 'text/plain',
              'User-Agent': 'website-hot-history-x-trends',
            },
            label: `Gist raw file fetch filename=${filename}`,
            regionKey: target.regionKey,
            gistId,
          })
        : null);

    if (!fileContent) {
      continue;
    }

    const cookieArray = extractCookieArrayFromContent(fileContent, FIXED_X_COOKIE_WEBSITE);
    if (cookieArray?.length) {
      return {
        content: fileContent,
        website: FIXED_X_COOKIE_WEBSITE,
        matchedWebsite: FIXED_X_COOKIE_WEBSITE,
        normalizedWebsite: FIXED_X_COOKIE_WEBSITE,
        sourceFile: filename,
      };
    }
  }

  throw new Error(
    `Gist cookie payload did not include cookies for region=${target.regionKey} gistId=${gistId} website=${FIXED_X_COOKIE_WEBSITE} files=${attemptedFiles.join(', ')}`,
  );
}

export async function resolveXTrendStorageState(target: XTrendTarget): Promise<ResolvedStorageState> {
  if (target.cookieSource === 'storage_state_file') {
    const storageStatePath = target.storageStatePath?.trim();
    if (!storageStatePath) {
      throw new Error(`storage_state_file cookie source requires storageStatePath for region=${target.regionKey}`);
    }

    return storageStatePath;
  }

  const payload = await fetchGistCookieConfig(target);
  const matchedWebsite =
    getString(payload.matchedWebsite) ?? getString(payload.normalizedWebsite) ?? FIXED_X_COOKIE_WEBSITE;
  const cookieArray = extractCookieArrayFromContent(payload.content, matchedWebsite);

  if (!cookieArray?.length) {
    throw new Error(
      `Gist cookie payload did not include cookies for region=${target.regionKey} matchedWebsite=${matchedWebsite}`,
    );
  }

  const cookies = cookieArray
    .map((item) => normalizeCookie(item as RawCookieRecord))
    .filter((item): item is StorageStateCookie => item !== null);

  if (!cookies.length) {
    throw new Error(`Gist cookie payload included no valid cookies for region=${target.regionKey}`);
  }

  return {
    cookies,
    origins: [],
  } satisfies InMemoryStorageState;
}
