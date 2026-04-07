import api from './axios';

export const createTicketApi = (data) =>
  api.post('/api/v1/support', data);

export const getMyTicketsApi = () =>
  api.get('/api/v1/support/my');

export const getAllTicketsApi = (params) =>
  api.get('/api/v1/support', { params });

export const updateTicketApi = (id, data) =>
  api.put(`/api/v1/support/${id}`, data);
