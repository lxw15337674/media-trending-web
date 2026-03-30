export function normalizeAppleMusicArtworkUrl(
  url: string | null | undefined,
  size = 632,
  format: 'jpg' | 'png' | 'webp' = 'jpg',
) {
  const normalizedUrl = String(url ?? '').trim();
  if (!normalizedUrl) return null;

  return normalizedUrl
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', format);
}
