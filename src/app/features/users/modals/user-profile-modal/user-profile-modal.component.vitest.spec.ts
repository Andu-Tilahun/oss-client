import { describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { UserProfileModalComponent } from './user-profile-modal.component';
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
  const mockUserService = {
    profileUser: vi.fn(() => of(mockUser({ profileImageUuid: 'new-file-id' }))),
  };
  const mockAuthService = { updateCurrentUser: vi.fn(), getCurrentUser: vi.fn(() => mockUser()) };
  const mockToastService = { success: vi.fn(), error: vi.fn() };

  const component = new UserProfileModalComponent(
    mockUserService as any,
    mockAuthService as any,
    mockToastService as any,
  );
  component.user = mockUser();

  return { component, mockUserService, mockAuthService, mockToastService };
}

describe('UserProfileModalComponent onProfileImageUploaded', () => {
  it('persists the new photo immediately, without requiring the modal Save Changes button', () => {
    const { component, mockUserService, mockAuthService } = makeComponent();

    component.onProfileImageUploaded('new-file-id');

    expect(mockUserService.profileUser).toHaveBeenCalledWith(
      expect.objectContaining({ profileImageUuid: 'new-file-id' }),
    );
    expect(mockAuthService.updateCurrentUser).toHaveBeenCalled();
  });

  it('surfaces an error toast without throwing if the save fails', () => {
    const { component, mockUserService, mockToastService } = makeComponent();
    mockUserService.profileUser.mockReturnValue(throwError(() => new Error('network down')));

    expect(() => component.onProfileImageUploaded('new-file-id')).not.toThrow();
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('does nothing when there is no user loaded into the modal', () => {
    const { component, mockUserService } = makeComponent();
    component.user = null;

    component.onProfileImageUploaded('new-file-id');

    expect(mockUserService.profileUser).not.toHaveBeenCalled();
  });
});
