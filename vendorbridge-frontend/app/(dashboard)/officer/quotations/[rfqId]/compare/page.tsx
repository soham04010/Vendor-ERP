'use client';

import { useEffect, useState } from 'react';
import { rfqApi } from '@/lib/api/rfq.api';
import { approvalApi } from '@/lib/api/approval.api';
import { Button } from '@/components/ui/button';
import ComparisonTable from '@/components/quotation/ComparisonTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ShieldAlert, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function OfficerQuotationComparePage() {
  const params = useParams();
  const rfqId = params.rfqId as string;
  const router = useRouter();

  const [rfq, setRfq] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([]);
  const [approval, setApproval] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComparisonData = async () => {
    setIsLoading(true);
    try {
      const [rfqRes, quotesRes, compareRes] = await Promise.all([
        rfqApi.getById(rfqId),
        rfqApi.getQuotations(rfqId),
        rfqApi.compareQuotations(rfqId)
      ]);
      setRfq(rfqRes.rfq || rfqRes);
      
      const quotesArray = quotesRes.quotations || quotesRes || [];
      const compareArray = compareRes || [];

      const detailed = compareArray.map((c: any) => {
        const qDetails = quotesArray.find((q: any) => q.id === c.id);
        return {
          ...c,
          subtotal: qDetails?.subtotal || (parseFloat(c.total_amount) / 1.18),
          tax_amount: qDetails?.tax_amount || (parseFloat(c.total_amount) - (parseFloat(c.total_amount) / 1.18)),
          notes: qDetails?.notes || '',
          vendor_gst: c.vendor_gst || qDetails?.vendor_gst || '',
          vendor: { name: c.vendor_name }
        };
      });

      setQuotations(detailed);

      // Pre-populate recommended quotes if already submitted
      try {
        const approvalsList = await approvalApi.getAll();
        const rfqApproval = approvalsList.find((a: any) => a.rfq_id === rfqId);
        setApproval(rfqApproval || null);

        if (rfqApproval) {
          const recommended = detailed.filter((q: any) => q.is_selected).map((q: any) => q.id);
          setSelectedQuotationIds(recommended);
        }
      } catch (err) {
        console.log('Failed to load approvals:', err);
      }
    } catch (err) {
      toast.error('Failed to load comparison data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (rfqId) {
      loadComparisonData();
    }
  }, [rfqId]);

  const handleToggleRecommend = (id: string) => {
    setSelectedQuotationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitForApproval = async () => {
    if (selectedQuotationIds.length === 0) {
      toast.error('Please recommend at least one quotation for approval.');
      return;
    }
    setIsSubmitting(true);
    try {
      await approvalApi.submit({
        rfq_id: rfqId,
        quotation_ids: selectedQuotationIds,
        remarks: 'Awaiting manager review and winner selection'
      });
      toast.success('RFQ submitted for approval successfully!');
      loadComparisonData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit approval request');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <Link href={`/officer/rfqs/${rfqId}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quotation Comparison</h2>
          <p className="text-xs text-gray-500">Compare submitted proposals side-by-side for {rfq.title}</p>
        </div>

        {approval ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-lg">
            <span className="text-xs text-gray-500 font-medium">Approval Status:</span>
            <StatusBadge status={approval.status} />
          </div>
        ) : (
          (rfq.status === 'closed' || rfq.status === 'open') && (
            <Button
              onClick={handleSubmitForApproval}
              disabled={isSubmitting || quotations.length === 0 || selectedQuotationIds.length === 0}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              <span>Submit RFQ for Approval</span>
            </Button>
          )
        )}
      </div>

      <ComparisonTable 
        rfqItems={rfq.rfq_items || rfq.items || []} 
        quotations={quotations} 
        isOfficerSelection={true}
        selectedQuotationIds={selectedQuotationIds}
        onToggleRecommend={handleToggleRecommend}
        disabled={isSubmitting || !!approval}
      />
    </div>
  );
}
