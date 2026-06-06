'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { quotationApi } from '@/lib/api/quotation.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const quotationSchema = z.object({
  rfq_id: z.string(),
  delivery_days: z.coerce.number().int().positive('Delivery timeline must be positive'),
  validity_date: z.string().min(1, 'Validity date is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    rfq_item_id: z.string(),
    product_name: z.string(),
    quantity: z.number(),
    unit_price: z.coerce.number().positive('Unit price must be positive'),
  })),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  rfq: {
    id: string;
    title: string;
    description: string;
    items: Array<{
      id: string;
      product_name: string;
      description: string;
      quantity: string | number;
      unit: string;
    }>;
  };
}

export default function QuotationForm({ rfq }: QuotationFormProps) {
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const defaultItems = rfq.items.map((item) => ({
    rfq_item_id: item.id,
    product_name: item.product_name,
    quantity: parseFloat(item.quantity.toString()) || 0,
    unit_price: 0,
  }));

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      rfq_id: rfq.id,
      delivery_days: 7,
      validity_date: '',
      notes: '',
      items: defaultItems,
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');

  useEffect(() => {
    let sub = 0;
    watchItems?.forEach((item: any) => {
      const qty = parseFloat(item.quantity?.toString()) || 0;
      const price = parseFloat(item.unit_price?.toString()) || 0;
      sub += qty * price;
    });
    const tax = sub * 0.18;
    const tot = sub + tax;

    setSubtotal(parseFloat(sub.toFixed(2)));
    setTaxAmount(parseFloat(tax.toFixed(2)));
    setTotalAmount(parseFloat(tot.toFixed(2)));
  }, [JSON.stringify(watchItems)]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await quotationApi.submit({
        ...data,
        subtotal,
        tax_rate: 18.00,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items: data.items.map((item: any) => ({
          rfq_item_id: item.rfq_item_id,
          unit_price: item.unit_price,
          quantity: item.quantity,
        }))
      });
      toast.success('Quotation submitted successfully!');
      router.push('/vendor/quotations');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Quotation Specs */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Submit Quotation for: {rfq.title}
          </h2>
          <p className="text-xs text-gray-500">{rfq.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_days">Delivery Timeline (Days)</Label>
              <Input id="delivery_days" type="number" {...register('delivery_days')} />
              {errors.delivery_days && <p className="text-xs text-red-500">{(errors.delivery_days as any).message?.toString()}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity_date">Bid Validity Date</Label>
              <Input id="validity_date" type="date" {...register('validity_date')} />
              {errors.validity_date && <p className="text-xs text-red-500">{(errors.validity_date as any).message?.toString()}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Special Instructions</Label>
            <Textarea id="notes" placeholder="e.g. Includes custom wrapping, warranty details..." className="min-h-[80px]" {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      {/* Item pricing list */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Item Pricing
          </h2>

          <div className="space-y-4">
            {fields.map((field: any, idx) => {
              const rfqItem = rfq.items.find((item) => item.id === field.rfq_item_id);
              const qty = field.quantity;
              const unit = rfqItem?.unit || 'pcs';
              const spec = rfqItem?.description || '';

              return (
                <div key={field.id} className="flex flex-col md:flex-row gap-4 items-center border border-gray-100 dark:border-gray-850 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-950/20">
                  <input type="hidden" {...register(`items.${idx}.rfq_item_id` as const)} />
                  <input type="hidden" {...register(`items.${idx}.product_name` as const)} />
                  <input type="hidden" {...register(`items.${idx}.quantity` as const)} />
                  <div className="flex-1 w-full space-y-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white block">{field.product_name}</span>
                    {spec && <span className="text-xs text-gray-500 block">Spec: {spec}</span>}
                    <span className="text-xs text-gray-400 block">Required Quantity: {qty} {unit}</span>
                  </div>
                  
                  <div className="w-full md:w-48 space-y-2">
                    <Label>Unit Price (INR)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...register(`items.${idx}.unit_price` as const)} 
                    />
                    {(errors.items as any)?.[idx]?.unit_price && (
                      <p className="text-xs text-red-500">{(errors.items as any)[idx].unit_price.message?.toString()}</p>
                    )}
                  </div>
                  
                  <div className="w-full md:w-32 text-right">
                    <span className="text-xs text-gray-400 block">Line Total</span>
                    <span className="font-semibold text-sm block">
                      INR {((qty * (parseFloat(watchItems?.[idx]?.unit_price?.toString()) || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Totals Summary card */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              INR {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">GST (18.00%):</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              INR {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-base border-t border-gray-100 dark:border-gray-800 pt-3">
            <span className="font-bold text-gray-900 dark:text-white">Total Proposed Amount:</span>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
              INR {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting Quotation...' : 'Submit Quotation Bid'}
      </Button>
    </form>
  );
}
