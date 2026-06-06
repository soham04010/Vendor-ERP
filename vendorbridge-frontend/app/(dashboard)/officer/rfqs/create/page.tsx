'use client';

import RFQForm from '@/components/rfq/RFQForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateRFQPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <Link href="/officer/rfqs" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Request For Quotation</h2>
          <p className="text-xs text-gray-500">Publish a new bid request to matching vendors</p>
        </div>
      </div>

      <RFQForm />
    </div>
  );
}
