import { describe, it, expect, vi, afterEach } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FarmFollowUpViewComponent } from './farm-followup-view.component';
import { FarmFollowUp } from '../../models/farm-followup.model';
import { FarmFollowUpService } from '../../services/farm-followup.service';
import { AuthService } from '../../../auth/services/auth.service';
import { FileUploadService } from '../../../../shared/file-upload/file-upload.service';
import { ToastService } from '../../../../shared/toast/toast.service';

const NOW = new Date(2026, 8, 19, 12, 0); // 19 Sep 2026

function ymd(daysFromNow: number): string {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function followUp(overrides: Partial<FarmFollowUp> = {}): FarmFollowUp {
  return {
    id: 'f1',
    externalId: 'pkg-1',
    referenceNumber: 'FLW-1',
    remark: 'Check soil',
    attachment: '',
    startDate: ymd(-5),
    endDate: ymd(5),
    taskStatus: 'ACTIVE',
    ...overrides,
  };
}

function render(item: FarmFollowUp, { worker = true, readOnly = false, canAct = false } = {}) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  const service = {
    getReports: vi.fn(() => of([])),
    addReport: vi.fn(() => of({})),
  };
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  TestBed.configureTestingModule({
    imports: [FarmFollowUpViewComponent],
    providers: [
      { provide: FarmFollowUpService, useValue: service },
      { provide: AuthService, useValue: { isExtensionWorker: () => worker } },
      { provide: FileUploadService, useValue: { getFileMetadata: vi.fn(), getFileUrl: vi.fn(), getStreamUrl: vi.fn() } },
      { provide: ToastService, useValue: toast },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(FarmFollowUpViewComponent);
  const setFollowUp = (value: FarmFollowUp) => {
    fixture.componentRef.setInput('followUp', value);
    fixture.detectChanges();
  };
  fixture.componentRef.setInput('readOnly', readOnly);
  fixture.componentRef.setInput('canAct', canAct);
  setFollowUp(item);
  const el = fixture.nativeElement as HTMLElement;
  const addButton = () => Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Add Report'));
  return { fixture, component: fixture.componentInstance, el, service, toast, addButton, setFollowUp };
}

describe('FarmFollowUpViewComponent adding reports', () => {
  afterEach(() => vi.useRealTimers());

  it('offers Add Report to an extension worker on an active follow-up', () => {
    const { addButton, el } = render(followUp());

    expect(addButton()).toBeDefined();
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  it('still offers it on the day the follow-up ends', () => {
    expect(render(followUp({ endDate: ymd(0) })).addButton()).toBeDefined();
  });

  it.each(['DONE', 'EXCLUDED', 'REJECTED'] as const)('hides Add Report and says why for a %s follow-up', (status) => {
    const { addButton, el } = render(followUp({ taskStatus: status }));

    expect(addButton()).toBeUndefined();
    expect(el.querySelector('[role="status"]')!.textContent).toContain(`is ${status.toLowerCase()}`);
  });

  it('hides Add Report for an active follow-up whose deadline has passed', () => {
    const { addButton, el } = render(followUp({ endDate: ymd(-1) }));

    expect(addButton()).toBeUndefined();
    expect(el.querySelector('[role="status"]')!.textContent).toContain('deadline');
  });

  it('shows neither the button nor the note to read-only viewers or non-workers', () => {
    for (const options of [{ readOnly: true }, { worker: false }]) {
      TestBed.resetTestingModule();
      const { addButton, el } = render(followUp({ taskStatus: 'REJECTED' }), options);
      expect(addButton()).toBeUndefined();
      expect(el.querySelector('[role="status"]')).toBeNull();
    }
  });

  it('does not call the API when a report is submitted on a follow-up that is no longer reportable', () => {
    const { component, service, toast } = render(followUp({ taskStatus: 'REJECTED' }));
    component.reportContent = 'late report';

    component.onAddReport();

    expect(service.addReport).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalled();
  });

  it('still submits for an active follow-up', () => {
    const { component, service } = render(followUp());
    component.reportContent = 'on time';

    component.onAddReport();

    expect(service.addReport).toHaveBeenCalledWith('f1', { content: 'on time', fileUuids: [] });
  });

  it('closes an open report form when the follow-up turns rejected', () => {
    const { component, addButton, fixture, setFollowUp, el } = render(followUp());
    addButton()!.click();
    component.reportContent = 'draft';
    fixture.detectChanges();
    expect(component.showAddReportForm).toBe(true);

    setFollowUp(followUp({ taskStatus: 'REJECTED' }));

    expect(component.showAddReportForm).toBe(false);
    expect(component.reportContent).toBe('');
    expect(el.querySelector('textarea')).toBeNull();
  });
});

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const rowWith = (el: HTMLElement, label: string) =>
  Array.from(el.querySelectorAll<HTMLElement>('p')).find(p => text(p) === label)!.parentElement!;
const buttonNamed = (el: HTMLElement, label: string) =>
  Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(b => text(b).startsWith(label));

describe('FarmFollowUpViewComponent layout', () => {
  afterEach(() => vi.useRealTimers());

  it('gives Reference No., Remark and Outcome Reason a full row each', () => {
    const { el } = render(followUp({ taskStatus: 'DONE', outcomeReason: 'All good' }));

    for (const label of ['Reference No.', 'Remark', 'Outcome Reason']) {
      expect(rowWith(el, label).className).toContain('col-span-full');
    }
  });

  it('puts Status, Start Date and End Date side by side in one row', () => {
    const { el } = render(followUp());

    const row = rowWith(el, 'Status').parentElement!;
    expect(row.className).toContain('grid-cols-3');
    expect(Array.from(row.children).map(c => text(c.querySelector('p')))).toEqual(['Status', 'Start Date', 'End Date']);
    expect(row.className).toContain('col-span-full');
  });

  it('shows dates as dd-MM-yyyy and the status as a coloured pill', () => {
    const { el } = render(followUp({ startDate: '2026-09-14', endDate: '2026-09-30', taskStatus: 'REJECTED' }));

    const row = rowWith(el, 'Status').parentElement!;
    expect(text(row)).toContain('14-09-2026');
    expect(text(row)).toContain('30-09-2026');
    const pill = row.querySelector('span')!;
    expect(text(pill)).toBe('REJECTED');
    expect(pill.className).toContain('bg-red-100');
    expect(pill.className).not.toContain('dark:');
  });

  it('shows a deadline chip for active follow-ups only', () => {
    expect(text(rowWith(render(followUp({ endDate: ymd(3) })).el, 'End Date'))).toContain('3 days left');
    TestBed.resetTestingModule();
    expect(text(rowWith(render(followUp({ endDate: ymd(-1) })).el, 'End Date'))).toContain('Overdue');
    TestBed.resetTestingModule();
    expect(text(rowWith(render(followUp({ taskStatus: 'DONE', endDate: ymd(3) })).el, 'End Date'))).not.toContain('days left');
  });

  it('shows the outcome reason only once the follow-up is closed, with who completed it', () => {
    const active = render(followUp()).el;
    expect(text(active)).not.toContain('Outcome Reason');
    TestBed.resetTestingModule();

    const closed = render(followUp({ taskStatus: 'REJECTED', outcomeReason: 'No response', completedBy: null, completedAt: '2026-09-10' })).el;
    expect(text(rowWith(closed, 'Outcome Reason'))).toContain('No response');
    expect(text(rowWith(closed, 'Outcome Reason'))).toContain('Completed by System · 10-09-2026');
  });
});

describe('FarmFollowUpViewComponent interactions', () => {
  afterEach(() => vi.useRealTimers());

  it('copies the reference number and briefly says Copied', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { el, fixture, component } = render(followUp({ referenceNumber: 'FLW-99' }));
    vi.useFakeTimers();

    buttonNamed(el, 'Copy')!.click();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('FLW-99');
    expect(text(rowWith(el, 'Reference No.'))).toContain('Copied');

    vi.advanceTimersByTime(2100);
    fixture.detectChanges();
    expect(component.copied).toBe(false);
    expect(text(rowWith(el, 'Reference No.'))).toContain('Copy');
  });

  it('clamps a long remark behind Show more / Show less', () => {
    const { el, fixture } = render(followUp({ remark: 'x'.repeat(300) }));
    const remark = () => rowWith(el, 'Remark').querySelectorAll('p')[1];

    expect(remark().className).toContain('line-clamp-4');
    buttonNamed(el, 'Show more')!.click();
    fixture.detectChanges();
    expect(remark().className).not.toContain('line-clamp-4');
    expect(buttonNamed(el, 'Show less')).toBeDefined();

    buttonNamed(el, 'Show less')!.click();
    fixture.detectChanges();
    expect(remark().className).toContain('line-clamp-4');
  });

  it('clamps a remark with many line breaks and leaves short text alone', () => {
    expect(render(followUp({ remark: 'a\nb\nc\nd\ne' })).component.isLongText('a\nb\nc\nd\ne')).toBe(true);
    TestBed.resetTestingModule();
    const { el } = render(followUp({ remark: 'short' }));
    expect(buttonNamed(el, 'Show more')).toBeUndefined();
  });

  it('collapses and re-opens a section, and shows the reports count', () => {
    const { el, fixture, component } = render(followUp());
    component.reports = [{ id: 'r1', content: 'one' }, { id: 'r2', content: 'two' }] as any;
    fixture.detectChanges();
    expect(text(buttonNamed(el, 'Reports'))).toContain('2');

    const header = buttonNamed(el, 'Follow-up')!;
    expect(header.getAttribute('aria-expanded')).toBe('true');
    header.click();
    fixture.detectChanges();
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(text(el)).not.toContain('Reference No.');

    header.click();
    fixture.detectChanges();
    expect(text(el)).toContain('Reference No.');
  });

  it('opens sections by default: details and reports open, audit closed, attachment only when present', () => {
    const noFile = render(followUp()).component;
    expect(noFile.openSections).toEqual({ details: true, attachment: false, reports: true, audit: false });
    TestBed.resetTestingModule();
    expect(render(followUp({ attachment: 'file-1' })).component.openSections.attachment).toBe(true);
  });

  it('resets sections and expanded text when a different follow-up is shown', () => {
    const { component, setFollowUp } = render(followUp({ remark: 'x'.repeat(300) }));
    component.toggleText('remark');
    component.toggleSection('audit');

    setFollowUp(followUp({ id: 'f2' }));

    expect(component.expandedText).toEqual({});
    expect(component.openSections.audit).toBe(false);
  });

  it('Add report quick action opens the reports section and the form', () => {
    const { el, fixture, component } = render(followUp());
    component.toggleSection('reports');
    fixture.detectChanges();

    buttonNamed(el, 'Add report')!.click();
    fixture.detectChanges();

    expect(component.isOpen('reports')).toBe(true);
    expect(component.showAddReportForm).toBe(true);
    expect(el.querySelector('[data-add-report-form]')).not.toBeNull();
  });

  it('offers Mark Done / Mark Excluded only when allowed, and emits the choice', () => {
    const allowed = render(followUp(), { canAct: true });
    const emitted: string[] = [];
    allowed.component.outcomeRequested.subscribe(a => emitted.push(a));

    buttonNamed(allowed.el, 'Mark Done')!.click();
    buttonNamed(allowed.el, 'Mark Excluded')!.click();
    expect(emitted).toEqual(['DONE', 'EXCLUDED']);

    for (const [item, options] of [
      [followUp(), { canAct: false }],
      [followUp({ taskStatus: 'DONE' }), { canAct: true }],
    ] as const) {
      TestBed.resetTestingModule();
      expect(buttonNamed(render(item, options).el, 'Mark Done')).toBeUndefined();
    }
  });

  it('requestOutcome does nothing when the user may not act', () => {
    const { component } = render(followUp(), { canAct: false });
    const emitted: string[] = [];
    component.outcomeRequested.subscribe(a => emitted.push(a));

    component.requestOutcome('DONE');

    expect(emitted).toEqual([]);
  });
});
