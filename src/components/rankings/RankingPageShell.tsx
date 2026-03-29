import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_CLASS =
  'min-h-screen bg-gradient-to-b from-zinc-100 via-zinc-50 to-white pb-10 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100';
const DEFAULT_SECTION_CLASS = 'mx-auto w-full px-4 pt-2 md:px-6 md:pt-6 lg:w-[80%]';

interface RankingPageShellProps {
  title: string;
  children: ReactNode;
  jsonLd?: unknown;
  className?: string;
  sectionClassName?: string;
}

export function RankingPageShell({
  title,
  children,
  jsonLd,
  className,
  sectionClassName,
}: RankingPageShellProps) {
  return (
    <main suppressHydrationWarning className={cn(DEFAULT_PAGE_CLASS, className)}>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <h1 className="sr-only">{title}</h1>
      <section className={cn(DEFAULT_SECTION_CLASS, sectionClassName)}>{children}</section>
    </main>
  );
}
