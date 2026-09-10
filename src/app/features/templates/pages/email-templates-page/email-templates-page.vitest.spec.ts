import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EmailTemplatesPageComponent } from './email-templates-page.component';
import { MessageTemplate } from '../../../system-config/models/message-template.model';

const MOCK_TEMPLATE: MessageTemplate = {
  id: 'uuid-1',
  name: 'User Invitation Email',
  type: 'EMAIL',
  purpose: 'USER_INVITATION',
  subject: 'Welcome!',
  variables: '["firstName","accessUrl"]',
  body: '<p>Hello</p>',
  active: true,
  defaultTemplate: true,
};

const MOCK_ORG = { name: 'AgriVest', logoUuid: 'logo-uuid-1', email: 'info@agrivest.com' };

function makeComponent() {
  const mockService = {
    getTemplates: vi.fn(() => of([MOCK_TEMPLATE])),
    getOrganizationConfig: vi.fn(() => of(MOCK_ORG)),
    createTemplate: vi.fn(() => of(MOCK_TEMPLATE)),
    updateTemplate: vi.fn(() => of(MOCK_TEMPLATE)),
    deleteTemplate: vi.fn(() => of(null)),
  };
  const mockSanitizer = {
    bypassSecurityTrustHtml: vi.fn((html: string) => html as any),
  };
  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
  };
  const component = new EmailTemplatesPageComponent(
    new FormBuilder(),
    mockService as any,
    mockSanitizer as any,
    mockToastService as any,
  );
  component.ngOnInit();
  return { component, mockService, mockSanitizer };
}

describe('EmailTemplatesPageComponent', () => {
  let component: EmailTemplatesPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getTemplates("EMAIL") on init', () => {
    expect(mockService.getTemplates).toHaveBeenCalledWith('EMAIL');
  });

  it('calls getOrganizationConfig on init', () => {
    expect(mockService.getOrganizationConfig).toHaveBeenCalled();
  });

  it('stores orgConfig after init', () => {
    expect(component.orgConfig).toEqual(MOCK_ORG);
  });

  it('populates templates list after load', () => {
    expect(component.templates).toHaveLength(1);
    expect(component.templates[0].name).toBe('User Invitation Email');
  });

  it('auto-selects first template on load', () => {
    expect(component.selectedTemplate).toBe(MOCK_TEMPLATE);
  });

  it('does not replace a user selection on reload', () => {
    const other = { ...MOCK_TEMPLATE, id: 'uuid-2', name: 'Other' };
    component.selectedTemplate = other;
    component.load();
    expect(component.selectedTemplate).toBe(other);
  });

  it('sets loading to false after successful load', () => {
    expect(component.loading).toBe(false);
  });

  it('sets loading=false on load failure', () => {
    mockService.getTemplates.mockReturnValue(throwError(() => new Error('fail')));
    component.load();
    expect(component.loading).toBe(false);
  });

  it('purposeOptions contains EMAIL purposes', () => {
    expect(component.purposeOptions.some(o => o.value === 'USER_INVITATION')).toBe(true);
    expect(component.purposeOptions.some(o => o.value === 'PASSWORD_RESET')).toBe(true);
  });

  it('has edit and delete rowActions', () => {
    expect(component.rowActions.find(a => a.id === 'edit')).toBeTruthy();
    expect(component.rowActions.find(a => a.id === 'delete')).toBeTruthy();
  });

  it('onRowClick sets selectedTemplate', () => {
    component.selectedTemplate = null;
    component.onRowClick(MOCK_TEMPLATE);
    expect(component.selectedTemplate).toBe(MOCK_TEMPLATE);
  });

  it('openCreate sets showModal=true and clears editingId', () => {
    component.editingId = 'some-id';
    component.openCreate();
    expect(component.showModal).toBe(true);
    expect(component.editingId).toBeNull();
  });

  it('openCreate pre-populates body with sample HTML', () => {
    component.openCreate();
    const bodyVal: string = component.form.get('body')?.value || '';
    expect(bodyVal).toContain('{{orgName}}');
    expect(bodyVal).toContain('<!DOCTYPE html>');
  });

  it('openEdit sets editingId and patches form including purpose', () => {
    component.openEdit(MOCK_TEMPLATE);
    expect(component.editingId).toBe('uuid-1');
    expect(component.form.get('name')?.value).toBe('User Invitation Email');
    expect(component.form.get('purpose')?.value).toBe('USER_INVITATION');
    expect(component.form.get('body')?.value).toBe('<p>Hello</p>');
  });

  it('openEdit patches variables as a comma-separated list', () => {
    component.openEdit(MOCK_TEMPLATE);
    expect(component.form.get('variables')?.value).toBe('firstName, accessUrl');
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
    expect(mockService.updateTemplate).not.toHaveBeenCalled();
  });

  it('save marks all fields as touched when form is invalid', () => {
    component.form.reset();
    const spy = vi.spyOn(component.form, 'markAllAsTouched');
    component.save();
    expect(spy).toHaveBeenCalled();
  });

  it('save calls createTemplate with type EMAIL', () => {
    component.form.patchValue({ name: 'New', body: '<p>body</p>' });
    component.editingId = null;
    component.save();
    expect(mockService.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New', type: 'EMAIL' })
    );
  });

  it('save closes modal after successful create', () => {
    component.form.patchValue({ name: 'New', body: '<p>body</p>' });
    component.showModal = true;
    component.save();
    expect(component.showModal).toBe(false);
  });

  it('save calls updateTemplate when editingId is set', () => {
    component.form.patchValue({ name: 'Updated', body: '<p>body</p>' });
    component.editingId = 'uuid-1';
    component.save();
    expect(mockService.updateTemplate).toHaveBeenCalledWith(
      'uuid-1',
      expect.objectContaining({ name: 'Updated', type: 'EMAIL' })
    );
  });

  it('save round-trips the variables field back into a JSON array string', () => {
    component.openEdit(MOCK_TEMPLATE);
    component.form.patchValue({ variables: 'firstName, accessUrl, plotTitle' });
    component.save();
    expect(mockService.updateTemplate).toHaveBeenCalledWith(
      'uuid-1',
      expect.objectContaining({ variables: '["firstName","accessUrl","plotTitle"]' })
    );
  });

  it('save stores an empty array when variables is left blank', () => {
    component.form.patchValue({ name: 'New', body: '<p>body</p>', variables: '' });
    component.editingId = null;
    component.save();
    expect(mockService.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: '[]' })
    );
  });

  it('delete calls deleteTemplate after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.delete('uuid-1');
    expect(mockService.deleteTemplate).toHaveBeenCalledWith('uuid-1');
  });

  it('delete re-selects first template after reload when deleting the selected one', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.selectedTemplate = MOCK_TEMPLATE;
    component.delete('uuid-1');
    expect(component.selectedTemplate).toBe(component.templates[0]);
  });

  it('delete does NOT call service when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.delete('uuid-1');
    expect(mockService.deleteTemplate).not.toHaveBeenCalled();
  });
});
