import type { BrowserContextOptions } from 'playwright-core';
import { resolveAdminApiStorageState } from '@/lib/admin-api/storage-state';

type ResolvedStorageState = Exclude<BrowserContextOptions['storageState'], undefined>;

const SPOTIFY_ADMIN_API_WEBSITES = ['charts.spotify.com', 'spotify.com', 'accounts.spotify.com'] as const;

export async function resolveSpotifyStorageState(options: {
  adminApiKey: string | null | undefined;
  subject?: string;
}): Promise<ResolvedStorageState> {
  return resolveAdminApiStorageState({
    adminApiKey: options.adminApiKey,
    websites: SPOTIFY_ADMIN_API_WEBSITES,
    subject: options.subject ?? 'spotify',
  });
}
