import {Routes} from '@angular/router';
import {AuthGuard} from './core/guards/auth.guard';
import {RoleGuard} from "./core/guards/role.guard";
import {GuestGuard} from "./core/guards/guest.guard";

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'clearing-agent-unit-registration',
    loadComponent: () =>
      import('./features/clearing-agent-unit/pages/clearing-agent-unit-registration/clearing-agent-unit-registration.component')
        .then(m => m.ClearingAgentUnitRegistrationComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [GuestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [GuestGuard]
  },
  {
    path: 'public/clearing-agent-applicant',
    redirectTo: 'public/clearing-agent-applicant/register',
    pathMatch: 'full'
  },
  {
    path: 'public/clearing-agent-applicant/register',
    loadComponent: () =>
      import('./public/clearing-agent-applicant/pages/public-clearing-agent-applicant-register/public-clearing-agent-applicant-register.component')
        .then(m => m.PublicClearingAgentApplicantRegisterComponent),
    canActivate: [GuestGuard]
  },
  // {
  //   path: 'home',
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  // },
  // {
  //   path: 'dashboard',
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  // },
  // {
  //   path: 'users',
  //   // canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/users/pages/user-list/user-list.component').then(m => m.UserListComponent)
  // },
  {
    path: 'users',
    loadChildren: () => import('./features/users/user.module').then(m => m.UserModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'regions',
    loadChildren: () => import('./features/regions/regions.module').then(m => m.RegionsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'organizations',
    loadChildren: () => import('./features/organizations/organizations.module').then(m => m.OrganizationsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'branches',
    loadChildren: () => import('./features/branches/branches.module').then(m => m.BranchesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'subcities',
    loadChildren: () => import('./features/subcities/subcities.module').then(m => m.SubcitiesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'woredas',
    loadChildren: () => import('./features/woredas/woredas.module').then(m => m.WoredasModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'service-fees',
    loadChildren: () => import('./features/service-fees/service-fees.module').then(m => m.ServiceFeesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'audits',
    loadChildren: () => import('./features/audits/audit.module').then(m => m.AuditModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'notifications',
    loadChildren: () => import('./features/notifications/notification.module').then(m => m.NotificationModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'payments',
    loadChildren: () => import('./features/payments/payment.module').then(m => m.PaymentModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'OPERATOR'] },
  },
  {
    path: 'licenses',
    loadChildren: () => import('./features/license/license.module').then(m => m.LicenseModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'inventory',
    children: [
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.module').then(m => m.EmployeesModule),
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/departments/departments.module').then(m => m.DepartmentsModule),
      },
      {
        path: 'item-types',
        loadChildren: () => import('./features/item-types/item-types.module').then(m => m.ItemTypesModule),
      },
      {
        path: 'items',
        loadChildren: () => import('./features/items/items.module').then(m => m.ItemsModule),
      },
      {
        path: 'returns',
        loadChildren: () => import('./features/borrow-records/borrow-records.module').then(m => m.BorrowRecordsModule),
      },
      {
        path: 'transfers',
        loadChildren: () => import('./features/transfer-records/transfer-records.module').then(m => m.TransferRecordsModule),
      },
      {
        path: 'replacements',
        loadChildren: () => import('./features/replacement-records/replacement-records.module').then(m => m.ReplacementRecordsModule),
      },
      {
        path: 'gate-logs',
        loadChildren: () => import('./features/gate-logs/gate-logs.module').then(m => m.GateLogsModule),
      },
      // keep other inventory sub-features here if needed later (items, departments, etc.)
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'farm-plots',
    loadChildren: () => import('./features/farm-plots/farm-plots.module').then(m => m.FarmPlotsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'OPERATOR'] },
  },
  {
    path: 'farm-leases',
    loadChildren: () => import('./features/farm-leases/farm-leases.module').then(m => m.FarmLeasesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['INVESTOR', 'ADMIN'] },
  },
  {
    path: 'farm-crowdfunding',
    loadChildren: () =>
      import('./features/farm-crowdfunding/farm-crowdfunding.module').then((m) => m.FarmCrowdfundingModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['INVESTOR', 'ADMIN'] },
  },
  {
    path: 'my-borrows',
    loadComponent: () =>
      import('./features/borrow-records/pages/my-borrows/my-borrows.component').then((m) => m.MyBorrowsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['EMPLOYEE'] },
  },
  {
    path: 'workflows',
    loadChildren: () => import('./features/workflows/workflows.module').then(m => m.WorkflowsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  // {
  //   path: 'users/:id',
  //   // canActivate: [AuthGuard],
  //   loadComponent: () => import('./features/users/pages/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  // },
  {
    path: '403',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/errors/forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },
  {
    path: '404',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
