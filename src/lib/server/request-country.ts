type HeaderBag = {
  get: (name: string) => string | null;
};

function normalizeCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? '';
  if (!normalized) return null;
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  if (normalized === 'XX' || normalized === 'T1') return null;
  return normalized;
}

export function getRequestCountryCode(headers: HeaderBag) {
  return (
    normalizeCountryCode(headers.get('cf-ipcountry')) ??
    normalizeCountryCode(headers.get('x-vercel-ip-country')) ??
    normalizeCountryCode(headers.get('x-country-code'))
  );
}
