import { FarmFollowUp, FollowUpTaskStatus } from '../models/farm-followup.model';
import { daysUntil } from './follow-up-deadline.util';

export type DeadlineTone = 'overdue' | 'soon' | 'normal';

export interface DeadlineChip {
  label: string;
  tone: DeadlineTone;
}

// Full class strings (not concatenated) so Tailwind's scanner picks them up. `light` is for
// surfaces that are always white (the detail popup's card); `dark` adds the dark-mode variants.
const STATUS_CLASSES: Record<FollowUpTaskStatus, { light: string; dark: string }> = {
  ACTIVE: {
    light: 'bg-green-100 text-green-700 border-green-200',
    dark: 'dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  },
  DONE: {
    light: 'bg-blue-100 text-blue-700 border-blue-200',
    dark: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  },
  EXCLUDED: {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
  REJECTED: {
    light: 'bg-red-100 text-red-700 border-red-200',
    dark: 'dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
};

const DEADLINE_CLASSES: Record<DeadlineTone, { light: string; dark: string }> = {
  overdue: {
    light: 'bg-red-50 text-red-700 border-red-200',
    dark: 'dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
  soon: {
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  normal: {
    light: 'bg-slate-50 text-slate-600 border-slate-200',
    dark: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
};

function join(entry: { light: string; dark: string }, dark: boolean): string {
  return dark ? `${entry.light} ${entry.dark}` : entry.light;
}

export function statusClass(status: FollowUpTaskStatus | null | undefined, dark = true): string {
  return join(STATUS_CLASSES[status ?? 'ACTIVE'] ?? STATUS_CLASSES.ACTIVE, dark);
}

export function deadlineClass(chip: DeadlineChip, dark = true): string {
  return join(DEADLINE_CLASSES[chip.tone], dark);
}

/** "n days left" style chip for an ACTIVE follow-up with an end date; null otherwise. */
export function deadlineChip(f: Pick<FarmFollowUp, 'taskStatus' | 'endDate'>, now: Date = new Date()): DeadlineChip | null {
  if (f.taskStatus !== 'ACTIVE' || !f.endDate) return null;
  const days = daysUntil(f.endDate, now);
  if (days === null) return null;
  if (days < 0) return { label: 'Overdue', tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'soon' };
  if (days === 1) return { label: '1 day left', tone: 'soon' };
  return { label: `${days} days left`, tone: 'normal' };
}

/** dd-MM-yyyy; date-only values are not shifted by the timezone. */
export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return `${dateOnly[3]}-${dateOnly[2]}-${dateOnly[1]}`;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}
