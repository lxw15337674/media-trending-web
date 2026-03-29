import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveStandardPageDataErrorMessage } from '@/lib/page-data/runtime-error-message';
import { logServerError } from '@/lib/server/runtime-error';
import type { YouTubeLiveItem } from '@/lib/youtube-hot/types';
import { getLatestYouTubeLiveSnapshot } from '@/lib/youtube-live/db';

export interface YouTubeLivePageData {
  items: YouTubeLiveItem[];
  fetchedAt: string;
  errorMessage?: string | null;
  locale: Locale;
}

export async function buildYouTubeLivePageData(locale: Locale): Promise<YouTubeLivePageData> {
  const t = getMessages(locale).youtubeLive;
  const fallbackFetchedAt = new Date().toISOString();
  let fetchedAt = fallbackFetchedAt;
  let items: YouTubeLivePageData['items'] = [];
  let errorMessage: string | null = null;

  try {
    const snapshot = await getLatestYouTubeLiveSnapshot();

    if (!snapshot) {
      errorMessage = t.errorNoSnapshot;
    } else {
      fetchedAt = snapshot.crawledAt;
      items = snapshot.items;

      if (snapshot.status === 'failed') {
        errorMessage = snapshot.errorText
          ? `${t.errorLatestFailedPrefix}${snapshot.errorText}`
          : t.errorLatestFailed;
      }
    }
  } catch (error) {
    logServerError('youtube-live/page-data', error);
    errorMessage = resolveStandardPageDataErrorMessage(error, t, { fallbackToErrorMessage: true });
  }

  return {
    items,
    fetchedAt,
    errorMessage,
    locale,
  };
}
