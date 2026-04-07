import api from './axios';

export const getStatsApi = () =>
  api.get('/api/v1/admin/stats');

export const getFlaggedUsersApi = () =>
  api.get('/api/v1/admin/flagged-users');

export const getAllUsersApi = () =>
  api.get('/api/v1/admin/users');

export const banUserApi = (id) =>
  api.put(`/api/v1/admin/users/${id}/ban`);

export const clearStrikesApi = (id) =>
  api.put(`/api/v1/admin/users/${id}/clear-strikes`);
