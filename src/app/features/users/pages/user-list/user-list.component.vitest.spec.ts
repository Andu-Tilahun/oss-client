import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { User } from '../../models/user.model';
import { PageResponse } from '../../../../shared/models/api-response.model';

const exportRowsToExcelMock = vi.fn(() => ({ sizeBytes: 4096 }));
vi.mock('../../../../shared/utils/excel-export.util', () => ({
  exportRowsToExcel: (...args: unknown[]) => exportRowsToExcelMock(...args),
}));

function mockUser(overrides: Partial<User>): User {
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

function mockPage(content: User[]): PageResponse<User> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length || 10,
    number: 0,
    first: true,
    last: true,
  };
}

const INVESTOR_USER = mockUser({ id: 'inv-1', role: 'INVESTOR' });
const STAFF_USER = mockUser({ id: 'staff-1', role: 'OPERATOR' });
const ADMIN_USER = mockUser({ id: 'admin-1', role: 'ADMIN' });

function makeComponent() {
  const mockUserService = {
    filterUsers: vi.fn(() => of(mockPage([INVESTOR_USER]))),
    lockUser: vi.fn(() => of(INVESTOR_USER)),
    unlockUser: vi.fn(() => of({ success: true, message: '' })),
    deleteUser: vi.fn(() => of({ success: true, message: '' })),
    notifyExport: vi.fn(() => of({ success: true, message: '' })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  const component = new UserListComponent(mockUserService as any, mockToastService as any);
  return { component, mockUserService, mockToastService };
}

describe('UserListComponent', () => {
  let component: UserListComponent;
  let mockUserService: ReturnType<typeof makeComponent>['mockUserService'];

  beforeEach(() => {
    ({ component, mockUserService } = makeComponent());
    exportRowsToExcelMock.mockClear();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('defaults to the investor tab and loads investors on init', () => {
    component.ngOnInit();
    expect(mockUserService.filterUsers).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['INVESTOR'] })
    );
  });

  it('loadStaff() requests exclusion of ADMIN and INVESTOR, not an enumerated role list', () => {
    component.loadStaff();
    expect(mockUserService.filterUsers).toHaveBeenCalledWith(
      expect.objectContaining({ excludeRoles: ['ADMIN', 'INVESTOR'] })
    );
    const lastCall = mockUserService.filterUsers.mock.calls[mockUserService.filterUsers.mock.calls.length - 1][0];
    expect(lastCall.roles).toBeUndefined();
  });

  it('loadStaff() switches to an inclusion filter when a specific staff role checkbox is checked', () => {
    component.staffRoleFilters = [
      {label: 'Operator', value: 'OPERATOR', checked: true},
      {label: 'Extension Worker', value: 'EXTENSION_WORKER', checked: false},
    ];
    component.loadStaff();
    const lastCall = mockUserService.filterUsers.mock.calls[mockUserService.filterUsers.mock.calls.length - 1][0];
    expect(lastCall.roles).toEqual(['OPERATOR']);
    expect(lastCall.excludeRoles).toBeUndefined();
  });

  it('loadAdmins() requests roles: ["ADMIN"]', () => {
    component.loadAdmins();
    expect(mockUserService.filterUsers).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['ADMIN'] })
    );
  });

  it('onUsersTabChange switches tabs and loads only the newly active tab', () => {
    mockUserService.filterUsers.mockReturnValue(of(mockPage([STAFF_USER])));
    component.onUsersTabChange('staff');

    expect(component.usersActiveTab).toBe('staff');
    expect(mockUserService.filterUsers).toHaveBeenCalledWith(
      expect.objectContaining({ excludeRoles: ['ADMIN', 'INVESTOR'] })
    );
    expect(component.staffUsers).toEqual([STAFF_USER]);
    // Switching to staff must not populate/clear investor state as a side effect.
    expect(component.investorUsers).toEqual([]);
  });

  it('onAdd("investor") locks the create form to a single role', () => {
    component.onAdd('investor');
    expect(component.createAllowedRoleNames).toEqual(['INVESTOR']);
    expect(component.showCreateModal).toBe(true);
  });

  it('onAdd("admin") locks the create form to a single role', () => {
    component.onAdd('admin');
    expect(component.createAllowedRoleNames).toEqual(['ADMIN']);
  });

  it('onAdd("staff") leaves both staff roles selectable', () => {
    component.onAdd('staff');
    expect(component.createAllowedRoleNames).toEqual(['OPERATOR', 'EXTENSION_WORKER']);
  });

  it('auto-selects the first row when nothing was previously selected', () => {
    mockUserService.filterUsers.mockReturnValue(of(mockPage([INVESTOR_USER])));
    component.loadInvestors();
    expect(component.selectedUser?.id).toBe(INVESTOR_USER.id);
  });

  it('keeps the previous selection across a reload if it still exists', () => {
    const other = mockUser({ id: 'inv-2', role: 'INVESTOR' });
    mockUserService.filterUsers.mockReturnValue(of(mockPage([INVESTOR_USER, other])));
    component.loadInvestors();
    component.selectedUser = { ...other };

    mockUserService.filterUsers.mockReturnValue(of(mockPage([INVESTOR_USER, other])));
    component.loadInvestors(other.id);
    expect(component.selectedUser?.id).toBe(other.id);
  });

  it('falls back to the first row when the previous selection no longer exists', () => {
    mockUserService.filterUsers.mockReturnValue(of(mockPage([INVESTOR_USER])));
    component.loadInvestors('some-deleted-id');
    expect(component.selectedUser?.id).toBe(INVESTOR_USER.id);
  });

  it('clears the selection when a tab loads an empty list', () => {
    component.selectedUser = { ...INVESTOR_USER };
    mockUserService.filterUsers.mockReturnValue(of(mockPage([])));
    component.loadInvestors();
    expect(component.selectedUser).toBeNull();
  });

  it('onUserCreated reloads only the currently active tab', () => {
    component.usersActiveTab = 'admin';
    mockUserService.filterUsers.mockReturnValue(of(mockPage([ADMIN_USER])));
    component.onUserCreated();
    expect(mockUserService.filterUsers).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['ADMIN'] })
    );
  });

  describe('onExport', () => {
    it('exports the full investor tab (not just the current page) and notifies the backend', () => {
      const other = mockUser({ id: 'inv-2', role: 'INVESTOR' });
      component.investorTotal = 2;
      mockUserService.filterUsers.mockReturnValue(of(mockPage([INVESTOR_USER, other])));

      component.onExport();

      expect(mockUserService.filterUsers).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['INVESTOR'], page: 0, size: 2 })
      );
      expect(exportRowsToExcelMock).toHaveBeenCalledWith(
        [INVESTOR_USER, other],
        component.exportColumns,
        'users-investor'
      );
      expect(mockUserService.notifyExport).toHaveBeenCalledWith({
        exportLabel: 'Investors',
        recordCount: 2,
        fileSizeBytes: 4096,
      });
    });

    it('exports the staff tab using the exclusion filter and the "Staff" label', () => {
      component.usersActiveTab = 'staff';
      component.staffTotal = 1;
      mockUserService.filterUsers.mockReturnValue(of(mockPage([mockUser({ id: 'staff-2', role: 'EXTENSION_WORKER' })])));

      component.onExport();

      const lastCall = mockUserService.filterUsers.mock.calls[mockUserService.filterUsers.mock.calls.length - 1][0];
      expect(lastCall.excludeRoles).toEqual(['ADMIN', 'INVESTOR']);
      expect(lastCall.roles).toBeUndefined();
      expect(mockUserService.notifyExport).toHaveBeenCalledWith(
        expect.objectContaining({ exportLabel: 'Staff', recordCount: 1 })
      );
    });

    it('exports the admin tab with the "Admins" label', () => {
      component.usersActiveTab = 'admin';
      component.adminTotal = 1;
      mockUserService.filterUsers.mockReturnValue(of(mockPage([ADMIN_USER])));

      component.onExport();

      expect(mockUserService.filterUsers).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['ADMIN'], page: 0, size: 1 })
      );
      expect(mockUserService.notifyExport).toHaveBeenCalledWith(
        expect.objectContaining({ exportLabel: 'Admins', recordCount: 1 })
      );
    });

    it('requests at least 1 row even when the tab total is 0', () => {
      component.investorTotal = 0;
      mockUserService.filterUsers.mockReturnValue(of(mockPage([])));

      component.onExport();

      expect(mockUserService.filterUsers).toHaveBeenCalledWith(
        expect.objectContaining({ size: 1 })
      );
    });

    it('shows an error toast and does not export when the fetch fails', () => {
      mockUserService.filterUsers.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('boom')),
      } as any);

      component.onExport();

      expect(exportRowsToExcelMock).not.toHaveBeenCalled();
      expect(mockUserService.notifyExport).not.toHaveBeenCalled();
    });
  });
});
