import { normalizeCountryCode, getCountryName, getCountryCodeAliases } from '@/lib/countries/utils';
import {
  DEFAULT_SPOTIFY_TOP_SONGS_COUNTRY_CODES,
  SPOTIFY_GLOBAL_COUNTRY_CODE,
  SPOTIFY_GLOBAL_COUNTRY_NAME,
} from './types';

export const SPOTIFY_KNOWN_COUNTRY_CODES = Object.freeze(
  Array.from(new Set(DEFAULT_SPOTIFY_TOP_SONGS_COUNTRY_CODES)).sort((left, right) => {
    if (left === SPOTIFY_GLOBAL_COUNTRY_CODE) return -1;
    if (right === SPOTIFY_GLOBAL_COUNTRY_CODE) return 1;
    return left.localeCompare(right);
  }),
);

export function normalizeSpotifyCountryCode(value: string | null | undefined) {
  return normalizeCountryCode(value, SPOTIFY_GLOBAL_COUNTRY_CODE);
}

export function getSpotifyCountrySlug(value: string | null | undefined) {
  const normalized = normalizeSpotifyCountryCode(value);
  return normalized === SPOTIFY_GLOBAL_COUNTRY_CODE ? SPOTIFY_GLOBAL_COUNTRY_CODE : normalized.toLowerCase();
}

export function getSpotifyCountryCodeAliases(value: string | null | undefined) {
  return getCountryCodeAliases(normalizeSpotifyCountryCode(value), null);
}

export function getSpotifyCountryName(value: string | null | undefined, locale = 'en') {
  const normalized = normalizeSpotifyCountryCode(value);
  if (normalized === SPOTIFY_GLOBAL_COUNTRY_CODE) {
    return SPOTIFY_GLOBAL_COUNTRY_NAME;
  }
  return getCountryName(normalized, locale);
}
