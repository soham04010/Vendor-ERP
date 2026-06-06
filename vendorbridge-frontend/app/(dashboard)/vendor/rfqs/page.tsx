'use client';

import { useEffect, useState } from 'react';
import { rfqApi } from '@/lib/api/rfq.api';
import { vendorApi } from '@/lib/api/vendor.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { ClipboardList, Loader2, PlayCircle, Eye, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function VendorRfqsPage() {
  const { user } = useAuthStore();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<any>(null);

  const loadRfqs = async () => {
    if (!user || !user.vendor_id) return;
    setIsLoading(true);
    try {
      // Check vendor profile status
      const profile = await vendorApi.getById(user.vendor_id);
      setVendorProfile(profile);

      if (profile.status === 'active') {
        const res = await rfqApi.getAssigned();
        setRfqs(res || []);
      }
    } catch (err) {
      console.error('Error loading vendor RFQs:', err);
      toast.error('Failed to load RFQ invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  // Handle case: Awaiting Admin approval
  if (vendorProfile && vendorProfile.status !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-8 text-center max-w-2xl mx-auto space-y-4">
        <ClipboardList size={48} className="text-gray-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>Invitations Locked</span>
          <Sparkles size={16} className="text-yellow-500" />
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Your vendor profile is currently `'inactive'` (awaiting Admin verification). You will be eligible to view and bid on invitations once approved.
        </p>
      </div>
    );
  }

  const columns = [
    {
      header: 'RFQ Number',
      accessor: (row: any) => (
        <span className="font-semibold text-gray-900 dark:text-white text-xs">{row.rfq_number}</span>
      )
    },
    {
      header: 'Title & description',
      accessor: (row: any) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-900 dark:text-white text-xs">{row.title}</p>
          <span className="text-[10px] text-gray-400 block max-w-[300px] truncate">{row.description || 'No description provided.'}</span>
        </div>
      )
    },
    {
      header: 'Submission Deadline',
      accessor: (row: any) => (
        <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-0.5">
          <p className="flex items-center gap-1">
            <Calendar size={11} className="text-gray-400" />
            <span className="font-semibold text-red-500">{formatDate(row.deadline)}</span>
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      accessor: (row: any) => {
        const isExpired = new Date(row.deadline) < new Date();
        return (
          <div className="flex items-center gap-2 justify-end">
            {row.status === 'open' && !isExpired ? (
              <Link href={`/vendor/quotations/${row.id}/submit`}>
                <Button size="xs" variant="default" className="text-[10px] h-7 bg-teal-600 hover:bg-teal-700 text-white gap-1">
                  <PlayCircle size={11} />
                  <span>Submit Quote</span>
                </Button>
              </Link>
            ) : (
              <Button size="xs" variant="outline" disabled className="text-[10px] h-7">
                {isExpired ? 'Deadline Passed' : 'Closed'}
              </Button>
            )}
          </div>
        );
      },
      className: 'text-right w-32'
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">RFQ Invitations</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review request specifications, track deadlines, and submit competitive pricing proposals.
        </p>
      </div>

      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rfqs}
            isLoading={isLoading}
            emptyMessage="No RFQ invitations assigned to you."
          />
        </CardContent>
      </Card>
    </div>
  );
}
