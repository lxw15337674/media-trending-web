import { getCountryName } from '@/lib/countries/utils';
import { normalizeGooglePlayGameCountryCode } from './types';

export function getGooglePlayGameCountryName(countryCode: string) {
  const normalizedCountryCode = normalizeGooglePlayGameCountryCode(countryCode);
  return getCountryName(normalizedCountryCode, 'en');
}
