import { normalizeAppStoreGameCountryCode } from './types';

export function getAppStoreGameCountryName(countryCode: string) {
  const normalizedCountryCode = normalizeAppStoreGameCountryCode(countryCode);
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(normalizedCountryCode) ?? normalizedCountryCode;
  } catch {
    return normalizedCountryCode;
  }
}
