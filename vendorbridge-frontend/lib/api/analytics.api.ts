import apiClient from './client';

export const analyticsApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },
  getSpending: async () => {
    const response = await apiClient.get('/analytics/spending');
    return response.data;
  },
  getVendors: async () => {
    const response = await apiClient.get('/analytics/vendors');
    return response.data;
  },
  getRfqs: async () => {
    const response = await apiClient.get('/analytics/rfqs');
    return response.data;
  },
  getApprovals: async () => {
    const response = await apiClient.get('/analytics/approvals');
    return response.data;
  },
  exportCsvUrl: () => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/analytics/export`;
  }
};
