'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RankingFilterField } from '@/components/rankings/RankingFilterField';
import type { ComboboxOption } from '@/components/ui/combobox';
import {
  GAME_CHART_PLATFORM_ANDROID,
  GAME_CHART_PLATFORM_APPLE,
  type GameChartPlatform,
} from '@/lib/game-charts/platform';

interface GamePlatformFilterProps {
  currentPlatform: GameChartPlatform;
  label: string;
  placeholder: string;
  emptyText: string;
  clearLabel: string;
  appleLabel: string;
  androidLabel: string;
}

export function GamePlatformFilter({
  currentPlatform,
  label,
  placeholder,
  emptyText,
  clearLabel,
  appleLabel,
  androidLabel,
}: GamePlatformFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const platformOptions: ComboboxOption[] = [
    {
      value: GAME_CHART_PLATFORM_APPLE,
      label: appleLabel,
      keywords: ['apple', 'ios', 'app store', appleLabel],
    },
    {
      value: GAME_CHART_PLATFORM_ANDROID,
      label: androidLabel,
      keywords: ['android', 'google play', androidLabel],
    },
  ];

  const updatePlatform = (nextPlatform: string) => {
    const normalizedPlatform =
      nextPlatform === GAME_CHART_PLATFORM_ANDROID ? GAME_CHART_PLATFORM_ANDROID : GAME_CHART_PLATFORM_APPLE;
    if (normalizedPlatform === currentPlatform) {
      return;
    }

    const nextPathname = pathname.replace(/\/games$/, '/games');
    const next = new URLSearchParams(searchParams.toString());
    if (normalizedPlatform === GAME_CHART_PLATFORM_APPLE) {
      next.delete('platform');
    } else {
      next.set('platform', GAME_CHART_PLATFORM_ANDROID);
    }

    const query = next.toString();
    router.replace(query ? `${nextPathname}?${query}` : nextPathname, { scroll: false });
  };

  return (
    <RankingFilterField
      label={label}
      options={platformOptions}
      value={currentPlatform}
      placeholder={placeholder}
      emptyText={emptyText}
      clearLabel={clearLabel}
      onValueChange={updatePlatform}
    />
  );
}
