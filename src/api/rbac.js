import api from './index';

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const getRoles = () => api.get('/roles');
export const createRole = (data) => api.post('/roles', data);
export const updateRole = (id, data) => api.patch(`/roles/${id}`, data);
export const getPermissions = () => api.get('/permissions');
export const getAuditLogs = (params) => api.get('/audit-logs', { params });
