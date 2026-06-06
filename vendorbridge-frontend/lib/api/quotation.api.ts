import apiClient from './client';

export const quotationApi = {
  getAll: async () => {
    const response = await apiClient.get('/quotations');
    return response.data;
  },
  submit: async (data: any) => {
    const response = await apiClient.post('/quotations', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/quotations/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/quotations/${id}`, data);
    return response.data;
  },
  selectWinner: async (id: string) => {
    const response = await apiClient.patch(`/quotations/${id}/select`);
    return response.data;
  },
  reject: async (id: string) => {
    const response = await apiClient.patch(`/quotations/${id}/reject`);
    return response.data;
  }
};
