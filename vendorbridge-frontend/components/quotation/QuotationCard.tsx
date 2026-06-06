import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import StatusBadge from '../shared/StatusBadge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface QuotationCardProps {
  quote: {
    id: string;
    rfq?: {
      title: string;
      rfq_number: string;
    } | null;
    total_amount: number | string;
    delivery_days: number;
    submitted_at: string;
    status: string;
  };
  role: 'officer' | 'vendor' | 'manager';
}

export default function QuotationCard({ quote, role }: QuotationCardProps) {
  const detailUrl = `/${role}/quotations/${quote.id}`;

  return (
    <Card className="flex flex-col h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          RFQ: {quote.rfq?.rfq_number || 'N/A'}
        </span>
        <StatusBadge status={quote.status} />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
          {quote.rfq?.title || 'Quotation Bid'}
        </CardTitle>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Proposed Cost:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              INR {parseFloat(quote.total_amount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Period:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{quote.delivery_days} Days</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <Calendar size={12} />
          <span>Submitted: {format(new Date(quote.submitted_at), 'dd MMM yyyy, hh:mm a')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
