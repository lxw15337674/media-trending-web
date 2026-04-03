/**
 * Shared country code normalization and utilities.
 */

/**
 * Generic country code normalization.
 * - Handles 'global' as a special case
 * - Converts 2-letter codes to uppercase
 */
export function normalizeCountryCode(
  value: string | null | undefined,
  globalCode: string = 'global',
): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return globalCode;
  if (rawValue.toLowerCase() === globalCode) return globalCode;
  if (/^[A-Za-z]{2}$/.test(rawValue)) return rawValue.toUpperCase();
  return rawValue.toLowerCase();
}

/**
 * Get country display name using Intl.DisplayNames.
 */
export function getCountryName(countryCode: string, locale = 'en'): string {
  if (countryCode === 'global') {
    return 'Global';
  }

  // Only for 2-letter codes
  if (/^[A-Z]{2}$/.test(countryCode)) {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
      return displayNames.of(countryCode) ?? countryCode;
    } catch {
      return countryCode;
    }
  }

  return countryCode;
}

/**
 * Create aliases list for country code matching.
 * Adds both the normalized code and its slug version if different.
 */
export function getCountryCodeAliases(
  normalizedCode: string,
  slug: string | null,
): string[] {
  const aliases = new Set<string>([normalizedCode]);
  if (slug && slug !== normalizedCode.toLowerCase()) {
    aliases.add(slug);
  }
  return Array.from(aliases);
}

/**
 * Get country slug from normalized code using a mapping.
 */
export function getCountrySlug(
  normalizedCode: string,
  globalCode: string,
  mapping: Record<string, string>,
): string | null {
  if (normalizedCode === globalCode) {
    return globalCode;
  }
  return mapping[normalizedCode] ?? null;
}

/**
 * Get region code (2-letter uppercase) from any input.
 */
export function getRegionCode(normalizedCode: string, globalCode: string = 'global'): string | null {
  if (normalizedCode === globalCode) {
    return null;
  }
  return /^[A-Z]{2}$/.test(normalizedCode) ? normalizedCode : null;
}
