import { describe, it, expect, vi, afterEach } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FarmFollowUpListComponent } from './farm-followup-list.component';
import { FarmFollowUp } from '../../models/farm-followup.model';
import { FarmFollowUpService } from '../../services/farm-followup.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { TabsComponent } from '../../../../shared/tabs/app-tabs/app-tabs.component';
import { ActionIconButtonComponent } from '../../../../shared/components/action-icons/action-icon-button/action-icon-button.component';

function followUp(overrides: Partial<FarmFollowUp> = {}): FarmFollowUp {
  return {
    id: 'f1',
    externalId: 'pkg-1',
    referenceNumber: 'FLW-1',
    remark: 'Check the soil moisture',
    attachment: '',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    createdBy: 'worker-1',
    taskStatus: 'ACTIVE',
    ...overrides,
  };
}

interface Role { admin?: boolean; worker?: boolean; userId?: string }

function render(items: FarmFollowUp[], role: Role = { admin: true }, readOnly = false) {
  const auth = {
    isAdmin: () => !!role.admin,
    isExtensionWorker: () => !!role.worker,
    getCurrentUser: () => ({ id: role.userId ?? 'someone' }),
  };
  TestBed.configureTestingModule({
    declarations: [FarmFollowUpListComponent],
    imports: [CommonModule, PageHeaderComponent, TabsComponent, ActionIconButtonComponent],
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } },
      { provide: FarmFollowUpService, useValue: { getByExternalId: vi.fn(() => of(items)) } },
    ],
    // The create / view / outcome modals are not under test here.
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(FarmFollowUpListComponent);
  fixture.componentRef.setInput('followUps', items);
  fixture.componentRef.setInput('externalId', 'pkg-1');
  fixture.componentRef.setInput('readOnly', readOnly);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    component: fixture.componentInstance,
    el,
    cards: () => Array.from(el.querySelectorAll<HTMLElement>('article[role="button"]')),
  };
}

const button = (root: ParentNode, label: string) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.trim() === label);

describe('FarmFollowUpListComponent cards', () => {
  afterEach(() => vi.useRealTimers());

  it('shows one card per active follow-up with its reference, remark, dates and status', () => {
    const { cards } = render([
      followUp(),
      followUp({ id: 'f2', referenceNumber: 'FLW-2', taskStatus: 'DONE' }),
    ]);

    expect(cards()).toHaveLength(1);
    const text = cards()[0].textContent!;
    expect(text).toContain('FLW-1');
    expect(text).toContain('Check the soil moisture');
    expect(text).toContain('01-09-2026');
    expect(text).toContain('30-09-2026');
    expect(text).toContain('ACTIVE');
  });

  it('lists done, excluded and rejected follow-ups on the Completed sub-tab with outcome and who completed them', () => {
    const { component, fixture, cards } = render([
      followUp(),
      followUp({ id: 'f2', referenceNumber: 'FLW-2', taskStatus: 'DONE', outcomeReason: 'All good', completedBy: 'u1', completedByUser: { firstName: 'Abel', lastName: 'Kebede' } as any, completedAt: '2026-09-10T10:00:00Z' }),
      followUp({ id: 'f3', referenceNumber: 'FLW-3', taskStatus: 'REJECTED', outcomeReason: 'No response', completedBy: null }),
    ]);

    component.activeSubTab = 'completed';
    fixture.detectChanges();

    expect(cards().map(c => c.querySelector('h4')!.textContent!.trim())).toEqual(['FLW-2', 'FLW-3']);
    expect(cards()[0].textContent).toContain('All good');
    expect(cards()[0].textContent).toContain('Completed by Abel Kebede');
    expect(cards()[1].textContent).toContain('REJECTED');
    expect(cards()[1].textContent).toContain('Completed by System');
  });

  it('says so when a sub-tab has nothing to show', () => {
    const { component, fixture, el } = render([]);
    expect(el.textContent).toContain('No active follow-up tasks.');

    component.activeSubTab = 'completed';
    fixture.detectChanges();
    expect(el.textContent).toContain('No completed follow-up tasks yet.');
  });

  it('opens the follow-up when the card is clicked or Enter is pressed', () => {
    const { component, fixture, cards } = render([followUp()]);

    cards()[0].click();
    fixture.detectChanges();
    expect(component.showViewModal).toBe(true);
    expect(component.selectedFollowUp?.id).toBe('f1');

    component.showViewModal = false;
    component.selectedFollowUp = null;
    cards()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.selectedFollowUp?.id).toBe('f1');
  });

  it('starts the outcome flow from Mark Done without also opening the follow-up', () => {
    const { component, fixture, cards } = render([followUp()]);

    button(cards()[0], 'Mark Done')!.click();
    fixture.detectChanges();

    expect(component.showOutcomeModal).toBe(true);
    expect(component.outcomeAction).toBe('DONE');
    expect(component.showViewModal).toBe(false);

    button(cards()[0], 'Mark Excluded')!.click();
    expect(component.outcomeAction).toBe('EXCLUDED');
    expect(component.showViewModal).toBe(false);
  });

  describe('who can act', () => {
    it('admin sees the outcome buttons', () => {
      expect(button(render([followUp()], { admin: true }).cards()[0], 'Mark Done')).toBeDefined();
    });

    it('the worker who created the follow-up sees them, another worker does not', () => {
      expect(button(render([followUp()], { worker: true, userId: 'worker-1' }).cards()[0], 'Mark Done')).toBeDefined();
      TestBed.resetTestingModule();
      expect(button(render([followUp()], { worker: true, userId: 'worker-2' }).cards()[0], 'Mark Done')).toBeUndefined();
    });

    it('nobody sees them in read-only mode or as an investor', () => {
      expect(button(render([followUp()], { admin: true }, true).cards()[0], 'Mark Done')).toBeUndefined();
      TestBed.resetTestingModule();
      expect(button(render([followUp()], {}).cards()[0], 'Mark Done')).toBeUndefined();
    });

    it('completed cards never offer the outcome buttons', () => {
      const { component, fixture, cards } = render([followUp({ taskStatus: 'DONE' })]);
      component.activeSubTab = 'completed';
      fixture.detectChanges();
      expect(button(cards()[0], 'Mark Done')).toBeUndefined();
    });

    it('only an extension worker who is not read-only gets the Add button', () => {
      expect(render([], { worker: true, userId: 'w' }).el.querySelector('app-action-icon-button')).not.toBeNull();
      TestBed.resetTestingModule();
      expect(render([], { admin: true }).el.querySelector('app-action-icon-button')).toBeNull();
      TestBed.resetTestingModule();
      expect(render([], { worker: true }, true).el.querySelector('app-action-icon-button')).toBeNull();
    });
  });

  describe('detail popup', () => {
    it('lets whoever may act use Mark Done / Excluded from inside the popup', () => {
      const { component, cards, fixture } = render([followUp()]);
      cards()[0].click();
      fixture.detectChanges();
      expect(component.showViewModal).toBe(true);

      component.onOutcomeFromDetail('EXCLUDED');

      expect(component.showViewModal).toBe(false);
      expect(component.showOutcomeModal).toBe(true);
      expect(component.outcomeAction).toBe('EXCLUDED');
      expect(component.outcomeTarget?.id).toBe('f1');
    });

    it('ignores the request for read-only viewers and for a worker who did not create it', () => {
      const readOnly = render([followUp()], { admin: true }, true);
      readOnly.component.selectedFollowUp = followUp();
      readOnly.component.onOutcomeFromDetail('DONE');
      expect(readOnly.component.showOutcomeModal).toBe(false);

      TestBed.resetTestingModule();
      const other = render([followUp()], { worker: true, userId: 'worker-2' });
      other.component.selectedFollowUp = followUp();
      other.component.onOutcomeFromDetail('DONE');
      expect(other.component.showOutcomeModal).toBe(false);
    });
  });

  describe('deadline chip', () => {
    const now = new Date(2026, 8, 19, 15, 30); // 19 Sep 2026, mid-afternoon
    const chip = (endDate: string | null, status: FarmFollowUp['taskStatus'] = 'ACTIVE') => {
      const { component } = render([]);
      return component.deadlineChip(followUp({ endDate, taskStatus: status }), now);
    };

    it('marks past end dates overdue', () => {
      expect(chip('2026-09-18')).toEqual({ label: 'Overdue', tone: 'overdue' });
    });

    it('marks today and tomorrow as soon', () => {
      TestBed.resetTestingModule();
      expect(chip('2026-09-19')).toEqual({ label: 'Due today', tone: 'soon' });
      TestBed.resetTestingModule();
      expect(chip('2026-09-20')).toEqual({ label: '1 day left', tone: 'soon' });
    });

    it('counts the days left further out', () => {
      expect(chip('2026-09-29')).toEqual({ label: '10 days left', tone: 'normal' });
    });

    it('has no chip without an end date or once the follow-up is finished', () => {
      TestBed.resetTestingModule();
      expect(chip(null)).toBeNull();
      TestBed.resetTestingModule();
      expect(chip('2026-09-25', 'DONE')).toBeNull();
    });
  });
});
