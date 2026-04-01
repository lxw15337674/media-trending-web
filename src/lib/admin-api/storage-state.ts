import axios from 'axios';
import type { BrowserContextOptions } from 'playwright-core';

type ResolvedStorageState = Exclude<BrowserContextOptions['storageState'], undefined>;
type InMemoryStorageState = Exclude<ResolvedStorageState, string>;
type StorageStateCookie = InMemoryStorageState['cookies'][number];
type StorageStateOrigin = InMemoryStorageState['origins'][number];
type StorageStateLocalStorageEntry = StorageStateOrigin['localStorage'][number];

const FIXED_ADMIN_API_BASE_URL = 'https://dev-api.bhwa233.com';
const ADMIN_API_MAX_RETRIES = 5;
const ADMIN_API_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

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

interface RawOriginRecord {
  origin?: unknown;
  localStorage?: unknown;
}

interface RawLocalStorageEntry {
  name?: unknown;
  value?: unknown;
}

interface AdminApiSuccessPayload {
  success?: boolean;
  error?: unknown;
  message?: unknown;
  code?: unknown;
  requestId?: unknown;
  data?: {
    website?: unknown;
    normalizedWebsite?: unknown;
    matchedWebsite?: unknown;
    sourceFile?: unknown;
    content?: unknown;
    storageState?: unknown;
  };
}

export interface ResolveAdminApiStorageStateOptions {
  adminApiKey: string | null | undefined;
  websites: readonly string[];
  subject: string;
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

function normalizeLocalStorageEntry(raw: RawLocalStorageEntry): StorageStateLocalStorageEntry | null {
  const name = getString(raw.name);
  if (!name) return null;

  return {
    name,
    value: raw.value == null ? '' : String(raw.value),
  } satisfies StorageStateLocalStorageEntry;
}

function normalizeOrigin(raw: RawOriginRecord): StorageStateOrigin | null {
  const origin = getString(raw.origin);
  if (!origin) return null;

  const localStorage = Array.isArray(raw.localStorage)
    ? raw.localStorage
        .map((entry) => normalizeLocalStorageEntry(entry as RawLocalStorageEntry))
        .filter((entry): entry is StorageStateLocalStorageEntry => entry !== null)
    : [];

  return {
    origin,
    localStorage,
  } satisfies StorageStateOrigin;
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

function extractCookiesFromDomainCookieMap(content: Record<string, unknown>, matchedWebsite: string | null) {
  if (!content.domainCookieMap || typeof content.domainCookieMap !== 'object') {
    return null;
  }

  const map = content.domainCookieMap as Record<string, unknown>;
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

  return (
    Object.values(map)
      .map((entry) => extractCookieArrayFromDomainCookieMapEntry(entry))
      .find((entry): entry is unknown[] => Array.isArray(entry) && entry.length > 0) ?? null
  );
}

function normalizeStorageStateFromContent(content: unknown, matchedWebsite: string | null): InMemoryStorageState | null {
  if (typeof content === 'string') {
    const parsed = parseJsonString(content);
    if (parsed != null) {
      return normalizeStorageStateFromContent(parsed, matchedWebsite);
    }
  }

  if (Array.isArray(content)) {
    const cookies = content
      .map((entry) => normalizeCookie(entry as RawCookieRecord))
      .filter((entry): entry is StorageStateCookie => entry !== null);

    return cookies.length ? { cookies, origins: [] } : null;
  }

  if (!content || typeof content !== 'object') {
    return null;
  }

  const record = content as Record<string, unknown>;
  if ('storageState' in record) {
    return normalizeStorageStateFromContent(record.storageState, matchedWebsite);
  }

  const cookies = Array.isArray(record.cookies)
    ? record.cookies
        .map((entry) => normalizeCookie(entry as RawCookieRecord))
        .filter((entry): entry is StorageStateCookie => entry !== null)
    : [];
  const origins = Array.isArray(record.origins)
    ? record.origins
        .map((entry) => normalizeOrigin(entry as RawOriginRecord))
        .filter((entry): entry is StorageStateOrigin => entry !== null)
    : [];

  if (cookies.length > 0 || origins.length > 0) {
    return {
      cookies,
      origins,
    } satisfies InMemoryStorageState;
  }

  const cookieArray = extractCookiesFromDomainCookieMap(record, matchedWebsite);
  if (cookieArray?.length) {
    const normalizedCookies = cookieArray
      .map((entry) => normalizeCookie(entry as RawCookieRecord))
      .filter((entry): entry is StorageStateCookie => entry !== null);
    if (normalizedCookies.length > 0) {
      return {
        cookies: normalizedCookies,
        origins: [],
      } satisfies InMemoryStorageState;
    }
  }

  return null;
}

function buildAdminApiError(params: {
  status: number;
  payload: AdminApiSuccessPayload | null;
  rawText: string | null;
  attempt: number;
  subject: string;
  website: string;
}) {
  const detailParts = [
    `website=${params.website}`,
    getString(params.payload?.code) ? `code=${getString(params.payload?.code)}` : null,
    getString(params.payload?.error) ? `error=${getString(params.payload?.error)}` : null,
    getString(params.payload?.message) ? `message=${getString(params.payload?.message)}` : null,
    getString(params.payload?.requestId) ? `requestId=${getString(params.payload?.requestId)}` : null,
  ].filter((part): part is string => Boolean(part));

  const bodySnippet = truncateText(params.rawText);
  if (bodySnippet && !detailParts.some((part) => part.includes(bodySnippet))) {
    detailParts.push(`body=${bodySnippet}`);
  }

  return new Error(
    `Admin API storage-state fetch failed status=${params.status} attempt=${params.attempt}/${ADMIN_API_MAX_RETRIES} subject=${params.subject}${detailParts.length ? ` ${detailParts.join(' ')}` : ''}`,
  );
}

async function fetchAdminApiAuthConfig(options: ResolveAdminApiStorageStateOptions) {
  const apiKey = options.adminApiKey?.trim();
  if (!apiKey) {
    throw new Error(`Admin API storage-state source requires adminApiKey for ${options.subject}`);
  }

  let lastError: Error | null = null;

  for (const website of options.websites) {
    const url = new URL('/api/admin/gist-cookie', FIXED_ADMIN_API_BASE_URL);
    url.searchParams.set('website', website);

    for (let attempt = 1; attempt <= ADMIN_API_MAX_RETRIES; attempt += 1) {
      try {
        const response = await axios.get(url.toString(), {
          headers: {
            'x-api-key': apiKey,
          },
          responseType: 'text',
          timeout: 30_000,
          transformResponse: [(value) => value],
          validateStatus: () => true,
        });

        const rawText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const parsedPayload = rawText ? (parseJsonString(rawText) as AdminApiSuccessPayload | null) : null;

        if (response.status < 200 || response.status >= 300) {
          lastError = buildAdminApiError({
            status: response.status,
            payload: parsedPayload,
            rawText,
            attempt,
            subject: options.subject,
            website,
          });

          if (attempt < ADMIN_API_MAX_RETRIES && ADMIN_API_RETRYABLE_STATUS.has(response.status)) {
            await sleep(attempt * 1_500);
            continue;
          }

          const errorCode = getString(parsedPayload?.code)?.toUpperCase();
          if (response.status === 404 || errorCode === 'NOT_FOUND') {
            break;
          }

          throw lastError;
        }

        if (!parsedPayload?.success || !parsedPayload.data) {
          throw new Error(
            `Admin API storage-state fetch returned unexpected payload for ${options.subject} website=${website}${rawText ? ` body=${truncateText(rawText)}` : ''}`,
          );
        }

        return parsedPayload.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < ADMIN_API_MAX_RETRIES) {
          await sleep(attempt * 1_500);
          continue;
        }
      }
    }
  }

  throw lastError ?? new Error(`Admin API storage-state fetch failed for ${options.subject}`);
}

export async function resolveAdminApiStorageState(
  options: ResolveAdminApiStorageStateOptions,
): Promise<ResolvedStorageState> {
  const payload = await fetchAdminApiAuthConfig(options);
  const matchedWebsite =
    getString(payload.matchedWebsite) ?? getString(payload.normalizedWebsite) ?? options.websites[0] ?? null;

  const storageState =
    normalizeStorageStateFromContent(payload.storageState, matchedWebsite) ??
    normalizeStorageStateFromContent(payload.content, matchedWebsite) ??
    normalizeStorageStateFromContent(payload, matchedWebsite);

  if (!storageState) {
    throw new Error(
      `Admin API payload did not include valid storage state for ${options.subject} matchedWebsite=${matchedWebsite ?? 'n/a'}`,
    );
  }

  return storageState;
}
