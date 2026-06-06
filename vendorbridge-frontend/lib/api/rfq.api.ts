import apiClient from './client';

export const rfqApi = {
  getAll: async (params?: { status?: string }) => {
    const response = await apiClient.get('/rfqs', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/rfqs', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/rfqs/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/rfqs/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/rfqs/${id}`);
    return response.data;
  },
  assignVendors: async (id: string, vendorIds: string[]) => {
    const response = await apiClient.post(`/rfqs/${id}/vendors`, { vendorIds });
    return response.data;
  },
  removeVendor: async (id: string, vendorId: string) => {
    const response = await apiClient.delete(`/rfqs/${id}/vendors/${vendorId}`);
    return response.data;
  },
  close: async (id: string) => {
    const response = await apiClient.patch(`/rfqs/${id}/close`);
    return response.data;
  },
  publish: async (id: string) => {
    const response = await apiClient.patch(`/rfqs/${id}/publish`);
    return response.data;
  },
  getQuotations: async (id: string) => {
    const response = await apiClient.get(`/rfqs/${id}/quotations`);
    return response.data;
  },
  compareQuotations: async (id: string) => {
    const response = await apiClient.get(`/rfqs/${id}/compare`);
    return response.data;
  },
  getAssigned: async () => {
    const response = await apiClient.get('/rfqs/vendor/assigned');
    return response.data;
  }
};
