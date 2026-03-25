import type { Locale } from '@/i18n/config';

export const LOCALE_META: Record<
  Locale,
  {
    htmlLang: string;
    intlLocale: string;
    label: string;
  }
> = {
  en: {
    htmlLang: 'en',
    intlLocale: 'en-US',
    label: 'English',
  },
  zh: {
    htmlLang: 'zh-CN',
    intlLocale: 'zh-CN',
    label: '中文',
  },
  es: {
    htmlLang: 'es',
    intlLocale: 'es-ES',
    label: 'Español',
  },
  ja: {
    htmlLang: 'ja',
    intlLocale: 'ja-JP',
    label: '日本語',
  },
};

export function getHtmlLang(locale: Locale) {
  return LOCALE_META[locale].htmlLang;
}

export function getIntlLocale(locale: Locale) {
  return LOCALE_META[locale].intlLocale;
}

export function getLocaleLabel(locale: Locale) {
  return LOCALE_META[locale].label;
}

export function usesTightUnitSpacing(locale: Locale) {
  return locale === 'zh' || locale === 'ja';
}
