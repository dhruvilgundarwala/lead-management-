import api from './axios';

export const parseSearchPrompt = (prompt) => api.post('/searches/parse', { prompt }).then(res => res.data);
export const executeSearch = (prompt, parsedQuery) => api.post('/searches/execute', { prompt, parsedQuery }).then(res => res.data);
export const getSearchHistory = () => api.get('/searches/history').then(res => res.data);
export const deleteSearchHistory = (id) => api.delete(`/searches/history/${id}`).then(res => res.data);

