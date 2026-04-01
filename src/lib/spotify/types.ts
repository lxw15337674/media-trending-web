export const SPOTIFY_TOP_SONGS_CHART_TYPE = 'tracks';
export const SPOTIFY_DAILY_PERIOD_TYPE = 'daily';
export const SPOTIFY_GLOBAL_COUNTRY_CODE = 'global';
export const SPOTIFY_GLOBAL_COUNTRY_NAME = 'Global';
export const SPOTIFY_CHARTS_BASE_URL = 'https://charts.spotify.com';
export const DEFAULT_SPOTIFY_TOP_SONGS_COUNTRY_CODES = [SPOTIFY_GLOBAL_COUNTRY_CODE, 'US', 'JP'] as const;

export interface SpotifyChartArtist {
  name: string;
}

export interface SpotifyCountryOption {
  countryCode: string;
  countryName: string;
}

export interface SpotifyChartItem {
  rank: number;
  previousRank: number | null;
  peakRank: number | null;
  appearancesOnChart: number | null;
  trackName: string;
  artistNames: string;
  artists: SpotifyChartArtist[];
  spotifyTrackId: string | null;
  spotifyTrackUri: string | null;
  spotifyTrackUrl: string | null;
  albumName: string | null;
  thumbnailUrl: string | null;
  streamCount: number | null;
  rawItem: unknown;
}

export interface SpotifyTopSongsSnapshot {
  chartType: typeof SPOTIFY_TOP_SONGS_CHART_TYPE;
  periodType: typeof SPOTIFY_DAILY_PERIOD_TYPE;
  countryCode: string;
  countryName: string;
  chartEndDate: string;
  fetchedAt: string;
  sourceUrl: string;
  chartAlias: string;
  items: SpotifyChartItem[];
  rawPayload: unknown;
}

export interface SpotifyTopSongsSnapshotWithItems {
  id: number;
  chartType: string;
  periodType: string;
  countryCode: string;
  countryName: string;
  chartEndDate: string;
  fetchedAt: string;
  sourceUrl: string;
  chartAlias: string;
  itemCount: number;
  items: SpotifyChartItem[];
}
