'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import RoleSidebar from './RoleSidebar';
import { LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">VB</span>
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">VendorBridge</span>
      </div>

      {/* User Info Snapshot */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 font-semibold uppercase">
            {user.name.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 capitalize mt-1">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto">
        <RoleSidebar />
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:bg-red-950/20 dark:hover:text-red-400 gap-3"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
