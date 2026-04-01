export function parsePositiveNumber(rawValue: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized < min) return min;
  if (normalized > max) return max;
  return normalized;
}

export function parseCountryList(rawValue: string | undefined) {
  if (!rawValue) return null;
  const countryCodes = Array.from(
    new Set(
      rawValue
        .split(/[,\s]+/)
        .map((value) => value.trim().toUpperCase())
        .filter((value) => /^[A-Z]{2}$/.test(value)),
    ),
  );
  return countryCodes.length ? countryCodes : null;
}

export function parseNumberList(rawValue: string | undefined, min: number, max: number) {
  if (!rawValue) return null;
  const values = Array.from(
    new Set(
      rawValue
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.floor(value))
        .filter((value) => value >= min && value <= max),
    ),
  );
  return values.length ? values : null;
}

export function parseEnumList<T extends string>(rawValue: string | undefined, allowedValues: readonly T[]) {
  if (!rawValue) return null;
  const allowed = new Set(allowedValues);
  const values = Array.from(
    new Set(
      rawValue
        .split(/[,\s]+/)
        .map((value) => value.trim().toLowerCase())
        .filter((value): value is T => allowed.has(value as T)),
    ),
  );
  return values.length ? values : null;
}

export function parseSnapshotHourArg(args: string[], options: {
  parseSnapshotHour: (value: string) => string | null;
  toSnapshotHour: () => string;
  example: string;
}) {
  const hourArg = args.find((arg) => arg.startsWith('--hour='))?.split('=')[1];
  const snapshotHour = hourArg ? options.parseSnapshotHour(hourArg) : options.toSnapshotHour();
  if (!snapshotHour) {
    throw new Error(`Invalid --hour format. Example: --hour=${options.example}`);
  }

  return snapshotHour;
}
