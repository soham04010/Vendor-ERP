'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { vendorApi } from '@/lib/api/vendor.api';
import { rfqApi } from '@/lib/api/rfq.api';
import { purchaseOrderApi } from '@/lib/api/purchaseOrder.api';
import { invoiceApi } from '@/lib/api/invoice.api';
import KPICard from '@/components/dashboard/KPICard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  ClipboardList, 
  FileSpreadsheet, 
  ShoppingCart, 
  FileText, 
  Loader2, 
  ShieldAlert, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatDate';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [rfqCount, setRfqCount] = useState(0);
  const [quoteCount, setQuoteCount] = useState(0);
  const [poCount, setPoCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  
  const [assignedRfqs, setAssignedRfqs] = useState<any[]>([]);
  const [recentPos, setRecentPos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVendorDashboard() {
      if (!user || !user.vendor_id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // 1. Fetch vendor profile to verify active/approved status
        const profile = await vendorApi.getById(user.vendor_id);
        setVendorProfile(profile);

        if (profile.status === 'active') {
          // 2. Fetch Dashboard metrics
          const [rfqsRes, quotesRes, posRes, invoicesRes] = await Promise.all([
            rfqApi.getAssigned(),
            vendorApi.getQuotations(user.vendor_id),
            purchaseOrderApi.getVendorMine(),
            invoiceApi.getVendorMine()
          ]);

          const rfqs = rfqsRes || [];
          const quotes = quotesRes || [];
          const pos = posRes || [];
          const invoices = invoicesRes || [];

          setRfqCount(rfqs.filter((r: any) => r.status === 'open').length);
          setQuoteCount(quotes.length);
          setPoCount(pos.length);
          setInvoiceCount(invoices.filter((i: any) => i.status !== 'paid').length);

          setAssignedRfqs(rfqs.slice(0, 5));
          setRecentPos(pos.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading vendor dashboard:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadVendorDashboard();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  // Handle case: User is not linked to any vendor profile
  if (!user?.vendor_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-6 text-center">
        <ShieldAlert className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Disassociated</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Your user account is not currently linked to any vendor registry. Contact system administrators.
        </p>
      </div>
    );
  }

  // Handle case: Newly registered vendor, awaiting Admin approval
  if (vendorProfile && vendorProfile.status !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-8 text-center max-w-2xl mx-auto space-y-6">
        <div className="relative p-6 bg-gradient-to-tr from-yellow-500/10 to-orange-500/10 rounded-full border border-yellow-200/50 dark:border-yellow-900/20 text-yellow-600 dark:text-yellow-400">
          <ShieldAlert size={48} className="relative z-10" />
          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse rounded-full" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <span>Awaiting Admin Approval</span>
            <Sparkles size={18} className="text-yellow-500" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            Welcome to **VendorBridge**! Your registration has been received successfully. 
            Before you can view or bid on active procurement requests (RFQs), an administrator must verify and activate your profile.
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-950/30 rounded-xl border border-gray-150 dark:border-gray-800 text-left text-xs max-w-sm space-y-2">
          <p className="font-semibold text-gray-800 dark:text-gray-200">Registered Vendor Profile:</p>
          <div className="text-gray-500 space-y-1">
            <p><span className="font-medium text-gray-400">Name:</span> {vendorProfile.name}</p>
            <p><span className="font-medium text-gray-400">Email:</span> {vendorProfile.email}</p>
            <p><span className="font-medium text-gray-400">Status:</span> <span className="capitalize font-semibold text-yellow-600">{vendorProfile.status}</span></p>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 italic">
          Tip: You can contact your Procurement Officer to expedite approval.
        </p>
      </div>
    );
  }

  // Active dashboard view
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold">Welcome back, {vendorProfile?.name}!</h2>
        <p className="text-xs text-teal-100 mt-1">Submit quotation bids, track active RFQs, and manage PO invoicing.</p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Open RFQ Invitations" 
          value={rfqCount} 
          icon={<ClipboardList size={20} />} 
          description="Awaiting quotes"
        />
        <KPICard 
          title="Quotes Submitted" 
          value={quoteCount} 
          icon={<FileSpreadsheet size={20} />} 
          description="Historical & active bids"
        />
        <KPICard 
          title="Purchase Orders" 
          value={poCount} 
          icon={<ShoppingCart size={20} />} 
          description="Total POs received"
        />
        <KPICard 
          title="Pending Invoices" 
          value={invoiceCount} 
          icon={<FileText size={20} />} 
          description="Generated bills unpaid"
        />
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Open invitations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Open RFQ Invitations</h3>
              <Link href="/vendor/rfqs" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                <span>View all invitations</span>
                <ArrowRight size={12} />
              </Link>
            </div>
            
            {assignedRfqs.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No open RFQ invitations at this time.</p>
            ) : (
              <div className="space-y-3">
                {assignedRfqs.map((rfq) => (
                  <div key={rfq.id} className="flex justify-between items-center p-3 border border-gray-50 dark:border-gray-850 rounded-lg hover:bg-gray-50/40 transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white text-xs">{rfq.rfq_number}</p>
                      <span className="text-[11px] text-gray-500 block">{rfq.title}</span>
                      <span className="text-[10px] text-red-500 block">Deadline: {formatDate(rfq.deadline)}</span>
                    </div>
                    <Link href={`/vendor/quotations/${rfq.id}/submit`}>
                      <Button size="xs" variant="default" className="text-[10px] h-7 bg-teal-600 hover:bg-teal-700 text-white">
                        Submit Quote
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Recent purchase orders */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent POs</h3>
              <Link href="/vendor/purchase-orders" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {recentPos.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No POs received yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPos.map((po) => (
                  <div key={po.id} className="p-3 border border-gray-50 dark:border-gray-850 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-gray-900 dark:text-white">{po.po_number}</p>
                        <span className="text-[10px] text-gray-400 block">{formatDate(po.created_at)}</span>
                      </div>
                      <StatusBadge status={po.status} />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Value:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(po.total_amount)}</span>
                    </div>
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
