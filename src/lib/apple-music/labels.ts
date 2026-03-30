import type { Locale } from '@/i18n/config';
import { getLocalizedYouTubeRegionLabel } from '@/lib/youtube-hot/labels';
import { getAppleMusicCountryRegionCode, normalizeAppleMusicCountryCode } from './countries';

const APPLE_MUSIC_GLOBAL_LABELS: Record<Locale, string> = {
  zh: '全球',
  en: 'Global',
  es: 'Global',
  ja: 'グローバル',
};

function normalizeAppleMusicFallbackLabel(value: string | null | undefined) {
  return String(value ?? '').trim();
}

export { getAppleMusicCountryRegionCode } from './countries';

export function getLocalizedAppleMusicCountryLabel(
  countryCode: string | null | undefined,
  countryName: string | null | undefined,
  locale: Locale,
  displayNames?: Intl.DisplayNames | null,
) {
  const normalizedCountryCode = normalizeAppleMusicCountryCode(countryCode);
  const fallbackLabel = normalizeAppleMusicFallbackLabel(countryName);

  if (normalizedCountryCode === 'global') {
    return fallbackLabel || APPLE_MUSIC_GLOBAL_LABELS[locale];
  }

  const regionCode = getAppleMusicCountryRegionCode(normalizedCountryCode);
  if (!regionCode) {
    return fallbackLabel || normalizedCountryCode;
  }

  return getLocalizedYouTubeRegionLabel(regionCode, fallbackLabel || regionCode, locale, displayNames);
}
