import { describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ProfilePageComponent } from './profile-page.component';
import { User } from '../../models/user.model';

function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    role: 'INVESTOR',
    enabled: true,
    accountNonLocked: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeComponent() {
  const mockAuthService = {
    currentUser$: of(mockUser()),
    updateCurrentUser: vi.fn(),
  };
  const mockUserService = {
    profileUser: vi.fn(() => of(mockUser({ profileImageUuid: 'new-file-id' }))),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };

  const component = new ProfilePageComponent(
    mockAuthService as any,
    mockUserService as any,
    mockToastService as any,
  );
  component.ngOnInit();

  return { component, mockAuthService, mockUserService, mockToastService };
}

describe('ProfilePageComponent onProfileImageUploaded', () => {
  it('persists the new photo immediately, without requiring a separate Save Changes click', () => {
    const { component, mockUserService, mockAuthService } = makeComponent();

    component.onProfileImageUploaded('new-file-id');

    expect(mockUserService.profileUser).toHaveBeenCalledWith(
      expect.objectContaining({ profileImageUuid: 'new-file-id', email: 'jdoe@example.com' }),
    );
    expect(mockAuthService.updateCurrentUser).toHaveBeenCalled();
  });

  it('updates the local currentUser so the preview reflects the saved photo', () => {
    const { component } = makeComponent();

    component.onProfileImageUploaded('new-file-id');

    expect(component.currentUser?.profileImageUuid).toBe('new-file-id');
  });

  it('surfaces an error toast without throwing if the save fails', () => {
    const { component, mockUserService, mockToastService } = makeComponent();
    mockUserService.profileUser.mockReturnValue(throwError(() => new Error('network down')));

    expect(() => component.onProfileImageUploaded('new-file-id')).not.toThrow();
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('does nothing when there is no current user yet', () => {
    const { component, mockUserService } = makeComponent();
    component.currentUser = null;

    component.onProfileImageUploaded('new-file-id');

    expect(mockUserService.profileUser).not.toHaveBeenCalled();
  });
});
