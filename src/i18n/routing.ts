import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/config';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeCookie: {
    name: 'lang',
    maxAge: 60 * 60 * 24 * 180,
    sameSite: 'lax',
  },
});
