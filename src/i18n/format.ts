import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';

dayjs.extend(utc);
dayjs.extend(relativeTime);

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
    timeZone: 'UTC',
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
    timeZone: 'UTC',
  }).format(parsed.toDate());
}

export function formatRelativeUpdateZh(value: string | null | undefined) {
  if (!value) return '--';

  const parsed = dayjs.utc(value);
  if (!parsed.isValid()) return value;

  const now = dayjs.utc();
  const diffMinutes = Math.abs(now.diff(parsed, 'minute'));
  const diffHours = Math.abs(now.diff(parsed, 'hour'));
  const diffDays = Math.abs(now.diff(parsed, 'day'));

  if (diffMinutes < 1) {
    return '刚刚更新';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前更新`;
  }

  if (diffHours < 24) {
    return `${diffHours} 小时前更新`;
  }

  if (diffDays < 7) {
    return `${diffDays} 天前更新`;
  }

  if (diffDays >= 7) {
    return `${formatMonthDayTime(value, 'zh')} 更新`;
  }

  return '--';
}
