'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth.api';
import { vendorApi } from '@/lib/api/vendor.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';
import { Loader2, PlusCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'officer',
    vendor_id: '',
  });

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, vendorsRes] = await Promise.all([
        authApi.getUsers(),
        vendorApi.getAll(),
      ]);
      setUsers(usersRes || []);
      setVendors(vendorsRes.vendors || vendorsRes || []);
    } catch (err) {
      toast.error('Failed to retrieve user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'vendor' && formData.vendor_id) {
        payload.vendor_id = formData.vendor_id;
      }

      await authApi.createUser(payload);
      toast.success('User account created successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'officer',
        vendor_id: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = (user: any) => {
    const newStatus = !user.is_active;
    setConfirmDialog({
      isOpen: true,
      title: `${newStatus ? 'Activate' : 'Deactivate'} User?`,
      description: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} account access for ${user.name}?`,
      onConfirm: async () => {
        try {
          await authApi.updateUser(user.id, { is_active: newStatus });
          toast.success(`User access has been updated successfully`);
          loadData();
        } catch (err) {
          toast.error('Failed to change user access status');
        }
      },
    });
  };

  const handleDeleteUser = (user: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User Account?',
      description: `Are you sure you want to permanently delete the account for ${user.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await authApi.deleteUser(user.id);
          toast.success(`User account has been deleted`);
          loadData();
        } catch (err) {
          toast.error('Failed to delete user account');
        }
      },
    });
  };

  const columns = [
    {
      header: 'Full Name',
      accessor: (row: any) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{row.name}</p>
          <span className="text-[10px] text-gray-400">ID: {row.id.substring(0, 8)}...</span>
        </div>
      ),
    },
    {
      header: 'Email Address',
      accessor: (row: any) => <span className="text-xs">{row.email}</span>,
    },
    {
      header: 'Assigned Role',
      accessor: (row: any) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          row.role === 'admin' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
          row.role === 'manager' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
          row.role === 'officer' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
          'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Vendor Affiliation',
      accessor: (row: any) => {
        if (row.role !== 'vendor') return <span className="text-gray-400">-</span>;
        const vendor = vendors.find((v) => v.id === row.vendor_id);
        return <span className="text-xs font-medium">{vendor?.name || 'Unassigned'}</span>;
      },
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            title={row.is_active ? 'Deactivate User' : 'Activate User'}
            onClick={() => toggleUserStatus(row)}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            {row.is_active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Delete Account"
            onClick={() => handleDeleteUser(row)}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
      className: "w-24 text-right"
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">User Administration</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage system access levels, create accounts, and toggle user active statuses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-fit">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-500" />
              <span>Create / Invite User</span>
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. john@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Initial Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="admin">Administrator</option>
                  <option value="officer">Procurement Officer</option>
                  <option value="manager">Approving Manager</option>
                  <option value="vendor">Vendor Representative</option>
                </select>
              </div>

              {formData.role === 'vendor' && (
                <div className="space-y-1.5">
                  <Label htmlFor="vendor_id">Associate Vendor Org</Label>
                  <select
                    id="vendor_id"
                    name="vendor_id"
                    value={formData.vendor_id}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Vendor Organization --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category || 'No Category'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full text-xs">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-1.5" size={14} />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create User Account</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: User Directory */}
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage="No platform users found."
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
      />
    </div>
  );
}
