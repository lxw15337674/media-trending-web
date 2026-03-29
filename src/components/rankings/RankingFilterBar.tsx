import type { ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RankingFilterBarProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function RankingFilterBar({ children, className, contentClassName }: RankingFilterBarProps) {
  return (
    <Card className={cn('border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85', className)}>
      <CardHeader className={cn('p-2 md:p-3', contentClassName)}>{children}</CardHeader>
    </Card>
  );
}
