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
  Legend,
} from 'recharts';
import { Loader2, Download, TrendingUp, DollarSign, Award, FileSpreadsheet } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [rfqStats, setRfqStats] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
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
        setVendorPerformance(vendorRes.slice(0, 5)); // top 5
        setRfqStats(rfqRes.map((item: any) => ({ name: item.status.toUpperCase(), value: parseInt(item.count) })));
        setApprovalStats(approvalRes.map((item: any) => ({ name: item.status.toUpperCase(), value: parseInt(item.count) })));
      } catch (err) {
        toast.error('Failed to load analytical metrics');
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-gray-500">Compiling analytics report...</p>
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Procurement Intelligence</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Data insights, monthly spend patterns, vendor performance rankings, and activity metrics.
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={isExporting} className="gap-2 text-xs">
          {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          <span>Export Spend Report (CSV)</span>
        </Button>
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
          title="Avg Vendor Count"
          value={dashboardData?.metrics?.totalVendors || 0}
          icon={<Award size={20} />}
          description="Certified vendor base"
        />
      </div>

      {/* Spend Over Time Chart */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Cumulative Monthly Spend Trends</h3>
            <p className="text-xs text-gray-500">Procurement financial commitments over time</p>
          </div>
          <div className="h-80 w-full">
            {!mounted || spendingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                {!mounted ? "Loading chart..." : "No monthly transactions recorded."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
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

      {/* Grid: Vendor Performance & Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Rankings */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Top 5 Vendors by Spend Value</h3>
              <p className="text-xs text-gray-500">Vendors with highest purchase orders value</p>
            </div>
            <div className="h-64 w-full">
            {!mounted || vendorPerformance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                {!mounted ? "Loading chart..." : "No vendor metrics recorded."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={vendorPerformance} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-150 dark:stroke-gray-850" />
                  <XAxis type="number" className="text-[10px]" tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <YAxis type="category" dataKey="vendor_name" className="text-[10px]" tickLine={false} width={100} />
                  <Tooltip
                    formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Spent Value']}
                    contentStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="total_po_value" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          </CardContent>
        </Card>

        {/* Distributions */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">RFQ Status Distribution</h3>
              <p className="text-xs text-gray-500">Comparison of RFQs in draft, open, closed, or award status</p>
            </div>
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
              {!mounted || rfqStats.length === 0 ? (
                <div className="text-xs text-gray-400">{!mounted ? "Loading chart..." : "No RFQs recorded."}</div>
              ) : (
                <>
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={rfqStats}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {rfqStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'RFQs']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    {rfqStats.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-semibold text-gray-800 dark:text-gray-300">{item.name}:</span>
                        <span className="text-gray-500">{item.value}</span>
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
