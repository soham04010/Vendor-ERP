'use client';

import { useEffect, useState } from 'react';
import { purchaseOrderApi } from '@/lib/api/purchaseOrder.api';
import { approvalApi } from '@/lib/api/approval.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { FileText, Plus, ShoppingCart, RefreshCw, Calendar, Loader2, FileInput } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { invoiceApi } from '@/lib/api/invoice.api';

export default function OfficerPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [approvedApprovals, setApprovedApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pos' | 'approved_bids'>('pos');
  
  // Create PO Dialog State
  const [isPoDialogOpen, setIsPoDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isGeneratingPo, setIsGeneratingPo] = useState(false);

  // Create Invoice Dialog State
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [taxRate, setTaxRate] = useState('18');
  const [dueDate, setDueDate] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [poRes, approvalsRes] = await Promise.all([
        purchaseOrderApi.getAll(),
        approvalApi.getAll()
      ]);
      
      const pos = poRes.purchaseOrders || poRes || [];
      setPurchaseOrders(pos);
      
      // Filter approvals that are approved and don't already have an associated PO
      const approvalsList = approvalsRes || [];
      const approvedOnly = approvalsList.filter((a: any) => 
        a.status === 'approved' && 
        !pos.some((po: any) => po.approval_id === a.id || po.quotation_id === a.quotation_id)
      );
      setApprovedApprovals(approvedOnly);
    } catch (err) {
      console.error('Error loading PO data:', err);
      toast.error('Failed to load purchase orders and approved bids');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePoClick = (approval: any) => {
    setSelectedApproval(approval);
    // Default delivery date to 14 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    setDeliveryDate(futureDate.toISOString().split('T')[0]);
    setIsPoDialogOpen(true);
  };

  const handleGeneratePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval || !deliveryDate) return;

    setIsGeneratingPo(true);
    try {
      await purchaseOrderApi.create({
        quotation_id: selectedApproval.quotation_id,
        approval_id: selectedApproval.id,
        delivery_date: deliveryDate
      });
      toast.success('Purchase Order generated successfully!');
      setIsPoDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to generate Purchase Order');
    } finally {
      setIsGeneratingPo(false);
    }
  };

  const handleCreateInvoiceClick = (po: any) => {
    setSelectedPo(po);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30-day payment term
    setDueDate(futureDate.toISOString().split('T')[0]);
    setIsInvoiceDialogOpen(true);
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo || !dueDate) return;

    setIsGeneratingInvoice(true);
    try {
      await invoiceApi.create({
        po_id: selectedPo.id,
        tax_rate: parseFloat(taxRate),
        due_date: dueDate
      });
      toast.success('Invoice generated successfully! View it in the Invoices dashboard.');
      setIsInvoiceDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to generate Invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleStatusChange = (poId: string, currentStatus: string, nextStatus: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Update PO Status',
      description: `Are you sure you want to change this Purchase Order status from ${currentStatus.toUpperCase()} to ${nextStatus.toUpperCase()}?`,
      onConfirm: async () => {
        try {
          await purchaseOrderApi.updateStatus(poId, nextStatus);
          toast.success(`Purchase Order is now ${nextStatus}`);
          loadData();
        } catch (err) {
          toast.error('Failed to update PO status');
        }
      }
    });
  };

  const poColumns = [
    {
      header: 'PO Number',
      accessor: (row: any) => (
        <span className="font-semibold text-gray-900 dark:text-white text-xs">{row.po_number}</span>
      )
    },
    {
      header: 'RFQ Ref',
      accessor: (row: any) => (
        <span className="text-xs text-gray-500 font-mono">{row.rfq_number || 'N/A'}</span>
      )
    },
    {
      header: 'Vendor',
      accessor: (row: any) => (
        <span className="font-medium text-gray-900 dark:text-white text-xs">{row.vendor_name}</span>
      )
    },
    {
      header: 'Total Value',
      accessor: (row: any) => (
        <span className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(row.total_amount)}</span>
      )
    },
    {
      header: 'Delivery Date',
      accessor: (row: any) => (
        <span className="text-xs">{row.delivery_date ? formatDate(row.delivery_date) : 'N/A'}</span>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          {row.status === 'issued' && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleStatusChange(row.id, row.status, 'acknowledged')}
              className="text-[10px] h-7 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Acknowledge
            </Button>
          )}
          {row.status === 'acknowledged' && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleStatusChange(row.id, row.status, 'delivered')}
              className="text-[10px] h-7 border-green-200 text-green-600 hover:bg-green-50"
            >
              Mark Delivered
            </Button>
          )}
          
          <Button
            size="xs"
            variant="default"
            onClick={() => handleCreateInvoiceClick(row)}
            className="text-[10px] h-7 gap-1"
          >
            <FileInput size={11} />
            <span>Bill PO</span>
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  const approvalColumns = [
    {
      header: 'RFQ details',
      accessor: (row: any) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-xs">{row.rfq_number}</p>
          <span className="text-[10px] text-gray-400 block max-w-[180px] truncate">{row.rfq_title || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Selected Vendor',
      accessor: (row: any) => (
        <span className="font-medium text-gray-900 dark:text-white text-xs">{row.vendor_name || 'N/A'}</span>
      )
    },
    {
      header: 'Approved Spend',
      accessor: (row: any) => (
        <span className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(row.total_amount || 0)}</span>
      )
    },
    {
      header: 'Approved Date',
      accessor: (row: any) => (
        <span className="text-xs text-gray-500">{row.reviewed_at ? formatDate(row.reviewed_at) : formatDate(row.updated_at)}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <Button
          size="xs"
          variant="default"
          onClick={() => handleCreatePoClick(row)}
          className="text-[10px] h-7 gap-1"
        >
          <Plus size={12} />
          <span>Issue PO</span>
        </Button>
      ),
      className: 'text-right w-28'
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Purchase Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Issue Purchase Orders from approved quotations, manage delivery tracking, and generate invoices.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadData} className="gap-1.5 h-8">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-3 text-sm font-semibold px-4 border-b-2 transition-all ${
            activeTab === 'pos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active POs ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('approved_bids')}
          className={`pb-3 text-sm font-semibold px-4 border-b-2 transition-all ${
            activeTab === 'approved_bids'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Awaiting PO Issue ({approvedApprovals.length})
        </button>
      </div>

      {/* Content */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          {activeTab === 'pos' ? (
            <DataTable
              columns={poColumns}
              data={purchaseOrders}
              isLoading={isLoading}
              emptyMessage="No Purchase Orders found. Go to 'Awaiting PO Issue' to generate one."
            />
          ) : (
            <DataTable
              columns={approvalColumns}
              data={approvedApprovals}
              isLoading={isLoading}
              emptyMessage="No approved bids awaiting PO generation."
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog for PO Generation */}
      <Dialog open={isPoDialogOpen} onOpenChange={setIsPoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShoppingCart className="text-blue-500" size={18} />
              <span>Issue Purchase Order</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGeneratePo} className="space-y-4 pt-2">
            {selectedApproval && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-950/40 rounded-lg text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vendor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedApproval.vendor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Bidded:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedApproval.total_amount || 0)}</span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="deliveryDate">Target Delivery Date *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPoDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGeneratingPo}>
                {isGeneratingPo ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                <span>Generate PO</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Invoice Generation */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="text-blue-500" size={18} />
              <span>Create Billing Invoice</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerateInvoice} className="space-y-4 pt-2">
            {selectedPo && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-950/40 rounded-lg text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">PO Reference:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPo.po_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vendor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPo.vendor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PO Value:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedPo.total_amount)}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="taxRate">GST Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGeneratingInvoice}>
                {isGeneratingInvoice ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                <span>Generate Invoice</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
