import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'REQUEST_FAILED',
  ) {
    super(message);
  }
}
export const currentDate = (timezone: string) =>
  formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
export const currentMonth = (timezone: string) => currentDate(timezone).slice(0, 7);
export function shiftMonth(month: string, offset: number) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + offset, 15));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function monthRange(month: string, timezone: string) {
  return {
    start: fromZonedTime(`${month}-01T00:00:00`, timezone),
    end: fromZonedTime(`${shiftMonth(month, 1)}-01T00:00:00`, timezone),
  };
}
export const localDate = (date: string, timezone: string) =>
  fromZonedTime(`${date}T12:00:00`, timezone);
export const validCalendarDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime()) &&
  new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
export function budgetMetrics(budget: number, spent: number) {
  const utilization = budget > 0 ? (spent / budget) * 100 : 0;
  const status =
    budget === 0
      ? 'unbudgeted'
      : utilization > 100
        ? 'overspending'
        : utilization === 100
          ? 'reached'
          : utilization >= 80
            ? 'warning'
            : 'normal';
  return { budget, spent, remaining: budget - spent, utilization, status };
}
export function daysInMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
