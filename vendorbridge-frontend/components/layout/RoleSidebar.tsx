'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  BarChart3, 
  FileText, 
  ClipboardList, 
  CheckSquare, 
  FileSpreadsheet, 
  Bell, 
  Settings,
  History
} from 'lucide-react';

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function RoleSidebar() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  if (!user) return null;

  const adminLinks: SidebarLink[] = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Users', href: '/admin/users', icon: <Users size={18} /> },
    { name: 'Vendors', href: '/admin/vendors', icon: <Store size={18} /> },
    { name: 'Analytics & Reports', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
  ];

  const officerLinks: SidebarLink[] = [
    { name: 'Dashboard', href: '/officer', icon: <LayoutDashboard size={18} /> },
    { name: 'RFQ Management', href: '/officer/rfqs', icon: <ClipboardList size={18} /> },
    { name: 'Quotations', href: '/officer/quotations', icon: <FileSpreadsheet size={18} /> },
    { name: 'Purchase Orders', href: '/officer/purchase-orders', icon: <FileText size={18} /> },
    { name: 'Invoices', href: '/officer/invoices', icon: <FileText size={18} /> },
  ];

  const vendorLinks: SidebarLink[] = [
    { name: 'Dashboard', href: '/vendor', icon: <LayoutDashboard size={18} /> },
    { name: 'RFQ Invitations', href: '/vendor/rfqs', icon: <ClipboardList size={18} /> },
    { name: 'My Quotations', href: '/vendor/quotations', icon: <FileSpreadsheet size={18} /> },
    { name: 'Purchase Orders', href: '/vendor/purchase-orders', icon: <FileText size={18} /> },
    { name: 'Invoices', href: '/vendor/invoices', icon: <FileText size={18} /> },
  ];

  const managerLinks: SidebarLink[] = [
    { name: 'Dashboard', href: '/manager', icon: <LayoutDashboard size={18} /> },
    { name: 'Pending Approvals', href: '/manager/approvals', icon: <CheckSquare size={18} /> },
    { name: 'Reports & Analytics', href: '/manager/reports', icon: <BarChart3 size={18} /> },
  ];

  const getLinks = (): SidebarLink[] => {
    switch (user.role) {
      case 'admin':
        return adminLinks;
      case 'officer':
        return officerLinks;
      case 'vendor':
        return vendorLinks;
      case 'manager':
        return managerLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <nav className="space-y-1 px-2 py-4">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
