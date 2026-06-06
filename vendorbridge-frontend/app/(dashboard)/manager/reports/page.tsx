'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/analytics.api';
import apiClient from '@/lib/api/client';
import KPICard from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Loader2, Download, TrendingUp, DollarSign, CheckSquare, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ManagerReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any[]>([]);

  useEffect(() => {
    async function loadReportsData() {
      setIsLoading(true);
      try {
        const [dashRes, spendRes, vendorRes, approvalRes] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getSpending(),
          analyticsApi.getVendors(),
          analyticsApi.getApprovals(),
        ]);

        setDashboardData(dashRes);
        
        setSpendingData(spendRes.map((item: any) => ({
          month: item.month,
          amount: parseFloat(item.amount) || 0,
        })));
        
        setVendorPerformance(vendorRes.slice(0, 5).map((item: any) => ({
          name: item.vendor_name,
          spent: parseFloat(item.total_po_value) || 0,
        })));

        setApprovalStats(approvalRes.map((item: any) => ({
          name: item.status.toUpperCase(),
          value: parseInt(item.count) || 0,
        })));
      } catch (err) {
        console.error('Error loading reports details:', err);
        toast.error('Failed to load analytical reports');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadReportsData();
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/analytics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `procurement_spend_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('CSV Report exported and downloaded successfully.');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-gray-500">Generating analytics reports...</p>
      </div>
    );
  }

  // Calculate quick stats from loaded data
  const totalSpent = dashboardData?.metrics?.totalSpent || 0;
  const totalPurchaseOrders = dashboardData?.metrics?.totalPurchaseOrders || 0;
  
  const approvedCount = approvalStats.find(s => s.name === 'APPROVED')?.value || 0;
  const rejectedCount = approvalStats.find(s => s.name === 'REJECTED')?.value || 0;
  const pendingCount = approvalStats.find(s => s.name === 'PENDING')?.value || 0;
  const totalApprovalsCount = approvedCount + rejectedCount + pendingCount;

  return (
    <div className="space-y-6 pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Procurement Reports & Analytics</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Data insights, monthly spend patterns, vendor performance, and approvals trend.
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={isExporting} className="gap-2 text-xs font-semibold">
          {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          <span>Export Spend Report (CSV)</span>
        </Button>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Procurement Spend"
          value={formatCurrency(totalSpent)}
          icon={<DollarSign size={20} />}
          description="Approved PO commitments"
        />
        <KPICard
          title="Purchase Orders Issued"
          value={totalPurchaseOrders}
          icon={<TrendingUp size={20} />}
          description="Total active purchase orders"
        />
        <KPICard
          title="Total Approvals Requested"
          value={totalApprovalsCount}
          icon={<CheckSquare size={20} />}
          description={`Approved: ${approvedCount} · Rejected: ${rejectedCount}`}
        />
        <KPICard
          title="Top Vendor Engagement"
          value={vendorPerformance[0]?.name || 'N/A'}
          icon={<Award size={20} />}
          description={vendorPerformance[0] ? `Highest spend: ${formatCurrency(vendorPerformance[0].spent)}` : 'No vendor spend recorded'}
        />
      </div>

      {/* Main visual spend chart */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Cumulative Monthly Spend Trends</h3>
            <p className="text-xs text-gray-500">Procurement financial commitments over months</p>
          </div>
          <div className="h-80 w-full">
            {spendingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-450">
                No monthly transactions recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-150 dark:stroke-gray-850" />
                  <XAxis dataKey="month" className="text-[10px]" tickLine={false} />
                  <YAxis className="text-[10px]" tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Spend']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid for secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor spend breakdown */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Top 5 Vendors by Spend Value</h3>
              <p className="text-xs text-gray-500">Cumulative purchase order value per supplier</p>
            </div>
            <div className="h-64 w-full">
              {vendorPerformance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No vendor spend metrics recorded.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorPerformance} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-150 dark:stroke-gray-850" />
                    <XAxis type="number" className="text-[10px]" tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <YAxis type="category" dataKey="name" className="text-[10px]" tickLine={false} width={100} />
                    <Tooltip
                      formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Spend']}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Bar dataKey="spent" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approvals trend breakdown */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Approval Decision Distribution</h3>
              <p className="text-xs text-gray-500">Proportion of approved, rejected, and pending bid selections</p>
            </div>
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
              {approvalStats.length === 0 || totalApprovalsCount === 0 ? (
                <div className="text-xs text-gray-400">No approvals data recorded.</div>
              ) : (
                <>
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={approvalStats}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {approvalStats.map((entry, index) => {
                            // Match colors specifically for status
                            let color = COLORS[index % COLORS.length];
                            if (entry.name === 'APPROVED') color = '#10b981'; // Green
                            if (entry.name === 'REJECTED') color = '#ef4444'; // Red
                            if (entry.name === 'PENDING') color = '#3b82f6';  // Blue
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Approvals']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    {approvalStats.map((item, idx) => {
                      let color = COLORS[idx % COLORS.length];
                      if (item.name === 'APPROVED') color = '#10b981';
                      if (item.name === 'REJECTED') color = '#ef4444';
                      if (item.name === 'PENDING') color = '#3b82f6';
                      return (
                        <div key={item.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-gray-800 dark:text-gray-300">{item.name}:</span>
                          <span className="text-gray-500 font-medium">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
