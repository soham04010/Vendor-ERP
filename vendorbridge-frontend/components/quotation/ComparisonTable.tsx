import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Trophy } from "lucide-react";

interface QuotationItem {
  rfq_item_id: string;
  unit_price: string | number;
  total_price: string | number;
}

interface Quotation {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  vendor?: {
    name: string;
  };
  subtotal: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  delivery_days: number;
  notes?: string;
  is_selected: boolean;
  status: string;
  items: QuotationItem[];
}

interface RFQItem {
  id: string;
  product_name: string;
  quantity: string | number;
  unit: string;
}

interface ComparisonTableProps {
  rfqItems: RFQItem[];
  quotations: Quotation[];
  onSelectWinner?: (id: string) => void;
  disabled?: boolean;
}

export default function ComparisonTable({ 
  rfqItems, 
  quotations, 
  onSelectWinner, 
  disabled = false 
}: ComparisonTableProps) {
  
  if (quotations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500 rounded-xl">
        No quotations submitted for comparison yet.
      </div>
    );
  }

  // Find lowest price for each item row
  const lowestPriceMap: Record<string, number> = {};
  rfqItems.forEach((rfqItem) => {
    let minPrice = Infinity;
    quotations.forEach((quote) => {
      const itemPrice = quote.items.find(i => i.rfq_item_id === rfqItem.id);
      if (itemPrice) {
        const p = parseFloat(itemPrice.unit_price.toString()) || 0;
        if (p < minPrice && p > 0) {
          minPrice = p;
        }
      }
    });
    lowestPriceMap[rfqItem.id] = minPrice === Infinity ? 0 : minPrice;
  });

  // Find lowest total proposed cost
  const lowestTotalCost = Math.min(...quotations.map(q => parseFloat(q.total_amount.toString()) || 0));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-64 font-bold text-gray-900 dark:text-white">RFQ Line Items / Criteria</TableHead>
            {quotations.map((quote) => {
              const name = quote.vendor?.name || quote.vendor_name || 'Vendor';
              const isSelected = quote.status === 'selected' || quote.is_selected;
              return (
                <TableHead key={quote.id} className="text-center w-60">
                  <div className="space-y-1 py-2">
                    <span className="font-bold text-gray-950 dark:text-white block text-sm">{name}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
                        Selected Winner
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Item Rows */}
          {rfqItems.map((rfqItem) => (
            <TableRow key={rfqItem.id}>
              <TableCell className="font-medium text-gray-900 dark:text-white">
                <div>{rfqItem.product_name}</div>
                <div className="text-[10px] text-gray-400">Qty: {rfqItem.quantity} {rfqItem.unit}</div>
              </TableCell>
              {quotations.map((quote) => {
                const item = quote.items.find(i => i.rfq_item_id === rfqItem.id);
                if (!item) return <TableCell key={quote.id} className="text-center text-gray-300">-</TableCell>;

                const price = parseFloat(item.unit_price.toString()) || 0;
                const lineTotal = parseFloat(item.total_price?.toString() || (price * (parseFloat(rfqItem.quantity.toString()) || 0)).toString());
                const isLowest = price > 0 && price === lowestPriceMap[rfqItem.id];

                return (
                  <TableCell key={quote.id} className={`text-center transition-colors ${
                    isLowest 
                      ? 'bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold' 
                      : ''
                  }`}>
                    <div>INR {price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-gray-400">Total: INR {lineTotal.toLocaleString('en-IN')}</div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}

          {/* Subtotal */}
          <TableRow className="border-t-2 border-gray-200 dark:border-gray-800 bg-gray-50/20">
            <TableCell className="font-bold text-gray-900 dark:text-white">Subtotal</TableCell>
            {quotations.map((quote) => (
              <TableCell key={quote.id} className="text-center font-semibold text-gray-850 dark:text-gray-250">
                INR {parseFloat(quote.subtotal.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </TableCell>
            ))}
          </TableRow>

          {/* Tax (GST) */}
          <TableRow className="bg-gray-50/20">
            <TableCell className="font-medium text-gray-500">GST (18.00%)</TableCell>
            {quotations.map((quote) => (
              <TableCell key={quote.id} className="text-center text-gray-600 dark:text-gray-400 text-xs">
                INR {parseFloat(quote.tax_amount?.toString() || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </TableCell>
            ))}
          </TableRow>

          {/* Grand Total */}
          <TableRow className="bg-gray-100/30 dark:bg-gray-900/40">
            <TableCell className="font-bold text-gray-950 dark:text-white text-base">Grand Total</TableCell>
            {quotations.map((quote) => {
              const amount = parseFloat(quote.total_amount.toString()) || 0;
              const isLowest = amount === lowestTotalCost;
              return (
                <TableCell key={quote.id} className="text-center">
                  <div className={`text-base font-bold ${isLowest ? 'text-green-600 dark:text-green-400 flex items-center justify-center gap-1' : 'text-gray-900 dark:text-white'}`}>
                    {isLowest && <Trophy size={14} />}
                    <span>INR {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </TableCell>
              );
            })}
          </TableRow>

          {/* Delivery Period */}
          <TableRow className="bg-gray-50/20">
            <TableCell className="font-semibold text-gray-900 dark:text-white">Delivery Timeline</TableCell>
            {quotations.map((quote) => (
              <TableCell key={quote.id} className="text-center font-medium">
                {quote.delivery_days} Days
              </TableCell>
            ))}
          </TableRow>

          {/* Notes */}
          <TableRow className="bg-gray-50/20">
            <TableCell className="font-medium text-gray-500">Remarks / Notes</TableCell>
            {quotations.map((quote) => (
              <TableCell key={quote.id} className="text-center text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate" title={quote.notes}>
                {quote.notes || 'No notes.'}
              </TableCell>
            ))}
          </TableRow>

          {/* Winner Selection Actions */}
          {!disabled && (
            <TableRow>
              <TableCell className="font-bold text-gray-900 dark:text-white">Action</TableCell>
              {quotations.map((quote) => {
                const isSelected = quote.status === 'selected' || quote.is_selected;
                return (
                  <TableCell key={quote.id} className="text-center py-4">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-bold dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full">
                        <Check size={14} /> Selected Winner
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onSelectWinner?.(quote.id)}
                        className="text-xs"
                        variant={quote.total_amount === lowestTotalCost ? "default" : "outline"}
                      >
                        Select as Winner
                      </Button>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
