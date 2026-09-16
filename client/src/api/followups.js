import api from './axios';

export const getFollowUps = async () => {
  const response = await api.get('/follow-ups');
  return response.data;
};

export const createFollowUp = async (data) => {
  const response = await api.post('/follow-ups', data);
  return response.data;
};

export const updateFollowUpStatus = async (id, status) => {
  const response = await api.patch(`/follow-ups/${id}/status`, { status });
  return response.data;
};

export const deleteFollowUp = async (id) => {
  const response = await api.delete(`/follow-ups/${id}`);
  return response.data;
};
