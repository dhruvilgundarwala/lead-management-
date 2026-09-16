import api from './axios';

export const loginApi = (data) => api.post('/auth/login', data).then(res => res.data);
export const registerApi = (data) => api.post('/auth/register', data).then(res => res.data);
export const getMe = () => api.get('/auth/me').then(res => res.data);
export const logoutApi = () => api.post('/auth/logout').then(res => res.data);
