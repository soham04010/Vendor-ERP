import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import StatusBadge from '../shared/StatusBadge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface RFQCardProps {
  rfq: {
    id: string;
    rfq_number: string;
    title: string;
    description: string;
    deadline: string;
    status: string;
  };
  role: 'officer' | 'vendor' | 'manager';
}

export default function RFQCard({ rfq, role }: RFQCardProps) {
  const detailUrl = role === 'vendor' 
    ? `/vendor/rfqs/${rfq.id}/submit` 
    : `/${role}/rfqs/${rfq.id}`;

  return (
    <Card className="flex flex-col h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{rfq.rfq_number}</span>
        <StatusBadge status={rfq.status} />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{rfq.title}</CardTitle>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{rfq.description || 'No description provided.'}</p>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={14} />
          <span>Deadline: {format(new Date(rfq.deadline), 'dd MMM yyyy, hh:mm a')}</span>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-100 dark:border-gray-800/60 pt-4 flex gap-2">
        <Link href={detailUrl} passHref className="w-full">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Eye size={14} />
            <span>{role === 'vendor' ? 'Respond to RFQ' : 'View Details'}</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
