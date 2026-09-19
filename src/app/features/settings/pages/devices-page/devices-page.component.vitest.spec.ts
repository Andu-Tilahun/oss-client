import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DevicesPageComponent } from './devices-page.component';
import { AuthService } from '../../../auth/services/auth.service';
import { UserSession } from '../../../users/models/user.model';
import { ToastService } from '../../../../shared/toast/toast.service';

const HOUR = 3600 * 1000;

function session(overrides: Partial<UserSession> = {}): UserSession {
  return {
    sessionId: 's1',
    deviceLabel: 'Chrome on Windows',
    ipAddress: '10.0.0.5',
    createdAt: new Date(Date.now() - 2 * HOUR).toISOString(),
    lastSeenAt: new Date(Date.now() - HOUR).toISOString(),
    expiresAt: new Date(Date.now() + 24 * HOUR).toISOString(),
    revoked: false,
    current: false,
    ...overrides,
  };
}

function render(sessions: UserSession[], overrides: Record<string, unknown> = {}) {
  const auth = {
    getSessions: vi.fn(() => of(sessions)),
    terminateSession: vi.fn(() => of('Session terminated')),
    forceLogout: vi.fn(),
    ...overrides,
  };
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  TestBed.configureTestingModule({
    imports: [DevicesPageComponent],
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: ToastService, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(DevicesPageComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture, auth, toast, el,
    active: () => Array.from(el.querySelectorAll<HTMLElement>('[data-testid="active-session"]')),
    recent: () => Array.from(el.querySelectorAll<HTMLElement>('[data-testid="recent-login"]')),
  };
}

describe('DevicesPageComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('splits sessions into active and recent (revoked or expired) and lists this device first', () => {
    const { active, recent, el } = render([
      session({ sessionId: 'other', deviceLabel: 'Safari on iPhone' }),
      session({ sessionId: 'me', current: true }),
      session({ sessionId: 'gone', deviceLabel: 'Firefox on Linux', revoked: true }),
      session({ sessionId: 'old', deviceLabel: 'Edge on Windows', expiresAt: new Date(Date.now() - HOUR).toISOString() }),
    ]);

    expect(active().length).toBe(2);
    expect(active()[0].textContent).toContain('This device');
    expect(active()[1].textContent).toContain('Safari on iPhone');
    expect(recent().length).toBe(2);
    expect(recent()[0].textContent).toContain('Signed out');
    expect(recent()[1].textContent).toContain('Expired');
    expect(el.textContent).toContain('10.0.0.5');
  });

  it('badges only the current session', () => {
    const { active } = render([session({ sessionId: 'a' }), session({ sessionId: 'b', current: true })]);

    const badged = active().filter((r) => r.textContent?.includes('This device'));
    expect(badged.length).toBe(1);
  });

  it('clicking End session opens the confirmation modal and ends nothing yet', () => {
    const { fixture, auth, active } = render([session({ sessionId: 'me', current: true }), session({ sessionId: 'other', deviceLabel: 'Safari on iPhone' })]);

    const otherRow = active().find((r) => r.textContent?.includes('Safari on iPhone'))!;
    otherRow.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.showConfirm).toBe(true);
    const modal = document.body.querySelector('.modal-panel');
    expect(modal?.textContent).toContain('End this session?');
    expect(modal?.textContent).toContain('Safari on iPhone');
    expect(modal?.textContent).toContain('10.0.0.5');
    expect(auth.terminateSession).not.toHaveBeenCalled();
  });

  it('confirming ends another device, toasts and reloads', () => {
    const { fixture, auth, toast } = render([session({ sessionId: 'me', current: true }), session({ sessionId: 'other' })]);
    const c = fixture.componentInstance;

    c.askToEnd(session({ sessionId: 'other' }));
    expect(c.confirmType).toBe('danger');
    c.confirmEnd();

    expect(auth.terminateSession).toHaveBeenCalledWith('other');
    expect(toast.success).toHaveBeenCalled();
    expect(auth.getSessions).toHaveBeenCalledTimes(2);
    expect(auth.forceLogout).not.toHaveBeenCalled();
    expect(c.showConfirm).toBe(false);
  });

  it('confirming the current session warns clearly and signs this browser out', () => {
    const { fixture, auth } = render([session({ sessionId: 'me', current: true })]);
    const c = fixture.componentInstance;

    c.askToEnd(session({ sessionId: 'me', current: true }));
    expect(c.confirmTitle).toBe('Sign out of this device?');
    expect(c.confirmMessage).toContain('sign you out');
    expect(c.confirmType).toBe('warning');
    c.confirmEnd();

    expect(auth.terminateSession).toHaveBeenCalledWith('me');
    expect(auth.forceLogout).toHaveBeenCalled();
    expect(auth.getSessions).toHaveBeenCalledTimes(1);
  });

  it('cancelling the modal leaves everything as it was', () => {
    const { fixture, auth } = render([session({ sessionId: 'other' })]);
    const c = fixture.componentInstance;

    c.askToEnd(session({ sessionId: 'other' }));
    c.showConfirm = false; // what the modal's Cancel / Esc / X does

    expect(auth.terminateSession).not.toHaveBeenCalled();
  });

  it('a failed request releases the modal so the user can retry', () => {
    const { fixture } = render([session({ sessionId: 'other' })], {
      terminateSession: vi.fn(() => throwError(() => new Error('nope'))),
    });
    const c = fixture.componentInstance;

    c.askToEnd(session({ sessionId: 'other' }));
    c.confirmEnd();

    expect(c.showConfirm).toBe(false);
    expect(c.terminatingId).toBeNull();
  });

  it('shows a retryable error when the sessions cannot be loaded', () => {
    const { el } = render([], { getSessions: vi.fn(() => throwError(() => new Error('boom'))) });

    expect(el.textContent).toContain("Couldn't load your sessions");
  });
});
