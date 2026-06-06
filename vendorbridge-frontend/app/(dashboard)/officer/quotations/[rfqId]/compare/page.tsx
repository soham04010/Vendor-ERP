'use client';

import { useEffect, useState } from 'react';
import { rfqApi } from '@/lib/api/rfq.api';
import { quotationApi } from '@/lib/api/quotation.api';
import { Button } from '@/components/ui/button';
import ComparisonTable from '@/components/quotation/ComparisonTable';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function OfficerQuotationComparePage() {
  const params = useParams();
  const rfqId = params.rfqId as string;
  const router = useRouter();

  const [rfq, setRfq] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  const loadComparisonData = async () => {
    setIsLoading(true);
    try {
      const [rfqRes, quotesRes] = await Promise.all([
        rfqApi.getById(rfqId),
        rfqApi.getQuotations(rfqId)
      ]);
      setRfq(rfqRes.rfq || rfqRes);
      setQuotations(quotesRes.quotations || quotesRes || []);
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

  const handleSelectWinner = async (quoteId: string) => {
    setIsSelecting(true);
    try {
      await quotationApi.selectWinner(quoteId);
      toast.success('Bid selected as winner! You can now submit it for manager approval.');
      loadComparisonData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to select winner');
    } finally {
      setIsSelecting(false);
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
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quotation Comparison</h2>
          <p className="text-xs text-gray-500">Compare submitted proposals side-by-side for {rfq.title}</p>
        </div>
      </div>

      <ComparisonTable 
        rfqItems={rfq.rfq_items || rfq.items || []} 
        quotations={quotations} 
        onSelectWinner={handleSelectWinner}
        disabled={isSelecting || rfq.status !== 'closed'}
      />
    </div>
  );
}
