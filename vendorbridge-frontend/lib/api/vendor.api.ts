import apiClient from './client';

export const vendorApi = {
  getAll: async (params?: { search?: string; category?: string; status?: string }) => {
    const response = await apiClient.get('/vendors', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/vendors', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/vendors/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/vendors/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/vendors/${id}/status`, { status });
    return response.data;
  },
  getHistory: async (id: string) => {
    const response = await apiClient.get(`/vendors/${id}/history`);
    return response.data;
  },
  getQuotations: async (id: string) => {
    const response = await apiClient.get(`/vendors/${id}/quotations`);
    return response.data;
  }
};
