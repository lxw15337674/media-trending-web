import { resolveXTrendRegionLabel, resolveXTrendRegionLocationConfig } from './regions';
import { XTrendTarget } from './types';

const DEFAULT_TARGET_REGIONS = [
  { regionKey: 'us' },
  { regionKey: 'jp' },
  { regionKey: 'id' },
  { regionKey: 'in' },
  { regionKey: 'gb' },
  { regionKey: 'de' },
  { regionKey: 'tr' },
  { regionKey: 'mx' },
  { regionKey: 'br' },
  { regionKey: 'hk' },
  { regionKey: 'sa' },
  { regionKey: 'th' },
  { regionKey: 'my' },
  { regionKey: 'ph' },
  { regionKey: 'vn' },
  { regionKey: 'kr' },
  { regionKey: 'tw' },
  { regionKey: 'sg' },
  { regionKey: 'ca' },
  { regionKey: 'fr' },
] as const;
const DEFAULT_TARGET_URL = 'https://x.com/explore/tabs/trending';

function buildTarget(input: {
  regionKey: string;
  regionLabel?: string | null;
  placeId?: string | null;
  locationSearchQuery?: string | null;
  locationSelectText?: string | null;
  adminApiKey?: string | null;
  targetUrl?: string | null;
  browserExecutablePath?: string | null;
  locale?: string | null;
}): XTrendTarget {
  const regionKey = input.regionKey.trim().toLowerCase();
  const explicitRegionLabel = input.regionLabel?.trim() || null;
  const explicitPlaceId = input.placeId?.trim() || null;
  const explicitLocationSearchQuery = input.locationSearchQuery?.trim() || null;
  const explicitLocationSelectText = input.locationSelectText?.trim() || null;
  const adminApiKey = input.adminApiKey?.trim() || null;
  const targetUrl = input.targetUrl?.trim() || DEFAULT_TARGET_URL;
  const browserExecutablePath = input.browserExecutablePath?.trim() || null;
  const locale = input.locale?.trim() || null;

  if (!regionKey) {
    throw new Error('X Trends target is missing regionKey.');
  }

  const resolvedLocationConfig = resolveXTrendRegionLocationConfig(regionKey);
  const placeId = explicitPlaceId ?? resolvedLocationConfig.placeId ?? null;
  const locationSearchQuery = explicitLocationSearchQuery ?? resolvedLocationConfig.locationSearchQuery ?? null;
  const locationSelectText = explicitLocationSelectText ?? resolvedLocationConfig.locationSelectText ?? null;

  if (!placeId && (!locationSearchQuery || !locationSelectText)) {
    throw new Error(
      `X Trends target region=${regionKey} must provide placeId or both locationSearchQuery/locationSelectText.`,
    );
  }

  if (!adminApiKey) {
    throw new Error(`X Trends target region=${regionKey} is missing adminApiKey for admin_api source.`);
  }

  return {
    regionKey,
    regionLabel: resolveXTrendRegionLabel(regionKey, explicitRegionLabel),
    placeId,
    locationSearchQuery,
    locationSelectText,
    adminApiKey,
    targetUrl,
    browserExecutablePath,
    locale,
  } satisfies XTrendTarget;
}

function parseJsonTargets(raw: string): XTrendTarget[] {
  const parsed = JSON.parse(raw) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [parsed];

  return rows.map((row, index) => {
    if (!row || typeof row !== 'object') {
      throw new Error(`X_TREND_TARGETS_JSON item ${index} must be an object`);
    }

    const record = row as Record<string, unknown>;
    return buildTarget({
      regionKey: String(record.regionKey ?? ''),
      regionLabel: String(record.regionLabel ?? '').trim() || null,
      placeId: String(record.placeId ?? '').trim() || null,
      locationSearchQuery: String(record.locationSearchQuery ?? '').trim() || null,
      locationSelectText: String(record.locationSelectText ?? '').trim() || null,
      adminApiKey: String(record.adminApiKey ?? '').trim() || null,
      targetUrl: String(record.targetUrl ?? DEFAULT_TARGET_URL),
      browserExecutablePath: String(record.browserExecutablePath ?? '').trim() || null,
      locale: String(record.locale ?? '').trim() || null,
    });
  });
}

function loadDefaultTargetsFromCode(): XTrendTarget[] {
  const adminApiKey = process.env.API_KEY?.trim() || null;
  const targetUrl = process.env.X_TREND_TARGET_URL?.trim() || DEFAULT_TARGET_URL;
  const browserExecutablePath = process.env.X_TREND_BROWSER_EXECUTABLE_PATH?.trim() || null;
  const locale = process.env.X_TREND_LOCALE?.trim() || null;

  return DEFAULT_TARGET_REGIONS.map((target) =>
    buildTarget({
      regionKey: target.regionKey,
      adminApiKey,
      targetUrl,
      browserExecutablePath,
      locale,
    }),
  );
}

export function loadXTrendTargetsFromEnv(): XTrendTarget[] {
  const jsonTargets = process.env.X_TREND_TARGETS_JSON?.trim();
  if (jsonTargets) {
    return parseJsonTargets(jsonTargets);
  }

  return loadDefaultTargetsFromCode();
}
