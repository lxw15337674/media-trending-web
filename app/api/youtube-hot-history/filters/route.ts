import { NextRequest, NextResponse } from 'next/server';
import { getLatestPublishedBatch, listLatestYouTubeHotFilters } from '@/lib/youtube-hot/db';

function normalizeFilterValue(value: string | null) {
  const normalized = value?.trim() ?? '';
  if (!normalized || normalized.toLowerCase() === 'all') return null;
  return normalized.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = normalizeFilterValue(searchParams.get('region'));
    const [batch, filters] = await Promise.all([getLatestPublishedBatch(), listLatestYouTubeHotFilters(region)]);

    return NextResponse.json({
      batch,
      data: filters,
    });
  } catch (error) {
    console.error('youtube hot filters api error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
