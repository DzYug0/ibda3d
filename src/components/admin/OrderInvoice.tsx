
import React from 'react';
import { Order } from '@/hooks/useOrders';
import { format } from 'date-fns';

interface OrderInvoiceProps {
    order: Order;
}

export const OrderInvoice = React.forwardRef<HTMLDivElement, OrderInvoiceProps>(({ order }, ref) => {
    const parseNotes = (notes: string | null) => {
        if (!notes) return {};
        const extract = (key: string) => {
            const match = notes.match(new RegExp(`${key}:\\s*([^|]+)`));
            return match ? match[1].trim() : null;
        };
        return {
            name: extract('Name'),
            company: extract('Company'),
            phone: extract('Phone'),
            shipping: extract('Shipping'),
        };
    };

    const customerInfo = parseNotes(order.notes);

    return (
        <div ref={ref} className="p-8 bg-white text-black print:p-8" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b pb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">
                        Ibda3D
                    </h1>
                    <p className="text-sm text-gray-500">3D Printing Solutions</p>
                    <p className="text-sm text-gray-500">Algeria</p>
                    <p className="text-sm text-gray-500">contact@ibda3d.com</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                    <p className="text-gray-600 mt-2">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-gray-500 text-sm">{format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4">Bill To</h3>
                    <p className="font-bold text-gray-800">{customerInfo.name || 'Guest Customer'}</p>
                    {customerInfo.company && <p className="text-gray-600">{customerInfo.company}</p>}
                    <p className="text-gray-600">{order.shipping_address}</p>
                    <p className="text-gray-600">
                        {order.shipping_city}, {order.shipping_zip}
                    </p>
                    <p className="text-gray-600">{order.shipping_country}</p>
                    {customerInfo.phone && <p className="text-gray-600 mt-2">{customerInfo.phone}</p>}
                </div>
                <div className="text-right">
                    <h3 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4">Ship To</h3>
                    <p className="font-bold text-gray-800">{customerInfo.name || 'Guest Customer'}</p>
                    <p className="text-gray-600">{order.shipping_address}</p>
                    <p className="text-gray-600">
                        {order.shipping_city}, {order.shipping_zip}
                    </p>
                    <p className="text-gray-600">{order.shipping_country}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-gray-100">
                        <th className="text-left py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Item</th>
                        <th className="text-right py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Qty</th>
                        <th className="text-right py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Price</th>
                        <th className="text-right py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {order.items?.map((item, index) => (
                        <tr key={index}>
                            <td className="py-4">
                                <p className="font-semibold text-gray-800">{item.product_name}</p>
                                {/* We can add options here if available in item structure later */}
                            </td>
                            <td className="text-right py-4 text-gray-600">{item.quantity}</td>
                            <td className="text-right py-4 text-gray-600">{item.product_price.toFixed(0)} DA</td>
                            <td className="text-right py-4 text-gray-800 font-medium">
                                {(item.quantity * item.product_price).toFixed(0)} DA
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{order.total_amount.toFixed(0)} DA</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>0 DA</span> {/* Assuming shipping is included or free for now, can be adjusted */}
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-3">
                        <span>Total</span>
                        <span>{order.total_amount.toFixed(0)} DA</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-8 text-center">
                <h4 className="font-bold text-gray-800 mb-2">Thank you for your business!</h4>
                <p className="text-gray-500 text-sm">
                    If you have any questions about this invoice, please contact us at support@ibda3d.com
                </p>
            </div>
        </div>
    );
});

OrderInvoice.displayName = 'OrderInvoice';
