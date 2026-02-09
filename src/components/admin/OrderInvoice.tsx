import React from 'react';
import { format } from 'date-fns';
import logo from '@/assets/logo.png';

interface OrderInvoiceProps {
    order: any;
}

export const OrderInvoice = React.forwardRef<HTMLDivElement, OrderInvoiceProps>(
    ({ order }, ref) => {
        // Basic note parsing to get customer details
        const parseNotes = (notes: string | null) => {
            if (!notes) return { name: null, phone: null, address: null, company: null };
            const extract = (key: string) => {
                const match = notes.match(new RegExp(`${key}:\\s*([^|]+)`));
                return match ? match[1].trim() : null;
            };
            return {
                name: extract('Name'),
                phone: extract('Phone'),
                address: extract('Address') || order.shipping_address,
                company: extract('Company'),
            };
        };

        const customer = parseNotes(order.notes);

        return (
            <div ref={ref} className="p-8 bg-white text-black min-h-[1000px] w-full max-w-[800px] mx-auto print:mx-0 print:w-full print:max-w-none print:min-h-0">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div className="flex items-center gap-4">
                        {/* Logo placeholder if image fails */}
                        <div className="h-16 w-auto flex items-center justify-center">
                            <img src={logo} alt="Ibda3D Logo" className="h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <span className="text-2xl font-bold ml-2">Ibda3D</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                        <p className="text-sm text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-gray-500">{format(new Date(order.created_at), 'PPP')}</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Bill To</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                            <p className="font-bold text-lg text-gray-900">{customer.name || 'Valued Customer'}</p>
                            {customer.company && <p>{customer.company}</p>}
                            <p>{customer.address || order.shipping_address || 'No address provided'}</p>
                            <p>{order.shipping_city} {order.shipping_zip && `, ${order.shipping_zip}`}</p>
                            <p>{order.shipping_country}</p>
                            <p className="mt-2 text-gray-500">{customer.phone}</p>
                        </div>
                    </div>
                    <div>
                        {/* Can add From details here if needed */}
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">From</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                            <p className="font-bold text-gray-900">Ibda3D Store</p>
                            <p>123 3D Print Street</p>
                            <p>Algiers, Algeria</p>
                            <p>contact@ibda3d.com</p>
                            <p>+213 555 123 456</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="text-left py-4 font-semibold text-gray-600">Item Description</th>
                                <th className="text-center py-4 font-semibold text-gray-600 w-24">Qty</th>
                                <th className="text-right py-4 font-semibold text-gray-600 w-32">Price</th>
                                <th className="text-right py-4 font-semibold text-gray-600 w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.items?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4">
                                        <p className="font-medium text-gray-900">{item.product_name}</p>
                                        {(item.selected_color || item.selected_version || (item.selected_options && Object.keys(item.selected_options).length > 0)) && (
                                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                {item.selected_color && <div>Color: {item.selected_color} </div>}
                                                {item.selected_version && <div>Version: {item.selected_version}</div>}
                                                {item.selected_options && Object.entries(item.selected_options).map(([key, value]) => (
                                                    <div key={key}>{key}: {String(value)}</div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-center py-4 text-gray-600">{item.quantity}</td>
                                    <td className="text-right py-4 text-gray-600">
                                        {Number(item.product_price).toLocaleString()} DA
                                    </td>
                                    <td className="text-right py-4 font-medium text-gray-900">
                                        {(item.quantity * Number(item.product_price)).toLocaleString()} DA
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end border-t border-gray-100 pt-8">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>{order.total_amount.toLocaleString()} DA</span>
                        </div>
                        {/* Add tax/shipping logic if available in order object */}
                        <div className="flex justify-between py-3 border-t border-gray-100 mt-3">
                            <span className="font-bold text-lg text-gray-900">Total</span>
                            <span className="font-bold text-lg text-primary">{order.total_amount.toLocaleString()} DA</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">For any inquiries, please contact support@ibda3d.com</p>
                </div>
            </div>
        );
    }
);

OrderInvoice.displayName = 'OrderInvoice';
