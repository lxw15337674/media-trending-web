export const GAME_CHART_PLATFORM_APPLE = 'apple';
export const GAME_CHART_PLATFORM_ANDROID = 'android';

export type GameChartPlatform = typeof GAME_CHART_PLATFORM_APPLE | typeof GAME_CHART_PLATFORM_ANDROID;

export function normalizeGameChartPlatform(value: string | string[] | null | undefined): GameChartPlatform {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return String(rawValue ?? '').trim().toLowerCase() === GAME_CHART_PLATFORM_ANDROID
    ? GAME_CHART_PLATFORM_ANDROID
    : GAME_CHART_PLATFORM_APPLE;
}
