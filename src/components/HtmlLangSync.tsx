'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { localeFromPathname } from '@/i18n/config';
import { getHtmlLang } from '@/i18n/locale-meta';

export function HtmlLangSync() {
  const pathname = usePathname();

  useEffect(() => {
    const locale = localeFromPathname(pathname);
    document.documentElement.lang = getHtmlLang(locale);
  }, [pathname]);

  return null;
}
