import api from './axios';

export const getCampaigns = async () => {
  const response = await api.get('/campaigns');
  return response.data;
};

export const createCampaign = async (data) => {
  const response = await api.post('/campaigns', data);
  return response.data;
};

export const updateCampaign = async (id, data) => {
  const response = await api.put(`/campaigns/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id) => {
  const response = await api.delete(`/campaigns/${id}`);
  return response.data;
};
