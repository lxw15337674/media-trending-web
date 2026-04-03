import { getCountryName } from '@/lib/countries/utils';
import { normalizeAppStoreGameCountryCode } from './types';

export function getAppStoreGameCountryName(countryCode: string) {
  const normalizedCountryCode = normalizeAppStoreGameCountryCode(countryCode);
  return getCountryName(normalizedCountryCode, 'en');
}
