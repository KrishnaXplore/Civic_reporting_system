import api from './axios';

export const loginApi = (email, password) =>
  api.post('/api/v1/auth/login', { email, password });

export const registerApi = (data) =>
  api.post('/api/v1/auth/register', data);

export const logoutApi = () =>
  api.post('/api/v1/auth/logout');

export const getMeApi = () =>
  api.get('/api/v1/auth/me');

export const updateProfileApi = (data) =>
  api.put('/api/v1/auth/profile', data);

export const forgotPasswordApi = (email) =>
  api.post('/api/v1/auth/forgot-password', { email });

export const resetPasswordApi = (token, userId, password) =>
  api.post('/api/v1/auth/reset-password', { token, userId, password });
