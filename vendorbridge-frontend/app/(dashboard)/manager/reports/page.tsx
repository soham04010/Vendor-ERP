'use client';

import { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '@/lib/api/analytics.api';
import apiClient from '@/lib/api/client';
import KPICard from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
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
import { Loader2, Download, TrendingUp, DollarSign, CheckSquare, Award, RefreshCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2.5 text-xs">
        <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-semibold">
          ₹{parseFloat(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export default function ManagerReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadReportsData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
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
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error('Failed to load analytical reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData(false);
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadReportsData(true), 30000);
    return () => clearInterval(interval);
  }, [loadReportsData]);

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-gray-500">Generating analytics reports...</p>
      </div>
    );
  }

  const totalSpent = dashboardData?.metrics?.totalSpent || 0;
  const totalPurchaseOrders = dashboardData?.metrics?.totalPurchaseOrders || 0;
  const approvedCount = approvalStats.find(s => s.name === 'APPROVED')?.value || 0;
  const rejectedCount = approvalStats.find(s => s.name === 'REJECTED')?.value || 0;
  const pendingCount = approvalStats.find(s => s.name === 'PENDING')?.value || 0;
  const totalApprovalsCount = approvedCount + rejectedCount + pendingCount;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-violet-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Procurement Reports & Analytics</h2>
          <p className="text-purple-100 text-sm mt-1">
            Data insights, spend patterns, vendor performance, and approvals trend.
          </p>
          {lastUpdated && (
            <p className="text-purple-200 text-[10px] mt-1.5 flex items-center gap-1">
              {isRefreshing ? <Loader2 size={10} className="animate-spin" /> : null}
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadReportsData(false)} variant="secondary" size="sm" className="gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30">
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} disabled={isExporting} size="sm" className="gap-1.5 text-xs bg-white text-purple-700 hover:bg-purple-50 font-semibold">
            {isExporting ? <Loader2 className="animate-spin" size={13} /> : <Download size={13} />}
            Export CSV
          </Button>
        </div>
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

      {/* Cumulative Monthly Spend — BAR CHART */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Cumulative Monthly Spend Trends</h3>
              <p className="text-xs text-gray-500 mt-0.5">Procurement financial commitments over months</p>
            </div>
            <span className="text-[10px] bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-2 py-1 rounded-full font-semibold">Live</span>
          </div>
          <div className="h-80 w-full">
            {spendingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No monthly transactions recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradientMgr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                  <Bar dataKey="amount" fill="url(#barGradientMgr)" radius={[6, 6, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor spend breakdown */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Top 5 Vendors by Spend Value</h3>
              <p className="text-xs text-gray-500 mt-0.5">Cumulative purchase order value per supplier</p>
            </div>
            <div className="h-64 w-full">
              {vendorPerformance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No vendor spend metrics recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={vendorPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Spend']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="spent" fill="#10b981" radius={[0, 5, 5, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval distribution */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Approval Decision Distribution</h3>
              <p className="text-xs text-gray-500 mt-0.5">Proportion of approved, rejected, and pending selections</p>
            </div>
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
              {approvalStats.length === 0 || totalApprovalsCount === 0 ? (
                <div className="text-xs text-gray-400">No approvals data recorded.</div>
              ) : (
                <>
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={approvalStats}
                          innerRadius={56}
                          outerRadius={82}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="transparent"
                        >
                          {approvalStats.map((entry, index) => {
                            let color = COLORS[index % COLORS.length];
                            if (entry.name === 'APPROVED') color = '#10b981';
                            if (entry.name === 'REJECTED') color = '#ef4444';
                            if (entry.name === 'PENDING') color = '#3b82f6';
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [value, 'Approvals']}
                          contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e5e7eb' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2.5 text-xs">
                    {approvalStats.map((item, idx) => {
                      let color = COLORS[idx % COLORS.length];
                      if (item.name === 'APPROVED') color = '#10b981';
                      if (item.name === 'REJECTED') color = '#ef4444';
                      if (item.name === 'PENDING') color = '#3b82f6';
                      return (
                        <div key={item.name} className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                          <span className="ml-auto font-bold text-gray-900 dark:text-white pl-3">{item.value}</span>
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
