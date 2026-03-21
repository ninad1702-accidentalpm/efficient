import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfDay,
  isBefore,
  isEqual,
  isAfter,
  getDay,
  getDate,
  getDaysInMonth,
  format,
  parseISO,
} from "date-fns";
import type { RecurringTask } from "./types";

const MAX_ITERATIONS = 366;

/**
 * Clamp day-of-month to last valid day for the given month/year.
 * e.g. day=31, month=February → 28 (or 29 in leap year)
 */
export function getEffectiveDayOfMonth(
  day: number,
  year: number,
  month: number // 0-indexed (JS Date convention)
): number {
  const maxDay = getDaysInMonth(new Date(year, month));
  return Math.min(day, maxDay);
}

/**
 * Check if `today` matches the rule's schedule.
 */
export function shouldGenerateToday(
  rule: RecurringTask,
  today: Date
): boolean {
  const start = startOfDay(parseISO(rule.start_date));
  const t = startOfDay(today);

  if (isBefore(t, start)) return false;
  if (rule.end_date && isAfter(t, startOfDay(parseISO(rule.end_date))))
    return false;

  // For interval-based skipping, count steps from start_date
  switch (rule.frequency) {
    case "daily": {
      const diffDays = Math.round(
        (t.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays % rule.interval === 0;
    }

    case "weekly": {
      const diffWeeks = Math.floor(
        (t.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      if (diffWeeks % rule.interval !== 0) return false;
      const dow = getDay(t); // 0=Sun..6=Sat
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        return rule.days_of_week.includes(dow);
      }
      // Default: same day-of-week as start_date
      return dow === getDay(start);
    }

    case "monthly": {
      // Count months between start and today
      const monthsDiff =
        (t.getFullYear() - start.getFullYear()) * 12 +
        (t.getMonth() - start.getMonth());
      if (monthsDiff < 0 || monthsDiff % rule.interval !== 0) return false;
      const targetDay = rule.day_of_month ?? getDate(start);
      const effectiveDay = getEffectiveDayOfMonth(
        targetDay,
        t.getFullYear(),
        t.getMonth()
      );
      return getDate(t) === effectiveDay;
    }

    case "yearly": {
      const yearsDiff = t.getFullYear() - start.getFullYear();
      if (yearsDiff < 0 || yearsDiff % rule.interval !== 0) return false;
      // Same month and day (clamped)
      if (t.getMonth() !== start.getMonth()) return false;
      const targetDay = rule.day_of_month ?? getDate(start);
      const effectiveDay = getEffectiveDayOfMonth(
        targetDay,
        t.getFullYear(),
        t.getMonth()
      );
      return getDate(t) === effectiveDay;
    }

    default:
      return false;
  }
}

/**
 * Find the next due date after `afterDate` for a rule (max 366 iterations).
 * Returns null if rule has ended or max iterations reached.
 */
export function getNextDueDate(
  rule: RecurringTask,
  afterDate: Date
): Date | null {
  let candidate = startOfDay(addDays(afterDate, 1));

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (rule.end_date && isAfter(candidate, startOfDay(parseISO(rule.end_date))))
      return null;

    if (shouldGenerateToday(rule, candidate)) {
      return candidate;
    }

    // Advance based on frequency for efficiency
    switch (rule.frequency) {
      case "daily":
        candidate = addDays(candidate, 1);
        break;
      case "weekly":
        candidate = addDays(candidate, 1);
        break;
      case "monthly":
        candidate = addDays(candidate, 1);
        break;
      case "yearly":
        candidate = addDays(candidate, 1);
        break;
    }
  }

  return null;
}

/**
 * Human-readable schedule summary.
 */
export function formatScheduleSummary(rule: RecurringTask): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const intervalStr = rule.interval > 1 ? `${rule.interval} ` : "";

  switch (rule.frequency) {
    case "daily":
      return rule.interval === 1 ? "Every day" : `Every ${rule.interval} days`;

    case "weekly": {
      const freqStr =
        rule.interval === 1
          ? "Every week"
          : `Every ${rule.interval} weeks`;
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        const days = rule.days_of_week
          .sort((a, b) => a - b)
          .map((d) => dayNames[d])
          .join(", ");
        return `${freqStr} on ${days}`;
      }
      return freqStr;
    }

    case "monthly": {
      const freqStr =
        rule.interval === 1
          ? "Every month"
          : `Every ${rule.interval} months`;
      const day = rule.day_of_month ?? getDate(parseISO(rule.start_date));
      return `${freqStr} on the ${ordinal(day)}`;
    }

    case "yearly": {
      const freqStr =
        rule.interval === 1
          ? "Every year"
          : `Every ${rule.interval} years`;
      const startDate = parseISO(rule.start_date);
      return `${freqStr} on ${format(startDate, "MMM d")}`;
    }

    default:
      return `Every ${intervalStr}${rule.frequency}`;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function hasReachedMaxOccurrences(
  rule: RecurringTask,
  count: number
): boolean {
  if (rule.max_occurrences == null) return false;
  return count >= rule.max_occurrences;
}

export function isPastEndDate(rule: RecurringTask, today: Date): boolean {
  if (!rule.end_date) return false;
  return isAfter(startOfDay(today), startOfDay(parseISO(rule.end_date)));
}
