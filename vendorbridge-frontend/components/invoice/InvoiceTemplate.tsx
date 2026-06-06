import StatusBadge from '../shared/StatusBadge';

interface InvoiceItem {
  id: string;
  product_name: string;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
}

interface InvoiceTemplateProps {
  invoice: {
    invoice_number: string;
    subtotal: string | number;
    tax_rate: string | number;
    tax_amount: string | number;
    total_amount: string | number;
    due_date: string;
    status: string;
    created_at: string;
  };
  po: {
    po_number: string;
  };
  vendor: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    gst_number?: string;
  };
  items: InvoiceItem[];
}

export default function InvoiceTemplate({ invoice, po, vendor, items }: InvoiceTemplateProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto printable-area">
      {/* Brand & Status Header */}
      <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">VendorBridge ERP</h2>
          <p className="text-xs text-gray-500 mt-1">123 Corporate Office, Procurement Division</p>
          <p className="text-xs text-gray-500">New Delhi, India</p>
        </div>
        <div className="text-right space-y-2">
          <span className="inline-block"><StatusBadge status={invoice.status} /></span>
          <h3 className="text-lg font-bold text-gray-950 dark:text-white block">{invoice.invoice_number}</h3>
          <p className="text-[10px] text-gray-400">Date Generated: {new Date(invoice.created_at).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Bill To & Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-150 dark:border-gray-800">
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-gray-950 dark:text-white text-sm">Billed To:</h4>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{vendor.name}</p>
          {vendor.gst_number && <p className="text-gray-500">GSTIN: {vendor.gst_number}</p>}
          <p className="text-gray-500">Email: {vendor.email}</p>
          <p className="text-gray-500">Phone: {vendor.phone || 'N/A'}</p>
          <p className="text-gray-500 max-w-xs leading-normal">Address: {vendor.address || 'N/A'}</p>
        </div>
        <div className="space-y-1 text-xs md:text-right">
          <h4 className="font-bold text-gray-950 dark:text-white text-sm">Reference Detail:</h4>
          <p className="text-gray-600 dark:text-gray-300">Purchase Order: <span className="font-semibold">{po.po_number}</span></p>
          <p className="text-gray-600 dark:text-gray-300">Payment Due: <span className="font-semibold">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span></p>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500">
              <th className="py-2.5 font-semibold">Item / Product Name</th>
              <th className="py-2.5 text-right font-semibold">Quantity</th>
              <th className="py-2.5 text-right font-semibold">Unit Price</th>
              <th className="py-2.5 text-right font-semibold">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 font-semibold text-gray-900 dark:text-white">{item.product_name}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">INR {parseFloat(item.unit_price.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="py-3 text-right font-semibold">INR {parseFloat(item.total_price.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="w-72 space-y-2.5 text-xs text-right">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              INR {parseFloat(invoice.subtotal.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax Rate:</span>
            <span>{invoice.tax_rate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax Amount:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              INR {parseFloat(invoice.tax_amount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-100 dark:border-gray-850 pt-2.5 text-sm">
            <span className="font-bold text-gray-950 dark:text-white">Grand Total:</span>
            <span className="font-black text-blue-600 dark:text-blue-400">
              INR {parseFloat(invoice.total_amount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Terms Footer */}
      <div className="text-center pt-12 text-[10px] text-gray-400 border-t border-gray-50 dark:border-gray-800/40">
        This is an automatically generated electronic invoice. No signature is required.
      </div>
    </div>
  );
}
