import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SmsTemplatesPageComponent } from './sms-templates-page.component';
import { MessageTemplate } from '../../../system-config/models/message-template.model';

const MOCK_SMS: MessageTemplate = {
  id: 'sms-uuid-1',
  name: 'OTP Verification',
  type: 'SMS',
  purpose: 'OTP_VERIFICATION',
  body: 'Your verification code is 123456.',
  active: true,
  defaultTemplate: false,
};

function makeComponent() {
  const mockService = {
    getTemplates: vi.fn(() => of([MOCK_SMS])),
    createTemplate: vi.fn(() => of(MOCK_SMS)),
    updateTemplate: vi.fn(() => of(MOCK_SMS)),
    deleteTemplate: vi.fn(() => of(null)),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new SmsTemplatesPageComponent(new FormBuilder(), mockService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockService };
}

describe('SmsTemplatesPageComponent', () => {
  let component: SmsTemplatesPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getTemplates("SMS") on init', () => {
    expect(mockService.getTemplates).toHaveBeenCalledWith('SMS');
  });

  it('populates templates list after load', () => {
    expect(component.templates).toHaveLength(1);
    expect(component.templates[0].name).toBe('OTP Verification');
  });

  it('auto-selects first template on load', () => {
    expect(component.selectedTemplate).toBe(MOCK_SMS);
  });

  it('does not replace a user selection on reload', () => {
    const other = { ...MOCK_SMS, id: 'sms-uuid-2', name: 'Other' };
    component.selectedTemplate = other;
    component.load();
    expect(component.selectedTemplate).toBe(other);
  });

  it('sets loading=false on load failure', () => {
    mockService.getTemplates.mockReturnValue(throwError(() => new Error('fail')));
    component.load();
    expect(component.loading).toBe(false);
  });

  it('purposeOptions contains SMS purposes', () => {
    expect(component.purposeOptions.some(o => o.value === 'OTP_VERIFICATION')).toBe(true);
  });

  it('has edit and delete rowActions', () => {
    expect(component.rowActions.find(a => a.id === 'edit')).toBeTruthy();
    expect(component.rowActions.find(a => a.id === 'delete')).toBeTruthy();
  });

  it('onRowClick sets selectedTemplate', () => {
    component.selectedTemplate = null;
    component.onRowClick(MOCK_SMS);
    expect(component.selectedTemplate).toBe(MOCK_SMS);
  });

  it('openCreate sets showModal=true and clears editingId', () => {
    component.editingId = 'x';
    component.openCreate();
    expect(component.showModal).toBe(true);
    expect(component.editingId).toBeNull();
  });

  it('openEdit sets editingId, patches form including purpose', () => {
    component.openEdit(MOCK_SMS);
    expect(component.editingId).toBe('sms-uuid-1');
    expect(component.form.get('name')?.value).toBe('OTP Verification');
    expect(component.form.get('purpose')?.value).toBe('OTP_VERIFICATION');
  });

  it('openEdit does nothing when called with null', () => {
    component.showModal = false;
    component.openEdit(null);
    expect(component.showModal).toBe(false);
  });

  it('close sets showModal=false', () => {
    component.showModal = true;
    component.close();
    expect(component.showModal).toBe(false);
  });

  it('save does NOT call service when form is invalid', () => {
    component.form.reset();
    component.save();
    expect(mockService.createTemplate).not.toHaveBeenCalled();
  });

  it('save calls createTemplate with type SMS', () => {
    component.form.patchValue({ name: 'New SMS', body: 'Hello' });
    component.editingId = null;
    component.save();
    expect(mockService.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SMS', name: 'New SMS' })
    );
  });

  it('save calls updateTemplate when editingId is set', () => {
    component.form.patchValue({ name: 'Updated', body: 'body' });
    component.editingId = 'sms-uuid-1';
    component.save();
    expect(mockService.updateTemplate).toHaveBeenCalledWith(
      'sms-uuid-1',
      expect.objectContaining({ type: 'SMS' })
    );
  });

  it('delete calls deleteTemplate after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.delete('sms-uuid-1');
    expect(mockService.deleteTemplate).toHaveBeenCalledWith('sms-uuid-1');
  });

  it('delete re-selects first template after reload when deleting the selected one', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.selectedTemplate = MOCK_SMS;
    component.delete('sms-uuid-1');
    expect(component.selectedTemplate).toBe(component.templates[0]);
  });

  it('delete does NOT call service when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.delete('sms-uuid-1');
    expect(mockService.deleteTemplate).not.toHaveBeenCalled();
  });
});
