import type { BrowserContextOptions } from 'playwright-core';
import { resolveAdminApiStorageState } from '@/lib/admin-api/storage-state';
import type { XTrendTarget } from './types';

type ResolvedStorageState = Exclude<BrowserContextOptions['storageState'], undefined>;

const X_TREND_ADMIN_API_WEBSITES = ['x.com', 'twitter.com'] as const;

export async function resolveXTrendStorageState(target: XTrendTarget): Promise<ResolvedStorageState> {
  return resolveAdminApiStorageState({
    adminApiKey: target.adminApiKey,
    websites: X_TREND_ADMIN_API_WEBSITES,
    subject: `x-trends region=${target.regionKey}`,
  });
}
