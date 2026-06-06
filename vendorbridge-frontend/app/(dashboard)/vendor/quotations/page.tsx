'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/api/vendor.api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { Loader2, FileSpreadsheet, Calendar, Clock } from 'lucide-react';

export default function VendorQuotationsPage() {
  const { user } = useAuthStore();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuotations = async () => {
    if (!user || !user.vendor_id) return;
    setIsLoading(true);
    try {
      const res = await vendorApi.getQuotations(user.vendor_id);
      setQuotations(res || []);
    } catch (err) {
      console.error('Error loading vendor quotations:', err);
      toast.error('Failed to load submitted bids');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const columns = [
    {
      header: 'RFQ Details',
      accessor: (row: any) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-xs">{row.rfq_number}</p>
          <span className="text-[10px] text-gray-400 block max-w-[200px] truncate">{row.rfq_title || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Proposed Spend',
      accessor: (row: any) => (
        <div className="text-xs">
          <p className="font-bold text-gray-950 dark:text-white">{formatCurrency(row.total_amount)}</p>
          <span className="text-[9px] text-gray-400 block">Subtotal: {formatCurrency(row.subtotal)}</span>
        </div>
      )
    },
    {
      header: 'Proposed Timeline',
      accessor: (row: any) => (
        <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-0.5">
          <p className="flex items-center gap-1">
            <Clock size={11} className="text-gray-400" />
            <span>{row.delivery_days} days delivery</span>
          </p>
          <p className="flex items-center gap-1">
            <Calendar size={11} className="text-gray-400" />
            <span>Valid till: {row.validity_date ? formatDate(row.validity_date) : 'N/A'}</span>
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Submitted At',
      accessor: (row: any) => (
        <span className="text-[11px] text-gray-500">{formatDate(row.submitted_at)}</span>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Submitted Quotations</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor status changes of your submitted bids (Submitted, Selected/Awarded, or Rejected).
        </p>
      </div>

      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={quotations}
            isLoading={isLoading}
            emptyMessage="No quotations submitted yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
