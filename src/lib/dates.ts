import type { DateKey } from './types.ts';

const pad = (n: number) => String(n).padStart(2, '0');

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

/** "Sunday, Nov 8" */
export function longDay(key: DateKey): string {
  const d = fromKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** "Fri, Nov 13" */
export function shortDate(key: DateKey): string {
  const d = fromKey(key);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** How a due date reads on a task row, relative to today: "Today", "Tomorrow", "Fri", "Nov 30". */
export function relativeDay(key: DateKey, today: DateKey): string {
  const diff = daysBetween(today, key);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = fromKey(key);
  if (diff > 1 && diff < 7) return WEEKDAYS[d.getDay()].slice(0, 3);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** "4 pm", "4:30 pm", "noon" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (h === 12 && m === 0) return 'noon';
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${pad(m)} ${suffix}`;
}
