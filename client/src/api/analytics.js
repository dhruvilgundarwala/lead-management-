import api from './axios';

export const getAnalyticsStats = async () => {
  const response = await api.get('/analytics/stats');
  return response.data;
};
