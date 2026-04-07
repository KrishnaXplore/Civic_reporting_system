import api from './axios';

export const getDepartmentsApi = () =>
  api.get('/api/v1/departments');

export const createDepartmentApi = (data) =>
  api.post('/api/v1/departments', data);

export const addOfficerApi = (deptId, email) =>
  api.post(`/api/v1/departments/${deptId}/officers`, { email });

export const removeOfficerApi = (deptId, userId) =>
  api.delete(`/api/v1/departments/${deptId}/officers/${userId}`);

export const assignDeptAdminApi = (deptId, email) =>
  api.put(`/api/v1/departments/${deptId}/admin`, { email });
