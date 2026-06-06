'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { approvalApi } from '@/lib/api/approval.api';
import { purchaseOrderApi } from '@/lib/api/purchaseOrder.api';
import { analyticsApi } from '@/lib/api/analytics.api';
import KPICard from '@/components/dashboard/KPICard';
import QuickActions from '@/components/dashboard/QuickActions';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckSquare, FileText, Loader2, ArrowRight, DollarSign, Users, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [analyticsRes, pendingRes, posRes] = await Promise.all([
          analyticsApi.getDashboard(),
          approvalApi.getPending(),
          purchaseOrderApi.getAll(),
        ]);

        setMetrics(analyticsRes.metrics || {
          totalVendors: 0,
          totalRfqs: 0,
          totalPurchaseOrders: 0,
          totalSpent: 0,
          totalInvoices: 0,
          totalInvoicedAmount: 0
        });

        setPendingApprovals(pendingRes || []);
        setPurchaseOrders(posRes || []);
      } catch (err) {
        console.error('Error loading manager dashboard data:', err);
        toast.error('Failed to load dashboard statistics');
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
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
          <p className="text-xs text-gray-500 font-medium">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalSpent = metrics?.totalSpent || 0;
  const pendingApprovalsCount = pendingApprovals.length;
  const totalPurchaseOrders = metrics?.totalPurchaseOrders || 0;
  const totalVendors = metrics?.totalVendors || 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-850 text-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold">Welcome back, {user?.name}!</h2>
        <p className="text-xs text-blue-100 mt-1">
          Review pending bids, authorize procurement approvals, and monitor spend analytics.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Pending Approvals" 
          value={pendingApprovalsCount} 
          icon={<CheckSquare size={20} />} 
          description="Awaiting review"
          trend={pendingApprovalsCount > 0 ? { value: `${pendingApprovalsCount} action item(s)`, isPositive: false } : undefined}
        />
        <KPICard 
          title="Total Committed Spend" 
          value={formatCurrency(totalSpent)} 
          icon={<DollarSign size={20} />} 
          description="Total PO Value"
        />
        <KPICard 
          title="Purchase Orders Issued" 
          value={totalPurchaseOrders} 
          icon={<FileText size={20} />} 
          description="Total active orders"
        />
        <KPICard 
          title="Registered Vendors" 
          value={totalVendors} 
          icon={<Users size={20} />} 
          description="Onboarded supplier base"
        />
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Items - Pending Approvals */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Approvals Awaiting Your Review</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Please review vendor bid selections and grant authorization.</p>
              </div>
              <Link href="/manager/approvals" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                <span>View all</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <CheckSquare className="text-green-500" size={32} />
                <p className="text-xs text-gray-500 dark:text-gray-400">All caught up! No pending approvals at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {pendingApprovals.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-xs block hover:underline">
                        <Link href={`/manager/approvals/${app.id}`}>{app.rfq_title || 'RFQ Quotation Selection'}</Link>
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>No. {app.rfq_number}</span>
                        <span>·</span>
                        <span>Vendor: <span className="font-medium text-gray-650 dark:text-gray-300">{app.vendor_name}</span></span>
                        <span>·</span>
                        <span>Submitted by: {app.submitted_by_name}</span>
                      </div>
                    </div>
                    <Link href={`/manager/approvals/${app.id}`} passHref>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        Review Bids
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Purchase Orders */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Purchase Orders</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Most recent procurement orders dispatched to vendors.</p>
              </div>
            </div>

            {purchaseOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No purchase orders issued yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] text-gray-450 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-2 font-semibold">PO Number</th>
                      <th className="py-2 font-semibold">Vendor</th>
                      <th className="py-2 font-semibold">Amount</th>
                      <th className="py-2 font-semibold">Status</th>
                      <th className="py-2 font-semibold">Issued Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {purchaseOrders.slice(0, 5).map((po) => (
                      <tr key={po.id} className="text-xs text-gray-700 dark:text-gray-300">
                        <td className="py-3 font-semibold text-gray-900 dark:text-white">{po.po_number}</td>
                        <td className="py-3">{po.vendor_name}</td>
                        <td className="py-3 font-medium">INR {parseFloat(po.total_amount).toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-3 text-[10px] text-gray-400">
                          {format(new Date(po.created_at), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Quick Actions widget */}
          <QuickActions role="manager" />

          {/* Quick Info / Tips Card */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-5 rounded-xl space-y-3">
            <div className="flex gap-2 text-blue-700 dark:text-blue-400">
              <ShieldAlert size={18} className="shrink-0" />
              <h4 className="font-bold text-xs">Approval Authority Guide</h4>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-650 dark:text-blue-300">
              As a procurement manager, approving an selection immediately awards the contract to the chosen vendor, locks in the quoted price, and automatically triggers the creation and distribution of the official Purchase Order (PO). Rejection will return the RFQ to the officer with your remarks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
