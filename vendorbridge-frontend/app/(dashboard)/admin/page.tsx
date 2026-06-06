'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsApi } from '@/lib/api/analytics.api';
import { authApi } from '@/lib/api/auth.api';
import { vendorApi } from '@/lib/api/vendor.api';
import KPICard from '@/components/dashboard/KPICard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Building2, FileText, IndianRupee, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [dashRes, spendingRes, usersRes, vendorsRes] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getSpending(),
          authApi.getUsers(),
          vendorApi.getAll(),
        ]);

        setMetrics(dashRes.metrics);
        setSpendingData(spendingRes.map((item: any) => ({
          month: item.month,
          amount: parseFloat(item.amount) || 0,
        })));
        setUsersList(usersRes || []);

        // Synthesize dynamic activity logs from actual database records
        const logs: any[] = [];
        
        // Add user signup/creation logs
        const usersArray = usersRes || [];
        usersArray.forEach((u: any) => {
          logs.push({
            id: `user-${u.id}`,
            action: 'USER_CREATED',
            description: `registered account for ${u.name} as ${u.role}`,
            created_at: u.created_at || new Date().toISOString(),
            user: { name: 'System' }
          });
        });

        // Add vendor register logs
        const vendorsArray = vendorsRes.vendors || vendorsRes || [];
        vendorsArray.forEach((v: any) => {
          logs.push({
            id: `vendor-${v.id}`,
            action: 'VENDOR_CREATED',
            description: `registered new vendor organization: ${v.name}`,
            created_at: v.created_at || new Date().toISOString(),
            user: { name: 'System' }
          });
        });

        // Sort descending by date
        logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActivities(logs.slice(0, 10)); // Take top 10

      } catch (error: any) {
        console.error(error);
        toast.error('Failed to load admin dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  // Formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, <span className="font-semibold text-blue-600">{user?.name}</span>. Here is the operational summary of your platform.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vendors"
          value={metrics?.totalVendors || 0}
          icon={<Building2 size={20} />}
          description="Registered on platform"
        />
        <KPICard
          title="Total RFQs"
          value={metrics?.totalRfqs || 0}
          icon={<FileText size={20} />}
          description="Requests for Quotation"
        />
        <KPICard
          title="Total Spending (POs)"
          value={formatCurrency(metrics?.totalSpent || 0)}
          icon={<IndianRupee size={20} />}
          description="Approved purchase value"
        />
        <KPICard
          title="Platform Users"
          value={usersList.length}
          icon={<Users size={20} />}
          description="Active accounts overall"
        />
      </div>

      {/* Main Grid: Spending Analytics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Monthly Procurement Spend Overview</h3>
            <p className="text-xs text-gray-500">PO generated values grouped by month</p>
          </div>
          <div className="h-72 w-full">
            {spendingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No spending data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-800" />
                  <XAxis dataKey="month" className="text-[10px]" tickLine={false} />
                  <YAxis className="text-[10px]" tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Spend']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions role="admin" />
        </div>
      </div>

      {/* Grid: Active Users List & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Users Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Active System Users</h3>
              <p className="text-xs text-gray-500">Accounts authorized to access the ERP</p>
            </div>
            <Link href="/admin/users" className="text-xs text-blue-600 font-semibold hover:underline">
              Manage Users
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-850">
                {usersList.slice(0, 5).map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">{u.name}</td>
                    <td className="py-3 text-gray-500">{u.email}</td>
                    <td className="py-3 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                        u.role === 'manager' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                        u.role === 'officer' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex h-2 w-2 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'} mr-1.5`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity Log */}
        <div>
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}
