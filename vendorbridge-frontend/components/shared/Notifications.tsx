'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications Feed</h2>
          <p className="text-xs text-gray-500">Real-time alerts and activity updates</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            className="gap-2 text-xs"
          >
            <CheckCheck size={14} />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500 rounded-xl">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 bg-white dark:bg-gray-900 ${
                !n.is_read 
                  ? 'border-blue-200 dark:border-blue-900 bg-blue-50/10' 
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</h4>
                  {n.type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 capitalize">
                      {n.type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{n.message}</p>
                <p className="text-[10px] text-gray-400">
                  {new Date(n.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              {!n.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => markAsRead(n.id)}
                  title="Mark as read"
                  className="text-gray-400 hover:text-blue-600"
                >
                  <Check size={16} />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
