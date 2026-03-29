export function hasMatchingCode<T>(
  items: readonly T[],
  code: string | null | undefined,
  getCode: (item: T) => string,
) {
  if (!code) return false;
  return items.some((item) => getCode(item) === code);
}

export function resolvePreferredCode<T>(params: {
  items: readonly T[];
  candidates: Array<string | null | undefined>;
  getCode: (item: T) => string;
  fallback: string;
}) {
  for (const candidate of params.candidates) {
    if (hasMatchingCode(params.items, candidate, params.getCode)) {
      return candidate as string;
    }
  }

  return params.items[0] ? params.getCode(params.items[0]) : params.fallback;
}
