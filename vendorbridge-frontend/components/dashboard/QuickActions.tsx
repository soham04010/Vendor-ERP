import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, CheckSquare, UserPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  role: string;
}

export default function QuickActions({ role }: QuickActionsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-2">
        {role === 'admin' && (
          <>
            <Link href="/admin/users" passHref>
              <Button className="w-full justify-start gap-2" variant="outline">
                <UserPlus size={16} />
                <span>Invite / Create User</span>
              </Button>
            </Link>
            <Link href="/admin/vendors" passHref>
              <Button className="w-full justify-start gap-2" variant="outline">
                <PlusCircle size={16} />
                <span>Register New Vendor</span>
              </Button>
            </Link>
          </>
        )}

        {role === 'officer' && (
          <>
            <Link href="/officer/rfqs/create" passHref>
              <Button className="w-full justify-start gap-2" variant="default">
                <PlusCircle size={16} />
                <span>Create New RFQ</span>
              </Button>
            </Link>
            <Link href="/officer/rfqs" passHref>
              <Button className="w-full justify-start gap-2" variant="outline">
                <FileText size={16} />
                <span>Manage RFQs</span>
              </Button>
            </Link>
          </>
        )}

        {role === 'vendor' && (
          <>
            <Link href="/vendor/rfqs" passHref>
              <Button className="w-full justify-start gap-2" variant="default">
                <FileText size={16} />
                <span>View RFQ Invitations</span>
              </Button>
            </Link>
            <Link href="/vendor/quotations" passHref>
              <Button className="w-full justify-start gap-2" variant="outline">
                <FileText size={16} />
                <span>My Submitted Quotes</span>
              </Button>
            </Link>
          </>
        )}

        {role === 'manager' && (
          <>
            <Link href="/manager/approvals" passHref>
              <Button className="w-full justify-start gap-2" variant="default">
                <CheckSquare size={16} />
                <span>Pending Approvals</span>
              </Button>
            </Link>
            <Link href="/manager/reports" passHref>
              <Button className="w-full justify-start gap-2" variant="outline">
                <ShieldCheck size={16} />
                <span>View Spend Reports</span>
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
