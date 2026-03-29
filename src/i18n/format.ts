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

export function formatRelativeUpdate(value: string | null | undefined, locale: Locale) {
  if (!value) return '--';

  const parsed = dayjs.utc(value);
  if (!parsed.isValid()) return value;

  const now = dayjs.utc();
  const diffMinutes = Math.abs(now.diff(parsed, 'minute'));
  const diffHours = Math.abs(now.diff(parsed, 'hour'));
  const diffDays = Math.abs(now.diff(parsed, 'day'));

  const relativeFormatter = new Intl.RelativeTimeFormat(getIntlLocale(locale), {
    numeric: 'auto',
  });
  const wrapRelative = (text: string) => {
    switch (locale) {
      case 'zh':
        return `${text}更新`;
      case 'ja':
        return `${text}更新`;
      case 'es':
        return `Actualizado ${text}`;
      case 'en':
      default:
        return `Updated ${text}`;
    }
  };

  if (diffMinutes < 1) {
    switch (locale) {
      case 'zh':
        return '刚刚更新';
      case 'ja':
        return 'たった今更新';
      case 'es':
        return 'Actualizado ahora mismo';
      case 'en':
      default:
        return 'Updated just now';
    }
  }

  if (diffMinutes < 60) {
    return wrapRelative(relativeFormatter.format(-diffMinutes, 'minute'));
  }

  if (diffHours < 24) {
    return wrapRelative(relativeFormatter.format(-diffHours, 'hour'));
  }

  if (diffDays < 7) {
    return wrapRelative(relativeFormatter.format(-diffDays, 'day'));
  }

  if (diffDays >= 7) {
    const formatted = formatMonthDayTime(value, locale);
    switch (locale) {
      case 'zh':
        return `${formatted} 更新`;
      case 'ja':
        return `${formatted} 更新`;
      case 'es':
        return `Actualizado ${formatted}`;
      case 'en':
      default:
        return `Updated ${formatted}`;
    }
  }

  return '--';
}
