'use client';

import { useEffect, useState } from 'react';
import { purchaseOrderApi } from '@/lib/api/purchaseOrder.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { Loader2, CheckSquare, Clock } from 'lucide-react';

export default function VendorPurchaseOrdersPage() {
  const { user } = useAuthStore();
  const [pos, setPos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status Change State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const loadPOs = async () => {
    if (!user || !user.vendor_id) return;
    setIsLoading(true);
    try {
      const res = await purchaseOrderApi.getVendorMine();
      setPos(res || []);
    } catch (err) {
      console.error('Error loading vendor POs:', err);
      toast.error('Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPOs();
  }, [user]);

  const handleAcknowledge = (poId: string, poNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Acknowledge Purchase Order',
      description: `Confirm receipt and start processing Purchase Order ${poNumber}?`,
      onConfirm: async () => {
        try {
          await purchaseOrderApi.updateStatus(poId, 'acknowledged');
          toast.success(`Purchase Order ${poNumber} acknowledged`);
          loadPOs();
        } catch (err) {
          toast.error('Failed to update PO status');
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const columns = [
    {
      header: 'PO Number',
      accessor: (row: any) => (
        <span className="font-semibold text-gray-900 dark:text-white text-xs">{row.po_number}</span>
      )
    },
    {
      header: 'RFQ Reference',
      accessor: (row: any) => (
        <span className="text-xs text-gray-500 font-mono">{row.rfq_number || 'N/A'}</span>
      )
    },
    {
      header: 'PO Amount',
      accessor: (row: any) => (
        <span className="font-bold text-gray-950 dark:text-white text-xs">{formatCurrency(row.total_amount)}</span>
      )
    },
    {
      header: 'Target Delivery',
      accessor: (row: any) => (
        <span className="text-xs text-gray-600 dark:text-gray-400">{row.delivery_date ? formatDate(row.delivery_date) : 'N/A'}</span>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          {row.status === 'issued' ? (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleAcknowledge(row.id, row.po_number)}
              className="text-[10px] h-7 border-teal-200 text-teal-600 hover:bg-teal-50"
            >
              Acknowledge Receipt
            </Button>
          ) : (
            <span className="text-[10px] text-gray-400 italic">No actions pending</span>
          )}
        </div>
      ),
      className: 'text-right w-36'
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Purchase Orders Received</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review official purchase orders generated from approved bid quotation wins, and acknowledge orders to update status.
        </p>
      </div>

      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={pos}
            isLoading={isLoading}
            emptyMessage="No Purchase Orders received yet."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
      />
    </div>
  );
}
