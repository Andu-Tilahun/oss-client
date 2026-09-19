import { describe, it, expect } from 'vitest';
import { deadlineChip, deadlineClass, formatDate, statusClass } from './follow-up-display.util';

const NOW = new Date(2026, 8, 19, 15, 0);

describe('follow-up display helpers', () => {
  it('formats dates as dd-MM-yyyy without shifting date-only values', () => {
    expect(formatDate('2026-09-30')).toBe('30-09-2026');
    expect(formatDate('2026-01-02')).toBe('02-01-2026');
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not a date')).toBe('-');
  });

  it('builds the deadline chip for active follow-ups only', () => {
    const chip = (endDate: string, taskStatus: 'ACTIVE' | 'DONE' = 'ACTIVE') => deadlineChip({ endDate, taskStatus }, NOW);
    expect(chip('2026-09-18')).toEqual({ label: 'Overdue', tone: 'overdue' });
    expect(chip('2026-09-19')).toEqual({ label: 'Due today', tone: 'soon' });
    expect(chip('2026-09-20')).toEqual({ label: '1 day left', tone: 'soon' });
    expect(chip('2026-09-29')).toEqual({ label: '10 days left', tone: 'normal' });
    expect(chip('2026-09-29', 'DONE')).toBeNull();
    expect(deadlineChip({ endDate: null, taskStatus: 'ACTIVE' }, NOW)).toBeNull();
  });

  it('has a colour per status, with dark variants only on request', () => {
    expect(statusClass('REJECTED')).toContain('bg-red-100');
    expect(statusClass('REJECTED')).toContain('dark:');
    expect(statusClass('REJECTED', false)).not.toContain('dark:');
    expect(statusClass('DONE', false)).toContain('bg-blue-100');
    expect(statusClass(undefined, false)).toContain('bg-green-100');
    expect(deadlineClass({ label: 'x', tone: 'overdue' }, false)).toContain('bg-red-50');
  });
});
