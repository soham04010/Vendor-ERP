import apiClient from './client';

export const authApi = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  getUsers: async (params?: { role?: string; is_active?: boolean }) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};

