import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RankingStatusCardProps {
  variant: 'error' | 'empty';
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function RankingStatusCard({
  variant,
  children,
  className,
  contentClassName,
}: RankingStatusCardProps) {
  const cardClassName =
    variant === 'error'
      ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
      : 'border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80';
  const bodyClassName =
    variant === 'error'
      ? 'p-4 text-base text-red-700 dark:text-red-200'
      : 'p-10 text-center text-zinc-500 dark:text-zinc-400';

  return (
    <Card className={cn(cardClassName, className)}>
      <CardContent className={cn(bodyClassName, contentClassName)}>{children}</CardContent>
    </Card>
  );
}
