'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsApi } from '@/lib/api/analytics.api';
import { rfqApi } from '@/lib/api/rfq.api';
import { quotationApi } from '@/lib/api/quotation.api';
import { purchaseOrderApi } from '@/lib/api/purchaseOrder.api';
import { invoiceApi } from '@/lib/api/invoice.api';
import { approvalApi } from '@/lib/api/approval.api';
import KPICard from '@/components/dashboard/KPICard';
import QuickActions from '@/components/dashboard/QuickActions';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { ClipboardList, FileSpreadsheet, CheckSquare, FileText, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OfficerDashboardPage() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [myApprovals, setMyApprovals] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [dashRes, rfqsRes, quotesRes, approvalsRes, poRes, invoiceRes] = await Promise.all([
          analyticsApi.getDashboard(),
          rfqApi.getAll(),
          quotationApi.getAll(),
          approvalApi.getAll(),
          purchaseOrderApi.getAll(),
          invoiceApi.getAll(),
        ]);

        setMetrics(dashRes.metrics || {
          totalVendors: 0,
          totalRfqs: 0,
          totalPurchaseOrders: 0,
          totalSpent: 0,
          totalInvoices: 0,
          totalInvoicedAmount: 0
        });

        // Filter active RFQs (status: open)
        const allRfqs = rfqsRes.rfqs || rfqsRes || [];
        setRfqs(allRfqs.filter((r: any) => r.status === 'open').slice(0, 5));

        // Quotes list
        const quotesArray = quotesRes.quotations || quotesRes || [];
        setRecentQuotes(quotesArray.slice(0, 5));

        // Approvals I submitted
        const approvalsArray = approvalsRes || [];
        setMyApprovals(approvalsArray.filter((a: any) => a.submitted_by_name === user?.name).slice(0, 5));

        // Purchase Orders
        const poArray = poRes.purchaseOrders || poRes || [];
        setPurchaseOrders(poArray.slice(0, 5));

        // Invoices
        const invoiceArray = invoiceRes.invoices || invoiceRes || [];
        setInvoices(invoiceArray.slice(0, 5));
      } catch (err) {
        console.error('Error loading officer dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const activeRfqsCount = rfqs.length;
  const pendingQuotesCount = recentQuotes.filter(q => q.status === 'submitted').length;
  const pendingApprovalsCount = myApprovals.filter(a => a.status === 'pending').length;
  const posThisMonth = purchaseOrders.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold">Welcome back, {user?.name}!</h2>
        <p className="text-xs text-blue-100 mt-1">Manage RFQs, compare bids, generate POs and process invoices.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Active RFQs" 
          value={activeRfqsCount} 
          icon={<ClipboardList size={20} />} 
          description="Live requests in market"
        />
        <KPICard 
          title="Pending Bids" 
          value={pendingQuotesCount} 
          icon={<FileSpreadsheet size={20} />} 
          description="Quotes awaiting selection"
        />
        <KPICard 
          title="Submitted Approvals" 
          value={pendingApprovalsCount} 
          icon={<CheckSquare size={20} />} 
          description="Bids awaiting manager review"
        />
        <KPICard 
          title="Purchase Orders" 
          value={posThisMonth} 
          icon={<FileText size={20} />} 
          description="Total POs issued"
        />
      </div>

      {/* Main widgets container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active RFQs & Quotations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active RFQs */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Active RFQs</h3>
              <Link href="/officer/rfqs" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight size={12} />
              </Link>
            </div>
            {rfqs.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No active RFQs.</p>
            ) : (
              <div className="space-y-3">
                {rfqs.map((rfq) => (
                  <div key={rfq.id} className="flex justify-between items-center p-3 border border-gray-50 dark:border-gray-850 rounded-lg hover:bg-gray-50/40 transition-colors">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white text-xs block">{rfq.title}</span>
                      <span className="text-[10px] text-gray-400 block">{rfq.rfq_number} · Deadline: {format(new Date(rfq.deadline), 'dd MMM yyyy')}</span>
                    </div>
                    <StatusBadge status={rfq.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quotes */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Quotations</h3>
              <Link href="/officer/quotations" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <span>Compare bids</span>
                <ArrowRight size={12} />
              </Link>
            </div>
            {recentQuotes.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No quotations received yet.</p>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map((quote) => {
                  const vendorName = quote.vendor?.name || quote.vendor_name || 'Vendor';
                  const rfqTitle = quote.rfq?.title || 'RFQ Reference';
                  return (
                    <div key={quote.id} className="flex justify-between items-center p-3 border border-gray-50 dark:border-gray-850 rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white text-xs block">{vendorName}</span>
                        <span className="text-[10px] text-gray-500 block">RFQ: {rfqTitle}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 dark:text-white text-xs block">INR {parseFloat(quote.total_amount).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-gray-400 block">{quote.delivery_days} days delivery</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Approvals status */}
        <div className="space-y-6">
          <QuickActions role="officer" />

          {/* Approvals Submitted */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm border-b border-gray-100 dark:border-gray-800 pb-2">My Approvals</h3>
            {myApprovals.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No approval requests submitted.</p>
            ) : (
              <div className="space-y-3">
                {myApprovals.map((app) => (
                  <div key={app.id} className="p-3 border border-gray-50 dark:border-gray-850 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-950 dark:text-white text-xs truncate max-w-[120px]">{app.rfq_title}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-[10px] text-gray-500">Vendor: {app.vendor_name}</p>
                    {app.remarks && <p className="text-[9px] text-gray-400 italic">Remarks: {app.remarks}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
