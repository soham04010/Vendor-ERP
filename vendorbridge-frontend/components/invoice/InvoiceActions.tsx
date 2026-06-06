'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Mail, CheckCircle2, Ban, Loader2 } from 'lucide-react';
import { invoiceApi } from '@/lib/api/invoice.api';
import { toast } from 'sonner';

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceStatus: string;
  userRole: string;
  onStatusUpdated?: () => void;
}

export default function InvoiceActions({ 
  invoiceId, 
  invoiceStatus, 
  userRole, 
  onStatusUpdated 
}: InvoiceActionsProps) {
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Open in new tab or trigger download directly
    const url = invoiceApi.downloadPdfUrl(invoiceId);
    window.open(url, '_blank');
  };

  const handleSendEmail = async () => {
    setIsSendingMail(true);
    try {
      await invoiceApi.sendEmail(invoiceId);
      toast.success('Invoice email with PDF sent to vendor successfully!');
    } catch (err: any) {
      toast.error('Failed to send invoice email');
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setIsUpdatingStatus(true);
    try {
      await invoiceApi.updateStatus(invoiceId, status);
      toast.success(`Invoice marked as ${status}`);
      onStatusUpdated?.();
    } catch (err: any) {
      toast.error('Failed to update invoice status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-center justify-between no-print">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer size={15} />
          <span>Print / Save HTML</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-2">
          <Download size={15} />
          <span>Download PDF</span>
        </Button>
      </div>

      <div className="flex gap-2">
        {userRole === 'officer' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendEmail} 
            disabled={isSendingMail}
            className="gap-2"
          >
            {isSendingMail ? <Loader2 className="animate-spin" size={14} /> : <Mail size={15} />}
            <span>Email PDF to Vendor</span>
          </Button>
        )}

        {(userRole === 'officer' || userRole === 'admin') && invoiceStatus !== 'paid' && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleStatusChange('paid')} 
            disabled={isUpdatingStatus}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 size={15} />
            <span>Mark as Paid</span>
          </Button>
        )}

        {(userRole === 'officer' || userRole === 'admin') && invoiceStatus !== 'void' && invoiceStatus !== 'paid' && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleStatusChange('void')} 
            disabled={isUpdatingStatus}
            className="gap-2"
          >
            <Ban size={15} />
            <span>Void Invoice</span>
          </Button>
        )}
      </div>
    </div>
  );
}
