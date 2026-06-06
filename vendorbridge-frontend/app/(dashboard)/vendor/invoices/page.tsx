'use client';

import { useEffect, useState } from 'react';
import { invoiceApi } from '@/lib/api/invoice.api';
import { vendorApi } from '@/lib/api/vendor.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import InvoiceTemplate from '@/components/invoice/InvoiceTemplate';
import InvoiceActions from '@/components/invoice/InvoiceActions';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { FileText, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function VendorInvoicesPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<{
    invoice: any;
    po: any;
    vendor: any;
    items: any[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const loadInvoices = async () => {
    if (!user || !user.vendor_id) return;
    setIsLoading(true);
    try {
      const res = await invoiceApi.getVendorMine();
      setInvoices(res || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user]);

  const handleInvoiceClick = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsLoadingDetails(true);
    setInvoiceDetails(null);
    try {
      // Fetch full invoice detail (includes items)
      const details = await invoiceApi.getById(invoice.id);
      
      // Fetch full vendor details for complete address, email, phone, GSTIN
      const vendorData = await vendorApi.getById(invoice.vendor_id);

      setInvoiceDetails({
        invoice: {
          invoice_number: details.invoice_number,
          subtotal: details.subtotal,
          tax_rate: details.tax_rate,
          tax_amount: details.tax_amount,
          total_amount: details.total_amount,
          due_date: details.due_date,
          status: details.status,
          created_at: details.created_at,
        },
        po: {
          po_number: details.po_number,
        },
        vendor: {
          name: vendorData.name,
          email: vendorData.email,
          phone: vendorData.phone,
          address: vendorData.address,
          gst_number: vendorData.gst_number,
        },
        items: details.items || [],
      });
    } catch (err) {
      console.error('Error loading invoice details:', err);
      toast.error('Failed to load invoice details');
      setSelectedInvoice(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleStatusUpdated = () => {
    loadInvoices();
    if (selectedInvoice) {
      handleInvoiceClick(selectedInvoice);
    }
  };

  const columns = [
    {
      header: 'Invoice Number',
      accessor: (row: any) => (
        <span className="font-semibold text-gray-900 dark:text-white text-xs">{row.invoice_number}</span>
      )
    },
    {
      header: 'PO Ref',
      accessor: (row: any) => (
        <span className="text-xs text-gray-500 font-mono">{row.po_number || 'N/A'}</span>
      )
    },
    {
      header: 'Billed Amount',
      accessor: (row: any) => (
        <span className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(row.total_amount)}</span>
      )
    },
    {
      header: 'Due Date',
      accessor: (row: any) => (
        <span className="text-xs">{row.due_date ? formatDate(row.due_date) : 'N/A'}</span>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      accessor: (row: any) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => handleInvoiceClick(row)}
          className="text-[10px] h-7"
        >
          View Invoice
        </Button>
      ),
      className: 'text-right w-24'
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Invoices</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Access generated billing invoices, view payment status, and download/print digital invoice copies.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadInvoices} className="gap-1.5 h-8">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Selected Details View */}
      {selectedInvoice ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 no-print">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                setSelectedInvoice(null);
                setInvoiceDetails(null);
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Invoice List</span>
            </Button>
            <span className="text-sm font-semibold text-gray-950 dark:text-white">
              Viewing Details of {selectedInvoice.invoice_number}
            </span>
          </div>

          {isLoadingDetails ? (
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-xs text-gray-500">Loading invoice details...</p>
              </div>
            </Card>
          ) : invoiceDetails ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <InvoiceActions
                invoiceId={selectedInvoice.id}
                invoiceStatus={invoiceDetails.invoice.status}
                userRole={user?.role || 'vendor'}
                onStatusUpdated={handleStatusUpdated}
              />
              <InvoiceTemplate
                invoice={invoiceDetails.invoice}
                po={invoiceDetails.po}
                vendor={invoiceDetails.vendor}
                items={invoiceDetails.items}
              />
            </div>
          ) : (
            <p className="text-xs text-red-500 font-semibold">Failed to load invoice details.</p>
          )}
        </div>
      ) : (
        /* Regular List View */
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 no-print">
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={invoices}
              isLoading={isLoading}
              emptyMessage="No invoices generated yet for your purchase orders."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
