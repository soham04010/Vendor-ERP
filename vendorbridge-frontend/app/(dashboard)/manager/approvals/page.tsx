'use client';

import { useEffect, useState } from 'react';
import { approvalApi } from '@/lib/api/approval.api';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { CheckSquare, Eye, Loader2, History } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [historyApprovals, setHistoryApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        approvalApi.getPending(),
        approvalApi.getHistory(),
      ]);
      setPendingApprovals(pendingRes || []);
      setHistoryApprovals(historyRes || []);
    } catch (err) {
      console.error('Error loading approvals list:', err);
      toast.error('Failed to load approvals list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
    } catch (e) {
      return dateStr;
    }
  };

  const pendingColumns = [
    {
      header: 'RFQ Number',
      accessor: (row: any) => <span className="font-semibold text-gray-950 dark:text-white">{row.rfq_number}</span>,
    },
    {
      header: 'RFQ Title',
      accessor: (row: any) => <span className="font-medium text-gray-900 dark:text-white">{row.rfq_title}</span>,
    },
    {
      header: 'Vendor Name',
      accessor: (row: any) => <span>{row.vendor_name}</span>,
    },
    {
      header: 'Submitted By',
      accessor: (row: any) => <span>{row.submitted_by_name}</span>,
    },
    {
      header: 'Submitted At',
      accessor: (row: any) => <span>{formatDate(row.submitted_at)}</span>,
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <Link href={`/manager/approvals/${row.id}`} passHref>
          <Button size="sm" className="gap-2">
            <Eye size={14} />
            <span>Review Bids</span>
          </Button>
        </Link>
      ),
      className: 'text-right',
    },
  ];

  const historyColumns = [
    {
      header: 'RFQ Number',
      accessor: (row: any) => <span className="font-semibold text-gray-950 dark:text-white">{row.rfq_number}</span>,
    },
    {
      header: 'RFQ Title',
      accessor: (row: any) => <span className="font-medium text-gray-900 dark:text-white">{row.rfq_title}</span>,
    },
    {
      header: 'Vendor Name',
      accessor: (row: any) => <span>{row.vendor_name}</span>,
    },
    {
      header: 'Reviewed At',
      accessor: (row: any) => <span>{formatDate(row.reviewed_at)}</span>,
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Remarks',
      accessor: (row: any) => (
        <span className="text-gray-550 dark:text-gray-400 italic text-xs max-w-xs block truncate" title={row.remarks}>
          {row.remarks || 'No remarks provided.'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <Link href={`/manager/approvals/${row.id}`} passHref>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye size={14} />
            <span>View Details</span>
          </Button>
        </Link>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Approvals Management</h2>
          <p className="text-xs text-gray-500">Authorize selection results and view history of approved or rejected bids</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <CheckSquare size={16} />
          <span>Pending Approvals ({pendingApprovals.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <History size={16} />
          <span>Approval History ({historyApprovals.length})</span>
        </button>
      </div>

      {/* Tables container */}
      <div className="mt-4">
        {activeTab === 'pending' ? (
          <DataTable
            columns={pendingColumns}
            data={pendingApprovals}
            isLoading={isLoading}
            emptyMessage="No pending approvals found. Excellent job!"
          />
        ) : (
          <DataTable
            columns={historyColumns}
            data={historyApprovals}
            isLoading={isLoading}
            emptyMessage="No approval history records found."
          />
        )}
      </div>
    </div>
  );
}
