import { create } from 'zustand';
import apiClient from '@/lib/api/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      const notifications = response.data.notifications || response.data || [];
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },
  markAsRead: async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      const updatedNotifications = get().notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = updatedNotifications.filter((n) => !n.is_read).length;
      set({ notifications: updatedNotifications, unreadCount });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
  markAllAsRead: async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      const updatedNotifications = get().notifications.map((n) => ({ ...n, is_read: true }));
      set({ notifications: updatedNotifications, unreadCount: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },
  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  }
}));
