
import { useRef, useState } from 'react';
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
import { Download, Package, Truck, CheckCircle, XCircle, Clock, FileText, Eye, User, MapPin, CreditCard, Calendar } from "lucide-react";
import { Order, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderInvoice } from "./OrderInvoice";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface OrderDetailsDialogProps {
    order: Order;
    trigger?: React.ReactNode;
}

export function OrderDetailsDialog({ order, trigger }: OrderDetailsDialogProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const updateStatus = useUpdateOrderStatus();
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

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
            email: extract('Email'),
            shipping: extract('Shipping'),
        };
    };

    const info = parseNotes(order.notes);

    // Calculate generic stats
    const shippingCost = info.shipping ? parseInt(info.shipping.replace(/\D/g, '')) || 0 : 0;

    // Calculate accurate subtotal from items
    const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.quantity * item.product_price), 0) || order.total_amount;

    // If order.total_amount matches itemsSubtotal, it means it doesn't include shipping
    // If order.total_amount > itemsSubtotal, it might already include shipping
    const isTotalInclusive = Math.abs(order.total_amount - (itemsSubtotal + shippingCost)) < 1;

    // Final calculations
    const displaySubtotal = itemsSubtotal;
    const displayTotal = itemsSubtotal + shippingCost;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">View Details</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background/80 backdrop-blur-xl border-border/50">
                <DialogHeader className="p-6 border-b border-border/50 pb-4 bg-muted/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                Order #{order.id.slice(0, 8)}
                                <Badge variant="outline" className={`text-base font-normal px-3 py-0.5 ${getStatusColor(order.status)}`}>
                                    {formatStatus(order.status)}
                                </Badge>
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(order.created_at), 'PPP p')}
                            </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2 flex-1 sm:flex-none shadow-sm hover:bg-primary/5">
                                        <Eye className="h-4 w-4" />
                                        View Invoice
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
                                    <ScrollArea className="h-full">
                                        <div className="p-8 flex justify-center bg-gray-100 min-h-full">
                                            <OrderInvoice order={order} />
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>

                            <Button onClick={handleDownloadPdf} className="gap-2 flex-1 sm:flex-none shadow-md hover:shadow-lg transition-all">
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 bg-muted/5">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column: Order Items & Totals */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Order Items */}
                            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wider">Order Items</h3>
                                </div>
                                <div className="divide-y divide-border/50">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="p-4 flex gap-4 hover:bg-muted/10 transition-colors">
                                            <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/50">
                                                {/* Placeholder for product image if available in item, otherwise generic icon */}
                                                <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                                                    <Package className="h-8 w-8 opacity-20" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-foreground truncate">{item.product_name}</p>
                                                        {(item.selected_color || item.selected_version || (item.selected_options && Object.keys(item.selected_options).length > 0)) && (
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {item.selected_color && (
                                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted/50">
                                                                        <span className="w-2 h-2 rounded-full mr-1.5 border" style={{ backgroundColor: item.selected_color }} />
                                                                        Color
                                                                    </Badge>
                                                                )}
                                                                {item.selected_version && (
                                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted/50">
                                                                        {item.selected_version}
                                                                    </Badge>
                                                                )}
                                                                {item.selected_options && Object.entries(item.selected_options).map(([key, value]) => (
                                                                    <Badge key={key} variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted/50">
                                                                        {key}: {String(value)}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold">
                                                        {(item.quantity * item.product_price).toLocaleString()} DA
                                                    </p>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {item.quantity} × {item.product_price.toLocaleString()} DA
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-sm p-6 ml-auto max-w-sm">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{displaySubtotal.toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Shipping</span>
                                        <span>{shippingCost > 0 ? `${shippingCost.toLocaleString()} DA` : 'Free'}</span>
                                    </div>
                                    <Separator className="bg-border/50 my-2" />
                                    <div className="flex justify-between font-bold text-lg text-foreground">
                                        <span>Total</span>
                                        <span>{displayTotal.toLocaleString()} DA</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Customer Info & Actions */}
                        <div className="space-y-6">
                            {/* Update Status */}
                            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wider">Update Status</h3>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-2">
                                    <StatusButton
                                        current={order.status}
                                        target="pending"
                                        icon={Clock}
                                        label="Pending"
                                        onClick={() => handleStatusUpdate('pending')}
                                        color="text-amber-500"
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="confirmed"
                                        icon={CheckCircle}
                                        label="Confirmed"
                                        onClick={() => handleStatusUpdate('confirmed')}
                                        color="text-blue-500"
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="processing"
                                        icon={Package}
                                        label="Processing"
                                        onClick={() => handleStatusUpdate('processing')}
                                        color="text-indigo-500"
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="shipped"
                                        icon={Truck}
                                        label="Shipped"
                                        onClick={() => handleStatusUpdate('shipped')}
                                        color="text-purple-500"
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="delivered"
                                        icon={CheckCircle}
                                        label="Delivered"
                                        onClick={() => handleStatusUpdate('delivered')}
                                        color="text-emerald-500"
                                    />
                                    <StatusButton
                                        current={order.status}
                                        target="cancelled"
                                        icon={XCircle}
                                        label="Cancelled"
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        variant="outline"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50"
                                    />
                                </div>
                            </div>

                            {/* Customer Information */}
                            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wider">Customer</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                            {info.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium">{info.name || 'N/A'}</p>
                                            <p className="text-sm text-muted-foreground">{info.phone || 'N/A'}</p>
                                            {info.email && <p className="text-xs text-muted-foreground mt-0.5">{info.email}</p>}
                                        </div>
                                    </div>
                                    {info.company && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span>{info.company}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wider">Delivery</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        <span className="text-foreground font-medium block mb-1">Shipping Address</span>
                                        {order.shipping_address}<br />
                                        {order.shipping_city}, {order.shipping_zip}<br />
                                        {order.shipping_country}
                                    </p>
                                    {info.shipping && (
                                        <div className="pt-3 border-t border-border/50 mt-3">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Method</p>
                                            <p className="text-sm">{info.shipping}</p>
                                        </div>
                                    )}
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

function StatusButton({ current, target, icon: Icon, label, onClick, variant = 'outline', className, color }: any) {
    const isActive = current === target;
    return (
        <Button
            variant={isActive ? 'default' : variant}
            className={`justify-start h-auto py-2 px-3 ${isActive ? '' : 'text-muted-foreground hover:text-foreground'} ${className}`}
            onClick={onClick}
            disabled={isActive}
        >
            <div className={`mr-2 h-6 w-6 rounded-full flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-muted'} ${isActive ? 'text-white' : color}`}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium">{label}</span>
        </Button>
    )
}

function formatStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: string) {
    switch (status) {
        case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'processing': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        case 'shipped': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
        default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
}
