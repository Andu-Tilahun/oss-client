import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FarmFollowUpViewModalComponent } from './farm-followup-view-modal.component';
import { FarmFollowUpService } from '../../services/farm-followup.service';
import { AuthService } from '../../../auth/services/auth.service';
import { FileUploadService } from '../../../../shared/file-upload/file-upload.service';
import { ToastService } from '../../../../shared/toast/toast.service';

describe('FarmFollowUpViewModalComponent', () => {
  function open(canAct: boolean) {
    TestBed.configureTestingModule({
      imports: [FarmFollowUpViewModalComponent],
      providers: [
        { provide: FarmFollowUpService, useValue: { getReports: () => of([]), addReport: vi.fn() } },
        { provide: AuthService, useValue: { isExtensionWorker: () => false } },
        { provide: FileUploadService, useValue: { getFileMetadata: vi.fn(), getFileUrl: vi.fn(), getStreamUrl: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(FarmFollowUpViewModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('canAct', canAct);
    fixture.componentRef.setInput('followUp', {
      id: 'f1', externalId: 'p1', referenceNumber: 'FLW-1', remark: 'r', attachment: '', taskStatus: 'ACTIVE',
      startDate: '2026-09-01', endDate: '2026-12-01',
    });
    fixture.detectChanges();
    const buttons = () => Array.from((document.body as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
    return { fixture, buttons };
  }

  it('forwards a Mark Done request from the detail view', () => {
    const { fixture, buttons } = open(true);
    const emitted: string[] = [];
    fixture.componentInstance.outcomeRequested.subscribe(a => emitted.push(a));

    buttons().find(b => b.textContent?.trim() === 'Mark Done')!.click();

    expect(emitted).toEqual(['DONE']);
  });

  it('does not offer the outcome buttons when the user may not act', () => {
    const { buttons } = open(false);

    expect(buttons().some(b => b.textContent?.trim() === 'Mark Done')).toBe(false);
  });
});
