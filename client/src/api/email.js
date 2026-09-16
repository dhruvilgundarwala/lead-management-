import api from './axios';

export const generateEmail = (leadId, context) => api.post(`/emails/generate/${leadId}`, { context }).then(res => res.data);
export const sendEmailApi = (data) => api.post('/emails/send', data).then(res => res.data);

