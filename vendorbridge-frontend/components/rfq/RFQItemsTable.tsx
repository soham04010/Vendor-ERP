import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RFQItem {
  id?: string;
  product_name: string;
  description: string;
  quantity: number | string;
  unit: string;
}

interface RFQItemsTableProps {
  items: RFQItem[];
}

export default function RFQItemsTable({ items }: RFQItemsTableProps) {
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product / Service</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-center">Unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-sm text-gray-500">
                No items added.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, idx) => (
              <TableRow key={item.id || idx}>
                <TableCell className="font-semibold text-gray-900 dark:text-white">
                  {item.product_name}
                </TableCell>
                <TableCell className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {item.description || '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {parseFloat(item.quantity.toString()).toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-center text-xs uppercase text-gray-500">
                  {item.unit || 'pcs'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
