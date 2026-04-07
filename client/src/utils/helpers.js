import { DASHBOARD_ROUTES } from './constants';

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const truncateText = (text = '', maxLen = 80) =>
  text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;

export const getDashboardRoute = (role) =>
  DASHBOARD_ROUTES[role] || '/dashboard';

export const calcResolutionRate = (resolved, total) =>
  total ? Math.round((resolved / total) * 100) : 0;

export const getStatusLabel = (status) =>
  status === 'InProgress' ? 'In Progress' : status;
