'use client';

import { useEffect, useState } from 'react';
import { quotationApi } from '@/lib/api/quotation.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, BarChart3, Eye, Calendar, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function OfficerQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog confirmation states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {}
  });

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const res = await quotationApi.getAll();
      const data = res.quotations || res || [];
      setQuotations(data);
      applyFilter(data, filterStatus);
    } catch (err) {
      console.error('Error loading quotations:', err);
      toast.error('Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const applyFilter = (data: any[], status: string) => {
    if (status === 'all') {
      setFilteredQuotations(data);
    } else {
      setFilteredQuotations(data.filter((q: any) => q.status === status));
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    applyFilter(quotations, status);
  };



  const stats = {
    total: quotations.length,
    submitted: quotations.filter(q => q.status === 'submitted').length,
    selected: quotations.filter(q => q.status === 'selected').length,
    rejected: quotations.filter(q => q.status === 'rejected').length
  };

  const columns = [
    {
      header: 'RFQ Details',
      accessor: (row: any) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-xs">{row.rfq_number}</p>
          <span className="text-[10px] text-gray-400 block max-w-[150px] truncate">{row.rfq_title}</span>
        </div>
      )
    },
    {
      header: 'Vendor Name',
      accessor: (row: any) => (
        <span className="font-medium text-gray-900 dark:text-white text-xs">{row.vendor_name}</span>
      )
    },
    {
      header: 'Bid Details',
      accessor: (row: any) => (
        <div className="text-xs">
          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(row.total_amount)}</p>
          <span className="text-[10px] text-gray-400 block">GST Included: 18%</span>
        </div>
      )
    },
    {
      header: 'Delivery & Validity',
      accessor: (row: any) => (
        <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-0.5">
          <p className="flex items-center gap-1">
            <Clock size={11} className="text-gray-400" />
            <span>{row.delivery_days} days delivery</span>
          </p>
          <p className="flex items-center gap-1">
            <Calendar size={11} className="text-gray-400" />
            <span>Valid till: {row.validity_date ? formatDate(row.validity_date) : 'N/A'}</span>
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Submitted At',
      accessor: (row: any) => (
        <span className="text-[11px] text-gray-500">{formatDate(row.submitted_at)}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/officer/quotations/${row.rfq_id}/compare`}>
            <Button size="xs" variant="outline" title="Compare Bids" className="gap-1 text-[10px] h-7">
              <BarChart3 size={11} />
              <span>Compare</span>
            </Button>
          </Link>
          

        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Vendor Quotations</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review vendor responses for RFQs, compare bid totals, and submit RFQs for Manager Approval.
        </p>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Bids</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Eye size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Awaiting Review</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.submitted}</h3>
            </div>
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <Clock size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Selected Winners</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.selected}</h3>
            </div>
            <div className="p-2.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-lg">
              <CheckCircle2 size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Rejected</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.rejected}</h3>
            </div>
            <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
              <XCircle size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Container */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-4 border-b border-gray-150 dark:border-gray-800">
          <CardTitle className="text-sm font-bold">Quotations List</CardTitle>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'submitted', 'selected', 'rejected'].map((status) => (
              <Button
                key={status}
                onClick={() => handleFilterChange(status)}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="xs"
                className="text-[10px] capitalize h-7"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredQuotations}
            isLoading={isLoading}
            emptyMessage="No quotations found matching the filter."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialogState.action}
        title={dialogState.title}
        description={dialogState.description}
      />
    </div>
  );
}
