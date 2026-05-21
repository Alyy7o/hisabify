import {
  parseISO,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isAfter,
} from 'date-fns';
import type { AnalyticsFilterType } from '@/components/analytics/AnalyticsDateFilter';

export function getAnalyticsDateRange(
  filter: AnalyticsFilterType,
  options: { selectedDay: string; rangeStart: string; rangeEnd: string }
): { start: Date; end: Date } {
  const now = new Date();

  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'yearly':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'day': {
      const day = parseISO(options.selectedDay);
      return { start: startOfDay(day), end: endOfDay(day) };
    }
    case 'range': {
      let start = startOfDay(parseISO(options.rangeStart));
      let end = endOfDay(parseISO(options.rangeEnd));
      if (isAfter(start, end)) {
        [start, end] = [end, start];
      }
      return { start, end };
    }
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}
