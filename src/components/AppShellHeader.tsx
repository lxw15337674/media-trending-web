import { SiteHeader } from '@/components/SiteHeader';
import type { Locale } from '@/i18n/config';

interface AppShellHeaderProps {
  locale: Locale;
}

export function AppShellHeader({ locale }: AppShellHeaderProps) {
  return <SiteHeader locale={locale} />;
}
