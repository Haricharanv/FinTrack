import { format, parseISO } from 'date-fns';
import type { BudgetStatus } from './types';

export function money(minor: number, currency = 'INR', compact = false) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 1 : minor % 100 === 0 ? 0 : 2,
    ...(compact ? { notation: 'compact' as const } : {}),
  }).format(minor / 100);
}
export function today(timezone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const val = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${val('year')}-${val('month')}-${val('day')}`;
}
export const monthTitle = (month: string) => format(parseISO(`${month}-01`), 'MMMM yyyy');
export const dateTitle = (date: string) => format(parseISO(date.slice(0, 10)), 'dd MMM yyyy');
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
export const statusLabel: Record<BudgetStatus, string> = {
  normal: 'On track',
  warning: 'Near limit',
  reached: 'Budget reached',
  overspending: 'Over budget',
  unbudgeted: 'No budget set',
};
export function downloadCSV(rows: (string | number)[][], filename: string) {
  const escape = (v: string | number) => {
    let s = String(v);
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
