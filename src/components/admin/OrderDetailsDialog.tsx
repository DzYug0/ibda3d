
import { useRef } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Order, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderInvoice } from "./OrderInvoice";

interface OrderDetailsDialogProps {
    order: Order;
    trigger?: React.ReactNode;
}

export function OrderDetailsDialog({ order, trigger }: OrderDetailsDialogProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const updateStatus = useUpdateOrderStatus();

    const handleDownloadPdf = () => {
        const element = componentRef.current;
        const opt = {
            margin: 0,
            filename: `Invoice-${order.id}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handleStatusUpdate = (status: Order['status']) => {
        updateStatus.mutate({ orderId: order.id, status });
    };

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
            email: extract('Email'), // Assuming email might be in notes or we add it later
            shipping: extract('Shipping'),
        };
    };

    const info = parseNotes(order.notes);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">View Details</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b pb-4">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            Order #{order.id.slice(0, 8)}
                            <Badge variant="outline" className="text-base font-normal">
                                {formatStatus(order.status)}
                            </Badge>
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button onClick={handleDownloadPdf} variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Invoice
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Details */}
                        <div className="space-y-6">
                            <Section title="Customer Information">
                                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{info.name || 'N/A'}</span>
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium">{info.phone || 'N/A'}</span>
                                    {info.company && (
                                        <>
                                            <span className="text-muted-foreground">Company:</span>
                                            <span className="font-medium">{info.company}</span>
                                        </>
                                    )}
                                </div>
                            </Section>

                            <Section title="Shipping Address">
                                <p className="text-sm leading-relaxed">
                                    {order.shipping_address}<br />
                                    {order.shipping_city}, {order.shipping_zip}<br />
                                    {order.shipping_country}
                                </p>
                                {info.shipping && (
                                    <p className="text-xs text-muted-foreground mt-2">Method: {info.shipping}</p>
                                )}
                            </Section>

                            <Section title="Order Items">
                                <div className="space-y-3">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm border-b pb-2 last:border-0">
                                            <div>
                                                <p className="font-medium">{item.product_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Qty: {item.quantity} × {item.product_price} DA
                                                </p>
                                                {(item.selected_color || item.selected_version) && (
                                                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                        {item.selected_color && (
                                                            <span className="flex items-center gap-1">
                                                                Color: <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.selected_color }} />
                                                            </span>
                                                        )}
                                                        {item.selected_version && (
                                                            <span>Version: {item.selected_version}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="font-medium">
                                                {(item.quantity * item.product_price).toFixed(0)} DA
                                            </p>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold pt-2 text-base border-t">
                                        <span>Total</span>
                                        <span>{order.total_amount.toFixed(0)} DA</span>
                                    </div>
                                </div>
                            </Section>
                        </div>

                        {/* Right Column: Actions */}
                        <div className="space-y-6">
                            <div className="bg-muted/30 p-4 rounded-lg border">
                                <h3 className="font-semibold mb-4">Update Status</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatusButton
                                        current={order.status}
                                        target="pending"
                                        icon={Clock}
                                        label="Pending"
                                        onClick={() => handleStatusUpdate('pending')}
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="confirmed"
                                        icon={CheckCircle}
                                        label="Confirmed"
                                        onClick={() => handleStatusUpdate('confirmed')}
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="processing"
                                        icon={Package}
                                        label="Processing"
                                        onClick={() => handleStatusUpdate('processing')}
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="shipped"
                                        icon={Truck}
                                        label="Shipped"
                                        onClick={() => handleStatusUpdate('shipped')}
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="delivered"
                                        icon={CheckCircle}
                                        label="Delivered"
                                        onClick={() => handleStatusUpdate('delivered')}
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="cancelled"
                                        icon={XCircle}
                                        label="Cancelled"
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        variant="destructive"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Hidden Invoice for Printing */}
                <div className="hidden">
                    <OrderInvoice ref={componentRef} order={order} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>
            {children}
        </div>
    );
}

function StatusButton({ current, target, icon: Icon, label, onClick, variant = 'outline' }: any) {
    const isActive = current === target;
    return (
        <Button
            variant={isActive ? 'default' : variant}
            className={`justify-start ${isActive ? '' : 'text-muted-foreground'}`}
            onClick={onClick}
            disabled={isActive}
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    )
}

function formatStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}
