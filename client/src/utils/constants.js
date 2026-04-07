export const CATEGORIES = [
  'Roads & Infrastructure',
  'Water & Sanitation',
  'Electricity',
  'Waste Management',
  'Parks & Public Spaces',
];

export const STATUS_LIST = ['Submitted', 'Assigned', 'InProgress', 'Resolved', 'Rejected'];

export const STATUS_COLORS = {
  Submitted:  { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8', hex: '#94A3B8' },
  Assigned:   { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', hex: '#3B82F6' },
  InProgress: { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', hex: '#F97316' },
  Resolved:   { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', hex: '#22C55E' },
  Rejected:   { bg: '#FFF1F2', color: '#BE123C', dot: '#F43F5E', hex: '#F43F5E' },
};

export const ROLES = {
  CITIZEN:      'citizen',
  OFFICER:      'officer',
  WARD_OFFICER: 'wardOfficer',
  DEPT_ADMIN:   'deptAdmin',
  CITY_ADMIN:   'cityAdmin',
  STATE_ADMIN:  'stateAdmin',
  SUPER_ADMIN:  'superAdmin',
};

export const DEPT_NAMES = [
  'Roads & Infrastructure',
  'Water & Sanitation',
  'Electricity',
  'Waste Management',
  'Parks & Public Spaces',
];

export const DASHBOARD_ROUTES = {
  citizen:    '/dashboard',
  officer:    '/staff/dashboard',
  wardOfficer:'/staff/dashboard',
  deptAdmin:  '/dept-admin/dashboard',
  cityAdmin:  '/city-admin/dashboard',
  stateAdmin: '/state-admin/dashboard',
  superAdmin: '/admin/dashboard',
};
