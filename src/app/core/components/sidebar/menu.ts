import {MenuItem} from './menu.model';

export const MENU: MenuItem[] = [
  {
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    label: 'Home',
    route: '/home',
    roles: ['ADMIN', 'OPERATOR', 'EMPLOYEE']
  },
  {
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    label: 'Users',
    route: '/users',
    roles: ['ADMIN'], // Only ADMIN
    children: [
      {icon: '', label: 'All Users', route: '/users', roles: ['ADMIN']}
    ],
    expanded: false
  },
  {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    label: 'Products',
    route: '/products',
    roles: ['OPERATOR'], // Only OPERATOR
    children: [
      {icon: '', label: 'All Products', route: '/products', roles: ['OPERATOR']}
    ],
    expanded: false
  },
  {
    icon: 'M10 6a4 4 0 018 0 4 4 0 01-.88 2.56l3.66 3.66a1 1 0 01-1.42 1.42l-3.66-3.66A4 4 0 1110 6zm0 0a4 4 0 100 8 4 4 0 000-8z',
    label: 'Lookup',
    route: '/regions',
    roles: ['ADMIN'],
    children: [
      { icon: '', label: 'Regions', route: '/regions', roles: ['ADMIN'] },
      { icon: '', label: 'Organizations', route: '/organizations', roles: ['ADMIN'] },
      { icon: '', label: 'Branches', route: '/branches', roles: ['ADMIN'] },
      { icon: '', label: 'Subcities/Zones', route: '/subcities', roles: ['ADMIN'] },
      { icon: '', label: 'Woredas', route: '/woredas', roles: ['ADMIN'] },
      { icon: '', label: 'Service Fees', route: '/service-fees', roles: ['ADMIN'] }
    ],
    expanded: false
  },
  {
    icon: 'M4 4h7v4H4V4zm0 6h7v4H4v-4zm9-6h7v4h-7V4zm0 6h7v4h-7v-4z',
    label: 'Workflows',
    route: '/workflows',
    roles: ['ADMIN'],
    children: [
      {icon: '', label: 'All Workflows', route: '/workflows', roles: ['ADMIN']}
    ],
    expanded: false
  },
  {
    icon: 'M12 1.75a2.25 2.25 0 012.25 2.25v1.5h1.5A2.25 2.25 0 0118 7.75v12.5A2.75 2.75 0 0115.25 23H8.75A2.75 2.75 0 016 20.25V7.75A2.25 2.25 0 018.25 5.5h1.5V4A2.25 2.25 0 0112 1.75z',
    label: 'Licenses',
    route: '/licenses',
    roles: ['ADMIN'],
    children: [
      { icon: '', label: 'Training Programs', route: '/licenses', roles: ['ADMIN'] },
      { icon: '', label: 'Clearing Agent Applicants', route: '/licenses/clearing-agent-applicants', roles: ['ADMIN'] },
    ],
    expanded: false
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    label: 'My Borrows',
    route: '/my-borrows',
    roles: ['EMPLOYEE'],
  },
  {
    icon: 'M15 17h5l-1.405-4.215A2 2 0 0016.683 11H7.317a2 2 0 00-1.912 1.785L4 17h5m6-10a3 3 0 11-6 0 3 3 0 016 0z',
    label: 'Notifications',
    route: '/notifications',
    roles: ['ADMIN']
  },
  {
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1h-2m-4-1h8a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4-1h-2',
    label: 'Payments',
    route: '/payments',
    roles: ['ADMIN', 'OPERATOR']
  },
  {
    icon: 'M3 3h18v4H3z M3 9h18v4H3z M3 15h18v4H3z',
    label: 'Audit Logs',
    route: '/audits',
    roles: ['ADMIN']
  },
  {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    label: 'Inventory',
    route: '/inventory',
    roles: ['ADMIN'],
    children: [
      { icon: '', label: 'Employees', route: '/inventory/employees', roles: ['ADMIN'] },
      { icon: '', label: 'Departments', route: '/inventory/departments', roles: ['ADMIN'] },
      { icon: '', label: 'Item Types', route: '/inventory/item-types', roles: ['ADMIN'] },
      { icon: '', label: 'Items', route: '/inventory/items', roles: ['ADMIN'] },
      { icon: '', label: 'Returns', route: '/inventory/returns', roles: ['ADMIN'] },
      { icon: '', label: 'Transfers', route: '/inventory/transfers', roles: ['ADMIN'] },
      { icon: '', label: 'Replacements', route: '/inventory/replacements', roles: ['ADMIN'] },
      { icon: '', label: 'Gate Logs', route: '/inventory/gate-logs', roles: ['ADMIN'] },
    ],
    expanded: false
  },
  {
    icon: 'M20 7l-8-4-8 4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m14 0L12 10 2 7',
    label: 'Farm',
    route: '/farm-plots',
    roles: ['ADMIN', 'OPERATOR', 'INVESTOR'],
    children: [
      { icon: '', label: 'Farm Plots', route: '/farm-plots', roles: ['ADMIN', 'OPERATOR'] },
      { icon: '', label: 'Leases', route: '/farm-leases', roles: ['INVESTOR', 'ADMIN'] },
      { icon: '', label: 'Operation Follow-ups', route: '/farm-followups', roles: ['EXTENSION_WORKER'] },
      {
        icon: '',
        label: 'Crowdfunding',
        route: '/farm-crowdfunding/campaigns',
        roles: ['INVESTOR', 'ADMIN'],
        children: [
          {icon: '', label: 'Campaigns', route: '/farm-crowdfunding/campaigns', roles: ['INVESTOR', 'ADMIN']},
          {icon: '', label: 'Investments', route: '/farm-crowdfunding/investments', roles: ['INVESTOR', 'ADMIN']},
        ],
        expanded: false,
      },
    ],
    expanded: false
  }
];
