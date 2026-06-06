'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/api/vendor.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';
import { Loader2, PlusCircle, Edit, ToggleLeft, ToggleRight, XCircle } from 'lucide-react';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    gst_number: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
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

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const res = await vendorApi.getAll();
      setVendors(res.vendors || res || []);
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (vendor: any) => {
    setEditingVendorId(vendor.id);
    setFormData({
      name: vendor.name || '',
      email: vendor.email || '',
      category: vendor.category || '',
      gst_number: vendor.gst_number || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      pincode: vendor.pincode || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingVendorId(null);
    setFormData({
      name: '',
      email: '',
      category: '',
      gst_number: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingVendorId) {
        await vendorApi.update(editingVendorId, formData);
        toast.success('Vendor profile updated successfully!');
      } else {
        await vendorApi.create(formData);
        toast.success('Vendor registered successfully!');
      }
      handleCancelEdit();
      loadVendors();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save vendor details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = (vendor: any) => {
    const nextStatus = vendor.status === 'active' ? 'inactive' : 'active';
    setConfirmDialog({
      isOpen: true,
      title: `Confirm Status Shift`,
      description: `Are you sure you want to change the status of ${vendor.name} to ${nextStatus.toUpperCase()}?`,
      onConfirm: async () => {
        try {
          await vendorApi.updateStatus(vendor.id, nextStatus);
          toast.success(`Vendor is now ${nextStatus}`);
          loadVendors();
        } catch (err) {
          toast.error('Failed to update status');
        }
      },
    });
  };

  const columns = [
    {
      header: 'Vendor Details',
      accessor: (row: any) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{row.name}</p>
          <span className="text-[10px] text-gray-400 block">GSTIN: {row.gst_number || 'N/A'}</span>
          <span className="text-[10px] text-blue-600 font-medium uppercase">{row.category || 'General'}</span>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: (row: any) => (
        <div className="text-xs space-y-0.5">
          <p className="text-gray-900 dark:text-white">{row.email}</p>
          <p className="text-gray-500">{row.phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (row: any) => (
        <span className="text-xs">
          {[row.city, row.state].filter(Boolean).join(', ') || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Rating',
      accessor: (row: any) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200/50">
          ★ {row.rating || '0.00'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            title="Edit Profile"
            onClick={() => handleEditClick(row)}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <Edit size={15} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={row.status === 'active' ? 'Deactivate Vendor' : 'Activate Vendor'}
            onClick={() => toggleStatus(row)}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            {row.status === 'active' ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
          </Button>
        </div>
      ),
      className: "w-24 text-right"
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Vendor Directory</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Add, edit, or adjust statuses of vendors certified to place bids in procurement processes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Card */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-fit">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-500" />
              <span>{editingVendorId ? 'Edit Vendor Details' : 'Register New Vendor'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g. IT Services" value={formData.category} onChange={handleInputChange} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input id="gst_number" name="gst_number" placeholder="15-digit GSTIN" value={formData.gst_number} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="e.g. +91 99999 99999" value={formData.phone} onChange={handleInputChange} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
              </div>

              <div className="flex gap-2 pt-2">
                {editingVendorId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-1/2 text-xs gap-1.5">
                    <XCircle size={14} />
                    <span>Cancel</span>
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className={`text-xs ${editingVendorId ? 'w-1/2' : 'w-full'}`}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : (editingVendorId ? 'Update' : 'Register')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: DataTable */}
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={vendors}
            isLoading={isLoading}
            emptyMessage="No vendors currently registered."
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
