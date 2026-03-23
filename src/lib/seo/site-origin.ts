const FALLBACK_SITE_URL = 'http://localhost:3003';

function resolveRawSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL is required in production to generate canonical URLs.');
  }

  return FALLBACK_SITE_URL;
}

export function getSiteOrigin(): URL {
  const normalized = resolveRawSiteUrl()
    .trim()
    .replace(/^['"]+|['"]+$/g, '');

  try {
    return new URL(normalized);
  } catch {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid NEXT_PUBLIC_SITE_URL value: "${normalized}"`);
    }
    return new URL(FALLBACK_SITE_URL);
  }
}

export function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteOrigin()).toString();
}
