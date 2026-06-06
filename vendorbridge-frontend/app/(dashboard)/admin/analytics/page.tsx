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
  Legend,
} from 'recharts';
import { Loader2, Download, TrendingUp, DollarSign, Award, FileSpreadsheet, RefreshCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [rfqStats, setRfqStats] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAnalytics = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [dashRes, spendRes, vendorRes, rfqRes, approvalRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getSpending(),
        analyticsApi.getVendors(),
        analyticsApi.getRfqs(),
        analyticsApi.getApprovals(),
      ]);

      setDashboardData(dashRes);
      setSpendingData(spendRes.map((item: any) => ({
        month: item.month,
        amount: parseFloat(item.amount) || 0,
      })));
      setVendorPerformance(vendorRes.slice(0, 5));
      setRfqStats(rfqRes.map((item: any) => ({ name: item.status.toUpperCase(), value: parseInt(item.count) })));
      setApprovalStats(approvalRes.map((item: any) => ({ name: item.status.toUpperCase(), value: parseInt(item.count) })));
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error('Failed to load analytical metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(false);
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadAnalytics(true), 30000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-gray-500">Compiling analytics report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Procurement Intelligence</h2>
          <p className="text-blue-100 text-sm mt-1">
            Data insights, spend patterns, vendor rankings, and activity metrics.
          </p>
          {lastUpdated && (
            <p className="text-blue-200 text-[10px] mt-1.5 flex items-center gap-1">
              {isRefreshing ? <Loader2 size={10} className="animate-spin" /> : null}
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadAnalytics(false)} variant="secondary" size="sm" className="gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30">
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} disabled={isExporting} size="sm" className="gap-1.5 text-xs bg-white text-blue-700 hover:bg-blue-50 font-semibold">
            {isExporting ? <Loader2 className="animate-spin" size={13} /> : <Download size={13} />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Procurement Spend (INR)"
          value={formatCurrency(dashboardData?.metrics?.totalSpent || 0)}
          icon={<DollarSign size={20} />}
          description="Total PO commitments"
        />
        <KPICard
          title="Total Invoiced (INR)"
          value={formatCurrency(dashboardData?.metrics?.totalInvoicedAmount || 0)}
          icon={<FileSpreadsheet size={20} />}
          description="Sum of all invoice claims"
        />
        <KPICard
          title="Purchase Orders Issued"
          value={dashboardData?.metrics?.totalPurchaseOrders || 0}
          icon={<TrendingUp size={20} />}
          description="Total orders generated"
        />
        <KPICard
          title="Certified Vendor Base"
          value={dashboardData?.metrics?.totalVendors || 0}
          icon={<Award size={20} />}
          description="Active vendor count"
        />
      </div>

      {/* Cumulative Monthly Spend — BAR CHART */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Cumulative Monthly Spend Trends</h3>
              <p className="text-xs text-gray-500 mt-0.5">Procurement financial commitments over time</p>
            </div>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-semibold">Live</span>
          </div>
          <div className="h-80 w-full">
            {spendingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No monthly transactions recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
                  <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid: Vendor Performance & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Rankings */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Top 5 Vendors by Spend Value</h3>
              <p className="text-xs text-gray-500 mt-0.5">Vendors with highest purchase order value</p>
            </div>
            <div className="h-64 w-full">
              {vendorPerformance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No vendor metrics recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={vendorPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <YAxis type="category" dataKey="vendor_name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Spent']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="total_po_value" fill="#10b981" radius={[0, 5, 5, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RFQ Status Distribution */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">RFQ Status Distribution</h3>
              <p className="text-xs text-gray-500 mt-0.5">Comparison of RFQs in draft, open, closed, or awarded</p>
            </div>
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
              {rfqStats.length === 0 ? (
                <div className="text-xs text-gray-400">No RFQs recorded.</div>
              ) : (
                <>
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={rfqStats}
                          innerRadius={56}
                          outerRadius={82}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="transparent"
                        >
                          {rfqStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [value, 'RFQs']}
                          contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e5e7eb' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2.5 text-xs">
                    {rfqStats.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="ml-auto font-bold text-gray-900 dark:text-white pl-3">{item.value}</span>
                      </div>
                    ))}
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
