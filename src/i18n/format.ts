import dayjs from 'dayjs';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';

export function formatCompactNumber(value: number | null | undefined, locale: Locale) {
  if (value == null || !Number.isFinite(value)) return '--';

  return new Intl.NumberFormat(getIntlLocale(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMonthDay(value: string | null | undefined, locale: Locale) {
  if (!value) return '--';

  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed.toDate());
}

export function formatMonthDayTime(value: string | null | undefined, locale: Locale) {
  if (!value) return '--';

  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed.toDate());
}
