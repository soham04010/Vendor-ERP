'use client';

import { useEffect, useState } from 'react';
import { rfqApi } from '@/lib/api/rfq.api';
import { approvalApi } from '@/lib/api/approval.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RFQItemsTable from '@/components/rfq/RFQItemsTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Send, Play, PowerOff, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function OfficerRFQDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [rfq, setRfq] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadRFQDetails = async () => {
    setIsLoading(true);
    try {
      const res = await rfqApi.getById(id);
      setRfq(res.rfq || res);
      
      // Load quotations for this RFQ
      try {
        const quotesRes = await rfqApi.getQuotations(id);
        setQuotations(quotesRes.quotations || quotesRes || []);
      } catch (err) {
        console.log('No quotations or failed to load:', err);
      }
    } catch (err) {
      toast.error('Failed to load RFQ details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadRFQDetails();
    }
  }, [id]);

  const handlePublish = async () => {
    setIsActionLoading(true);
    try {
      await rfqApi.publish(id);
      toast.success('RFQ published successfully! Status is now OPEN.');
      loadRFQDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish RFQ');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClose = async () => {
    setIsActionLoading(true);
    try {
      await rfqApi.close(id);
      toast.success('RFQ closed for submissions.');
      loadRFQDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to close RFQ');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitForApproval = async (quoteId: string) => {
    setIsActionLoading(true);
    try {
      await approvalApi.submit({
        quotation_id: quoteId,
        rfq_id: id,
        notes: 'Submitted selected quotation for approval'
      });
      toast.success('Selected quotation submitted for approval successfully!');
      loadRFQDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit approval request');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-250 p-8 text-center text-sm rounded-xl space-y-4">
        <ShieldAlert className="mx-auto text-red-500" size={36} />
        <p>RFQ not found</p>
        <Link href="/officer/rfqs" passHref>
          <Button size="sm">Back to RFQs</Button>
        </Link>
      </div>
    );
  }

  const selectedQuote = quotations.find((q) => q.status === 'selected' || q.is_selected);
  const isApproved = selectedQuote?.status === 'approved'; // checking status

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 no-print">
        <Link href="/officer/rfqs" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{rfq.title}</h2>
            <StatusBadge status={rfq.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{rfq.rfq_number} · Deadline: {format(new Date(rfq.deadline), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        
        <div className="flex gap-2">
          {rfq.status === 'draft' && (
            <Button onClick={handlePublish} disabled={isActionLoading} className="gap-2">
              {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
              <span>Publish RFQ</span>
            </Button>
          )}

          {rfq.status === 'open' && (
            <Button onClick={handleClose} disabled={isActionLoading} variant="secondary" className="gap-2">
              {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <PowerOff size={14} />}
              <span>Close RFQ</span>
            </Button>
          )}

          {quotations.length > 0 && (
            <Link href={`/officer/quotations/${id}/compare`} passHref>
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet size={14} />
                <span>Compare Bids ({quotations.length})</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope summary & line items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Procurement Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {rfq.description || 'No requirement description was provided for this RFQ.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Requested Items</CardTitle>
            </CardHeader>
            <CardContent>
              <RFQItemsTable items={rfq.rfq_items || rfq.items || []} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quotes & Actions list */}
        <div className="space-y-6">
          {/* Quotes summary */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Quotation Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotations.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No bids received yet.</p>
              ) : (
                <div className="space-y-3">
                  {quotations.map((quote) => {
                    const vendorName = quote.vendor?.name || quote.vendor_name || 'Vendor';
                    const isSelected = quote.status === 'selected' || quote.is_selected;
                    return (
                      <div 
                        key={quote.id} 
                        className={`p-3 border rounded-lg space-y-2 flex flex-col justify-between ${
                          isSelected 
                            ? 'border-green-300 bg-green-50/10 dark:border-green-900' 
                            : 'border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-gray-950 dark:text-white text-xs block">{vendorName}</span>
                            <span className="text-[10px] text-gray-400 block">INR {parseFloat(quote.total_amount).toLocaleString('en-IN')}</span>
                          </div>
                          <StatusBadge status={quote.status} />
                        </div>
                        
                        {/* If quote is selected and not yet approved / PO generated, show submit for approval */}
                        {isSelected && quote.status === 'selected' && (
                          <Button 
                            size="sm" 
                            disabled={isActionLoading}
                            onClick={() => handleSubmitForApproval(quote.id)}
                            className="w-full gap-2 text-xs"
                          >
                            <Send size={12} />
                            <span>Submit for Approval</span>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
