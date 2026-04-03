import { normalizeCountryCode, getCountryName, getCountryCodeAliases, getCountrySlug, getRegionCode } from '@/lib/countries/utils';

const APPLE_MUSIC_COUNTRY_SLUG_TO_CANONICAL_CODE: Record<string, string> = {
  argentina: 'AR',
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  brazil: 'BR',
  canada: 'CA',
  chile: 'CL',
  colombia: 'CO',
  czechia: 'CZ',
  denmark: 'DK',
  egypt: 'EG',
  finland: 'FI',
  france: 'FR',
  germany: 'DE',
  greece: 'GR',
  hongkong: 'HK',
  hungary: 'HU',
  india: 'IN',
  indonesia: 'ID',
  ireland: 'IE',
  israel: 'IL',
  italy: 'IT',
  japan: 'JP',
  malaysia: 'MY',
  mexico: 'MX',
  netherlands: 'NL',
  newzealand: 'NZ',
  norway: 'NO',
  philippines: 'PH',
  poland: 'PL',
  portugal: 'PT',
  romania: 'RO',
  saudiarabia: 'SA',
  singapore: 'SG',
  southafrica: 'ZA',
  southkorea: 'KR',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  taiwan: 'TW',
  thailand: 'TH',
  turkey: 'TR',
  uk: 'GB',
  usa: 'US',
  vietnam: 'VN',
};

const APPLE_MUSIC_CANONICAL_CODE_TO_COUNTRY_SLUG = Object.fromEntries(
  Object.entries(APPLE_MUSIC_COUNTRY_SLUG_TO_CANONICAL_CODE).map(([slug, code]) => [code, slug]),
) as Record<string, string>;

export const APPLE_MUSIC_KNOWN_COUNTRY_CODES = Object.freeze(
  Array.from(new Set(Object.values(APPLE_MUSIC_COUNTRY_SLUG_TO_CANONICAL_CODE))).sort(),
);

export function normalizeAppleMusicCountryCode(value: string | null | undefined) {
  return normalizeCountryCode(value, 'global');
}

export function getAppleMusicCountrySlug(value: string | null | undefined) {
  const normalizedCountryCode = normalizeAppleMusicCountryCode(value);
  return getCountrySlug(normalizedCountryCode, 'global', APPLE_MUSIC_CANONICAL_CODE_TO_COUNTRY_SLUG);
}

export function getAppleMusicCountryRegionCode(value: string | null | undefined) {
  const normalizedCountryCode = normalizeAppleMusicCountryCode(value);
  return getRegionCode(normalizedCountryCode, 'global');
}

export function getAppleMusicCountryCodeAliases(value: string | null | undefined) {
  const normalizedCountryCode = normalizeAppleMusicCountryCode(value);
  const slug = getAppleMusicCountrySlug(normalizedCountryCode);
  return getCountryCodeAliases(normalizedCountryCode, slug);
}

export function getAppleMusicCountryName(value: string | null | undefined, locale = 'en') {
  const regionCode = getAppleMusicCountryRegionCode(value);
  if (!regionCode) return null;
  return getCountryName(regionCode, locale);
}
