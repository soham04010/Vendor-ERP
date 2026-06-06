'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { vendorApi } from '@/lib/api/vendor.api';
import { rfqApi } from '@/lib/api/rfq.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Loader2 } from 'lucide-react';

const rfqSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Deadline date is required'),
  items: z.array(z.object({
    product_name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    quantity: z.coerce.number().positive('Quantity must be positive'),
    unit: z.string().default('pcs'),
  })).min(1, 'At least one item is required'),
  vendor_ids: z.array(z.string()).min(1, 'Please select at least one vendor'),
});

type RFQFormValues = z.infer<typeof rfqSchema>;

export default function RFQForm() {
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      items: [{ product_name: '', description: '', quantity: 1, unit: 'pcs' }],
      vendor_ids: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await vendorApi.getAll();
        setVendorsList(res.vendors || res || []);
      } catch (err) {
        toast.error('Failed to load vendors');
      } finally {
        setIsLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  const selectedVendorIds = watch('vendor_ids') || [];

  const handleVendorToggle = (vendorId: string, checked: boolean) => {
    if (checked) {
      setValue('vendor_ids', [...selectedVendorIds, vendorId]);
    } else {
      setValue('vendor_ids', selectedVendorIds.filter((id) => id !== vendorId));
    }
  };

  const onSubmit = async (data: RFQFormValues) => {
    setIsSubmitting(true);
    try {
      // Create published or draft RFQ
      await rfqApi.create({
        ...data,
        deadline: new Date(data.deadline).toISOString()
      });
      toast.success('RFQ created successfully!');
      router.push('/officer/rfqs');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* General Details */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            RFQ General Details
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title">RFQ Title</Label>
            <Input id="title" placeholder="e.g. Office Supplies Q1 2025" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Submission Deadline</Label>
              <Input id="deadline" type="datetime-local" {...register('deadline')} />
              {errors.deadline && <p className="text-xs text-red-500">{errors.deadline.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Requirements Summary</Label>
            <Textarea id="description" placeholder="Describe scope, technical specs, etc." className="min-h-[80px]" {...register('description')} />
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Line Items */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Line Items</h2>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-1 text-xs" 
              onClick={() => append({ product_name: '', description: '', quantity: 1, unit: 'pcs' })}
            >
              <Plus size={14} />
              <span>Add Item</span>
            </Button>
          </div>

          {errors.items && <p className="text-xs text-red-500">{errors.items.message}</p>}

          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-3 items-start border border-gray-100 dark:border-gray-850 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-950/20">
                <div className="flex-1 space-y-2 w-full">
                  <Label>Product Name</Label>
                  <Input placeholder="e.g. A4 Paper Ream" {...register(`items.${idx}.product_name` as const)} />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <Label>Specification</Label>
                  <Input placeholder="e.g. 80 GSM, White" {...register(`items.${idx}.description` as const)} />
                </div>
                <div className="w-full md:w-32 space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" {...register(`items.${idx}.quantity` as const)} />
                </div>
                <div className="w-full md:w-24 space-y-2">
                  <Label>Unit</Label>
                  <Input placeholder="pcs" {...register(`items.${idx}.unit` as const)} />
                </div>
                {fields.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="self-end text-red-500 hover:text-red-700 hover:bg-red-50" 
                    onClick={() => remove(idx)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Assignment */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Assign Invitees / Vendors
          </h2>
          {errors.vendor_ids && <p className="text-xs text-red-500">{errors.vendor_ids.message}</p>}

          {isLoadingVendors ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="animate-spin text-blue-500" size={20} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
              {vendorsList.map((vendor) => (
                <div 
                  key={vendor.id} 
                  className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/20"
                >
                  <Checkbox 
                    id={`vendor-${vendor.id}`} 
                    checked={selectedVendorIds.includes(vendor.id)}
                    onCheckedChange={(checked) => handleVendorToggle(vendor.id, !!checked)}
                  />
                  <label htmlFor={`vendor-${vendor.id}`} className="text-xs cursor-pointer select-none">
                    <span className="font-semibold text-gray-950 dark:text-white block">{vendor.name}</span>
                    <span className="text-gray-500 block">{vendor.category} · Rating: {vendor.rating}</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating RFQ...' : 'Create & Publish RFQ'}
      </Button>
    </form>
  );
}
