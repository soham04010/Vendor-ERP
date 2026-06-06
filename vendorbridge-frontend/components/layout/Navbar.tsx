'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();

  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {user.role} Dashboard
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-gray-600 dark:text-gray-300">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold px-1 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <div className="p-3 font-semibold text-sm border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 flex flex-col items-start gap-1 border-b border-gray-50 dark:border-gray-800/50 cursor-pointer ${
                    !n.is_read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2">{n.message}</p>
                  <span className="text-[9px] text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-gray-200 dark:border-gray-800">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 text-xs font-bold uppercase">
                {user.name.substring(0, 2)}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[80px] truncate">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled className="text-xs flex flex-col items-start gap-0.5">
              <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
              <span className="text-gray-500 truncate w-full">{user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 font-medium">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
