'use client';

import { useEffect, useState } from 'react';
import { approvalApi } from '@/lib/api/approval.api';
import { rfqApi } from '@/lib/api/rfq.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ComparisonTable from '@/components/quotation/ComparisonTable';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle, Calendar, User, FileText, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function ApprovalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [approval, setApproval] = useState<any>(null);
  const [rfq, setRfq] = useState<any>(null);
  const [detailedQuotations, setDetailedQuotations] = useState<any[]>([]);
  const [remarks, setRemarks] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch approval details
      const appRes = await approvalApi.getById(id);
      setApproval(appRes);

      // 2. Fetch RFQ details (including items)
      const rfqRes = await rfqApi.getById(appRes.rfq_id);
      setRfq(rfqRes);

      // 3. Fetch quotations & compare data
      const [quotesRes, compareRes] = await Promise.all([
        rfqApi.getQuotations(appRes.rfq_id),
        rfqApi.compareQuotations(appRes.rfq_id)
      ]);

      const quotesArray = quotesRes.quotations || quotesRes || [];
      const compareArray = compareRes || [];

      // Combine comparison data with notes and totals for comparison table
      const detailed = compareArray.map((c: any) => {
        const qDetails = quotesArray.find((q: any) => q.id === c.id);
        return {
          ...c,
          subtotal: qDetails?.subtotal || (parseFloat(c.total_amount) / 1.18),
          tax_amount: qDetails?.tax_amount || (parseFloat(c.total_amount) - (parseFloat(c.total_amount) / 1.18)),
          notes: qDetails?.notes || '',
          vendor: { name: c.vendor_name }
        };
      });

      setDetailedQuotations(detailed);
    } catch (err) {
      console.error('Error loading approval details:', err);
      toast.error('Failed to load approval details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await approvalApi.approve(id, remarks);
      toast.success('Bid selection approved! Purchase Order issued successfully.');
      router.push('/manager/approvals');
    } catch (err: any) {
      console.error('Error approving bid:', err);
      toast.error(err.response?.data?.error || 'Failed to approve bid selection');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks || remarks.trim() === '') {
      toast.error('Feedback remarks are required when rejecting approval requests.');
      return;
    }
    
    setIsActionLoading(true);
    try {
      await approvalApi.reject(id, remarks);
      toast.success('Approval request rejected. Returned to Officer.');
      router.push('/manager/approvals');
    } catch (err: any) {
      console.error('Error rejecting bid:', err);
      toast.error(err.response?.data?.error || 'Failed to reject bid selection');
    } finally {
      setIsActionLoading(false);
    }
  };

  const triggerRejectClick = () => {
    if (!remarks || remarks.trim() === '') {
      toast.error('Please input review remarks explaining the reason for rejection.');
      return;
    }
    setShowRejectDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
          <p className="text-xs text-gray-500 font-medium">Loading approval details...</p>
        </div>
      </div>
    );
  }

  if (!approval || !rfq) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-250 p-8 text-center text-sm rounded-xl space-y-4 max-w-md mx-auto mt-12">
        <AlertCircle className="mx-auto text-red-500" size={36} />
        <p className="font-semibold text-gray-900 dark:text-white">Approval Request Not Found</p>
        <Link href="/manager/approvals" passHref>
          <Button size="sm">Back to Approvals</Button>
        </Link>
      </div>
    );
  }

  // Find the selected quotation
  const selectedQuote = detailedQuotations.find(q => q.id === approval.quotation_id || q.status === 'selected' || q.is_selected);
  const selectedQuoteAmount = selectedQuote ? parseFloat(selectedQuote.total_amount) : 0;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <Link href="/manager/approvals" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Bid Selection</h2>
            <StatusBadge status={approval.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            RFQ: <span className="font-medium">{approval.rfq_title} ({approval.rfq_number})</span>
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bid Comparison & Scope */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bid Comparison Card */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="border-b border-gray-100 dark:border-gray-850 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Bid Comparison Table</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {detailedQuotations.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No quotation responses found.</p>
              ) : (
                <ComparisonTable 
                  rfqItems={rfq.items || []} 
                  quotations={detailedQuotations} 
                  disabled={true} 
                />
              )}
            </CardContent>
          </Card>

          {/* Scope and items details */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="py-4 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Procurement Requirement Scope</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {rfq.description || 'No requirement scope description provided.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Selection details, officer remarks, actions */}
        <div className="space-y-6">
          {/* Selection details */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="py-4 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Officer Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-850 pb-2">
                  <span className="text-gray-500">Proposed Winner:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{approval.vendor_name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-850 pb-2">
                  <span className="text-gray-500">Total Selection Price:</span>
                  <span className="font-bold text-gray-900 dark:text-white">INR {selectedQuoteAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-850 pb-2">
                  <span className="text-gray-500">Delivery Period:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedQuote?.delivery_days} Days</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-850 pb-2">
                  <span className="text-gray-500">Officer Remarks:</span>
                  <span className="font-medium text-gray-900 dark:text-white italic">"{approval.remarks || 'No remarks provided.'}"</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-850 pb-2">
                  <span className="text-gray-500 flex items-center gap-1"><User size={12} /> Submitted By:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{approval.submitted_by_name}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500 flex items-center gap-1"><Calendar size={12} /> Submission Date:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {format(new Date(approval.submitted_at), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="py-4 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Manager Authorization Panel</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {approval.status === 'pending' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                      Review Remarks / Feedback
                    </label>
                    <Textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add feedback explaining your approval or rejection..."
                      className="text-xs min-h-[90px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      variant="destructive" 
                      onClick={triggerRejectClick}
                      disabled={isActionLoading}
                      className="gap-1.5 text-xs font-medium"
                    >
                      <XCircle size={14} />
                      Reject Bid
                    </Button>
                    <Button 
                      onClick={() => setShowApproveDialog(true)}
                      disabled={isActionLoading}
                      className="gap-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 dark:bg-green-750 dark:hover:bg-green-800 text-white"
                    >
                      <CheckCircle size={14} />
                      Approve Bid
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                      {approval.status === 'approved' ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <span>Bid Selection {approval.status.toUpperCase()}</span>
                    </div>
                    {approval.reviewed_at && (
                      <p className="text-[10px] text-gray-400">
                        Processed on {format(new Date(approval.reviewed_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    )}
                    <div className="border-t border-gray-150 dark:border-gray-800 pt-2 mt-2">
                      <span className="font-semibold text-gray-500 block">Decision Feedback:</span>
                      <p className="italic text-gray-800 dark:text-gray-200 mt-0.5">
                        "{approval.remarks || 'No remarks recorded.'}"
                      </p>
                    </div>
                  </div>
                  
                  {approval.status === 'approved' && (
                    <div className="flex gap-2 p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 text-[11px] leading-relaxed text-green-750 dark:text-green-400 rounded-lg">
                      <FileText size={16} className="shrink-0 mt-0.5" />
                      <span>Purchase Order has been automatically generated and sent to {approval.vendor_name}. Check the PO archives to view progress.</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Approve Bid Selection"
        description={`Are you sure you want to approve this bid from ${approval.vendor_name}? Approving this will immediately generate and issue an official Purchase Order for INR ${selectedQuoteAmount.toLocaleString('en-IN')}.`}
        confirmText="Confirm & Approve"
        cancelText="Cancel"
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        title="Reject Bid Selection"
        description={`Are you sure you want to reject this selection? This will return the bid selection to the officer for revision and will include your feedback: "${remarks}".`}
        confirmText="Confirm & Reject"
        cancelText="Cancel"
      />
    </div>
  );
}
