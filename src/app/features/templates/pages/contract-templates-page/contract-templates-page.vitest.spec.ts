import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ContractTemplatesPageComponent } from './contract-templates-page.component';
import { MessageTemplate } from '../../../system-config/models/message-template.model';

const MOCK_CONTRACT: MessageTemplate = {
  id: 'contract-uuid-1',
  name: 'Investment Agreement',
  type: 'CONTRACT',
  purpose: 'INVESTMENT_AGREEMENT',
  subject: 'Investment Agreement',
  body: 'This agreement is between the investor and AgriVest.',
  active: true,
  defaultTemplate: true,
};

function makeComponent() {
  const mockService = {
    getTemplates: vi.fn(() => of([MOCK_CONTRACT])),
    createTemplate: vi.fn(() => of(MOCK_CONTRACT)),
    updateTemplate: vi.fn(() => of(MOCK_CONTRACT)),
    deleteTemplate: vi.fn(() => of(null)),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new ContractTemplatesPageComponent(new FormBuilder(), mockService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockService };
}

describe('ContractTemplatesPageComponent', () => {
  let component: ContractTemplatesPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getTemplates("CONTRACT") on init', () => {
    expect(mockService.getTemplates).toHaveBeenCalledWith('CONTRACT');
  });

  it('populates templates list after load', () => {
    expect(component.templates).toHaveLength(1);
    expect(component.templates[0].name).toBe('Investment Agreement');
  });

  it('auto-selects first template on load', () => {
    expect(component.selectedTemplate).toBe(MOCK_CONTRACT);
  });

  it('does not replace a user selection on reload', () => {
    const other = { ...MOCK_CONTRACT, id: 'contract-uuid-2', name: 'Other' };
    component.selectedTemplate = other;
    component.load();
    expect(component.selectedTemplate).toBe(other);
  });

  it('sets loading=false on load failure', () => {
    mockService.getTemplates.mockReturnValue(throwError(() => new Error('fail')));
    component.load();
    expect(component.loading).toBe(false);
  });

  it('purposeOptions contains CONTRACT purposes', () => {
    expect(component.purposeOptions.some(o => o.value === 'INVESTMENT_AGREEMENT')).toBe(true);
    expect(component.purposeOptions.some(o => o.value === 'LEASE_RENEWAL')).toBe(true);
  });

  it('has edit and delete rowActions', () => {
    expect(component.rowActions.find(a => a.id === 'edit')).toBeTruthy();
    expect(component.rowActions.find(a => a.id === 'delete')).toBeTruthy();
  });

  it('onRowClick sets selectedTemplate', () => {
    component.selectedTemplate = null;
    component.onRowClick(MOCK_CONTRACT);
    expect(component.selectedTemplate).toBe(MOCK_CONTRACT);
  });

  it('openCreate sets showModal=true and clears editingId', () => {
    component.editingId = 'x';
    component.openCreate();
    expect(component.showModal).toBe(true);
    expect(component.editingId).toBeNull();
  });

  it('openEdit sets editingId, patches form including purpose', () => {
    component.openEdit(MOCK_CONTRACT);
    expect(component.editingId).toBe('contract-uuid-1');
    expect(component.form.get('name')?.value).toBe('Investment Agreement');
    expect(component.form.get('purpose')?.value).toBe('INVESTMENT_AGREEMENT');
    expect(component.form.get('subject')?.value).toBe('Investment Agreement');
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

  it('save calls createTemplate with type CONTRACT', () => {
    component.form.patchValue({ name: 'New Contract', body: 'body text' });
    component.editingId = null;
    component.save();
    expect(mockService.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CONTRACT', name: 'New Contract' })
    );
  });

  it('save calls updateTemplate when editingId is set', () => {
    component.form.patchValue({ name: 'Updated', body: 'body' });
    component.editingId = 'contract-uuid-1';
    component.save();
    expect(mockService.updateTemplate).toHaveBeenCalledWith(
      'contract-uuid-1',
      expect.objectContaining({ type: 'CONTRACT' })
    );
  });

  it('delete calls deleteTemplate after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.delete('contract-uuid-1');
    expect(mockService.deleteTemplate).toHaveBeenCalledWith('contract-uuid-1');
  });

  it('delete re-selects first template after reload when deleting the selected one', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.selectedTemplate = MOCK_CONTRACT;
    component.delete('contract-uuid-1');
    expect(component.selectedTemplate).toBe(component.templates[0]);
  });

  it('delete does NOT call service when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.delete('contract-uuid-1');
    expect(mockService.deleteTemplate).not.toHaveBeenCalled();
  });
});
