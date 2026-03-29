export function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeCountryCode(rawValue: string | string[] | undefined) {
  const value = takeFirst(rawValue)?.trim().toUpperCase() ?? '';
  return /^[A-Z]{2}$/.test(value) ? value : null;
}

export function normalizeLowercaseKey(rawValue: string | string[] | undefined) {
  const value = takeFirst(rawValue)?.trim().toLowerCase() ?? '';
  return value || null;
}

export function normalizeNumberOption(rawValue: string | string[] | undefined, allowedValues: readonly number[]) {
  const value = Number(takeFirst(rawValue)?.trim());
  if (!Number.isFinite(value)) return null;
  return allowedValues.includes(value) ? value : null;
}

export function normalizeEnumOption<T extends string>(
  rawValue: string | string[] | undefined,
  allowedValues: readonly T[],
  options?: { transform?: 'lowercase' | 'uppercase' },
) {
  const raw = takeFirst(rawValue)?.trim() ?? '';
  const value =
    options?.transform === 'uppercase' ? raw.toUpperCase() : options?.transform === 'lowercase' ? raw.toLowerCase() : raw;
  return allowedValues.includes(value as T) ? (value as T) : null;
}
