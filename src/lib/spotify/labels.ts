import type { Locale } from '@/i18n/config';
import { getSpotifyCountryName, normalizeSpotifyCountryCode } from './countries';

const GLOBAL_LABELS: Record<Locale, string> = {
  en: 'Global',
  zh: '全球',
  es: 'Global',
  ja: 'グローバル',
};

export function getLocalizedSpotifyCountryLabel(
  value: string | null | undefined,
  fallbackName: string | null | undefined,
  locale: Locale,
  regionDisplayNames?: Intl.DisplayNames | null,
) {
  const normalized = normalizeSpotifyCountryCode(value);
  if (normalized === 'global') {
    return GLOBAL_LABELS[locale];
  }

  if (regionDisplayNames) {
    try {
      const localized = regionDisplayNames.of(normalized);
      if (localized) return localized;
    } catch {
      // Ignore localized label lookup failures.
    }
  }

  return fallbackName?.trim() || getSpotifyCountryName(normalized, locale) || normalized;
}
