'use client';

import { useEffect, useState } from 'react';
import { rfqApi } from '@/lib/api/rfq.api';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { ClipboardList, Plus, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OfficerRFQsPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRFQs = async () => {
    setIsLoading(true);
    try {
      const res = await rfqApi.getAll();
      setRfqs(res.rfqs || res || []);
    } catch (err) {
      toast.error('Failed to load RFQs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRFQs();
  }, []);

  const columns = [
    {
      header: 'RFQ Number',
      accessor: (row: any) => <span className="font-semibold text-gray-950 dark:text-white">{row.rfq_number}</span>,
    },
    {
      header: 'Title',
      accessor: (row: any) => (
        <div>
          <span className="font-medium text-gray-900 dark:text-white block">{row.title}</span>
          <span className="text-[10px] text-gray-500 line-clamp-1">{row.description || 'No description'}</span>
        </div>
      ),
    },
    {
      header: 'Submission Deadline',
      accessor: (row: any) => <span>{format(new Date(row.deadline), 'dd MMM yyyy, hh:mm a')}</span>,
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <Link href={`/officer/rfqs/${row.id}`} passHref>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye size={14} />
            <span>Manage</span>
          </Button>
        </Link>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request For Quotations (RFQs)</h2>
          <p className="text-xs text-gray-500">Draft, open, close or award procurement requests</p>
        </div>
        <Link href="/officer/rfqs/create" passHref>
          <Button className="gap-2">
            <Plus size={16} />
            <span>Create RFQ</span>
          </Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={rfqs} 
        isLoading={isLoading} 
        emptyMessage="No RFQs created yet. Click 'Create RFQ' to get started."
      />
    </div>
  );
}
