import { describe, it, expect, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { UserFormComponent } from './user-form.component';

function makeComponent() {
  const mockRoleService = { getRoles: vi.fn(() => of({ content: [] })) };
  const mockAuthService = { isAdmin: vi.fn(() => false) };

  const component = new UserFormComponent(
    new FormBuilder(),
    mockRoleService as any,
    mockAuthService as any,
  );
  component.ngOnInit();

  return { component };
}

describe('UserFormComponent onProfilePictureUploaded', () => {
  it('emits profileImageUploaded so an embedding parent can persist it immediately', () => {
    const { component } = makeComponent();
    const emitted: string[] = [];
    component.profileImageUploaded.subscribe((fileId) => emitted.push(fileId));

    component.onProfilePictureUploaded('new-file-id');

    expect(emitted).toEqual(['new-file-id']);
  });

  it('still patches the local form control as before', () => {
    const { component } = makeComponent();

    component.onProfilePictureUploaded('new-file-id');

    expect(component.userForm.get('profileImageUuid')?.value).toBe('new-file-id');
  });
});
