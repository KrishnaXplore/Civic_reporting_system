import api from './axios';

export const getMapComplaintsApi = () =>
  api.get('/api/v1/complaints/map');

export const getPublicComplaintsApi = (params) =>
  api.get('/api/v1/complaints/public', { params });

export const getMyComplaintsApi = () =>
  api.get('/api/v1/complaints');

export const getDepartmentComplaintsApi = (params) =>
  api.get('/api/v1/complaints/department', { params });

export const getComplaintByIdApi = (id) =>
  api.get(`/api/v1/complaints/${id}`);

export const submitComplaintApi = (formData) =>
  api.post('/api/v1/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateComplaintStatusApi = (id, data) =>
  api.put(`/api/v1/complaints/${id}/status`, data);

export const resolveComplaintApi = (id, formData) =>
  api.put(`/api/v1/complaints/${id}/resolve`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
