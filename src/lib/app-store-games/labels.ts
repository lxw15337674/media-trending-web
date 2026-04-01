import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';
import { createRegionDisplayNames } from '@/lib/youtube-hot/labels';
import { normalizeAppStoreGameCountryCode } from './types';

function formatLabelWithCode(code: string, label: string) {
  const normalizedLabel = label.trim();
  if (!normalizedLabel || normalizedLabel === code) return code;
  return `${normalizedLabel} (${code})`;
}

export function getLocalizedAppStoreGameCountryLabel(
  countryCode: string | null | undefined,
  countryName: string | null | undefined,
  locale: Locale,
  displayNames?: Intl.DisplayNames | null,
) {
  const normalizedCode = normalizeAppStoreGameCountryCode(countryCode);
  const fallbackName = String(countryName ?? '').trim();
  let localized =
    (displayNames === undefined ? createRegionDisplayNames(locale) : displayNames)?.of(normalizedCode) ?? '';
  if (!localized) {
    try {
      localized = new Intl.DisplayNames([getIntlLocale(locale)], { type: 'region' }).of(normalizedCode) ?? '';
    } catch {
      localized = '';
    }
  }
  const baseLabel = localized && localized !== normalizedCode ? localized : fallbackName || normalizedCode;
  return formatLabelWithCode(normalizedCode, baseLabel);
}
