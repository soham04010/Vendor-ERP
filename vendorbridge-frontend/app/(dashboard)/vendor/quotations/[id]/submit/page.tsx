'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rfqApi } from '@/lib/api/rfq.api';
import QuotationForm from '@/components/quotation/QuotationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmitQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;
  
  const [rfq, setRfq] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRfq() {
      if (!rfqId) return;
      setIsLoading(true);
      try {
        const details = await rfqApi.getById(rfqId);
        setRfq(details);
      } catch (err: any) {
        console.error('Error fetching RFQ:', err);
        toast.error(err.response?.data?.error || 'Failed to load RFQ specifications');
        router.push('/vendor/rfqs');
      } finally {
        setIsLoading(false);
      }
    }
    loadRfq();
  }, [rfqId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => router.push('/vendor/rfqs')}
        >
          <ArrowLeft size={14} />
          <span>Back to Invitations</span>
        </Button>
        <span className="text-sm font-semibold text-gray-950 dark:text-white">
          Quotation Submission Panel
        </span>
      </div>

      {rfq ? (
        <QuotationForm rfq={rfq} />
      ) : (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <CardContent className="text-center py-6 text-sm text-gray-500">
            RFQ data could not be loaded. Please try again.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
