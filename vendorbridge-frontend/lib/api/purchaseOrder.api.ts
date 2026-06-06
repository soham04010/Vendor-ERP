import apiClient from './client';

export const purchaseOrderApi = {
  getAll: async () => {
    const response = await apiClient.get('/purchase-orders');
    return response.data;
  },
  create: async (data: { quotation_id: string; approval_id: string; delivery_date: string }) => {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/status`, { status });
    return response.data;
  },
  getVendorMine: async () => {
    const response = await apiClient.get('/purchase-orders/vendor/mine');
    return response.data;
  }
};
