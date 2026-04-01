import { normalizeGooglePlayGameCountryCode } from './types';

export function getGooglePlayGameCountryName(countryCode: string) {
  const normalizedCountryCode = normalizeGooglePlayGameCountryCode(countryCode);
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(normalizedCountryCode) ?? normalizedCountryCode;
  } catch {
    return normalizedCountryCode;
  }
}
