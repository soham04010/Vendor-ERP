import apiClient from './client';

export const invoiceApi = {
  getAll: async () => {
    const response = await apiClient.get('/invoices');
    return response.data;
  },
  create: async (data: { po_id: string; tax_rate: number; due_date: string }) => {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },
  downloadPdfUrl: (id: string) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/invoices/${id}/pdf`;
  },
  sendEmail: async (id: string) => {
    const response = await apiClient.post(`/invoices/${id}/send`);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/invoices/${id}/status`, { status });
    return response.data;
  },
  getVendorMine: async () => {
    const response = await apiClient.get('/invoices/vendor/mine');
    return response.data;
  }
};
