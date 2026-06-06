import apiClient from './client';

export const approvalApi = {
  getAll: async () => {
    const response = await apiClient.get('/approvals');
    return response.data;
  },
  submit: async (data: { quotation_id?: string; quotation_ids?: string[]; rfq_id: string; remarks?: string }) => {
    const response = await apiClient.post('/approvals', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/approvals/${id}`);
    return response.data;
  },
  approve: async (id: string, remarks?: string, selectedQuotationId?: string) => {
    const response = await apiClient.patch(`/approvals/${id}/approve`, { remarks, selectedQuotationId });
    return response.data;
  },
  reject: async (id: string, remarks: string) => {
    const response = await apiClient.patch(`/approvals/${id}/reject`, { remarks });
    return response.data;
  },
  getPending: async () => {
    const response = await apiClient.get('/approvals/pending');
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get('/approvals/history');
    return response.data;
  }
};
