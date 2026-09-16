import api from './axios';

export const getLeads = () => api.get('/leads').then(res => res.data);
export const getLead = (id) => api.get(`/leads/${id}`).then(res => res.data);
export const verifyLead = (id) => api.post(`/leads/${id}/verify`).then(res => res.data);
export const updateLead = (id, data) => api.patch(`/leads/${id}`, data).then(res => res.data);
