
import { Link } from 'react-router-dom';
import { Package, CheckCircle2, Clock, Truck, PackageCheck, XCircle, Settings, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    processing: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    shipped: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface OrderHistoryProps {
    userId?: string;
}

function OrderTracker({ status, t }: { status: string, t: any }) {

    const trackingSteps = [
        { key: 'pending', label: t.orders.pending, icon: Clock },
        { key: 'confirmed', label: t.orders.confirmed, icon: CheckCircle2 },
        { key: 'processing', label: t.orders.processing, icon: Settings },
        { key: 'shipped', label: t.orders.shipped, icon: Truck },
        { key: 'delivered', label: t.orders.delivered, icon: PackageCheck },
    ];

    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-500">{t.orders.cancelled}</span>
            </div>
        );
    }

    const currentIdx = trackingSteps.findIndex((s) => s.key === status);

    return (
        <div className="mt-6 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-0"></div>
                <div
                    className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-1000 ease-in-out -z-0"
                    style={{ width: `${(currentIdx / (trackingSteps.length - 1)) * 100}%` }}
                ></div>

                {trackingSteps.map((step, i) => {
                    const isCompleted = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    const Icon = step.icon;
                    return (
                        <div key={step.key} className="flex flex-col items-center relative z-10 group">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                    isCurrent ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" :
                                        isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                            "bg-card border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className={cn(
                                "text-[10px] sm:text-xs mt-2 text-center transition-colors font-medium",
                                isCompleted ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function OrderHistory({ userId }: OrderHistoryProps) {
    const { data: orders = [], isLoading } = useUserOrders(userId);
    const { t, language } = useLanguage();

    const statusLabels: Record<string, string> = {
        pending: t.orders.pending,
        confirmed: t.orders.confirmed,
        processing: t.orders.processing,
        shipped: t.orders.shipped,
        delivered: t.orders.delivered,
        cancelled: t.orders.cancelled,
    };

    if (isLoading) {
        return <div className="space-y-4">{[1, 2].map((i) => (<div key={i} className="h-40 skeleton rounded-2xl" />))}</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/20">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{t.orders.noOrders}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t.orders.startShoppingOrders}</p>
                <Link to="/products">
                    <Button className="rounded-full shadow-lg shadow-primary/20">
                        {t.cart.browseProducts}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50 p-5 sm:p-6 transition-all hover:border-primary/20 hover:shadow-md hover:bg-card/60"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-lg text-foreground">
                                    {t.orders.order} <span className="font-mono text-base font-normal text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                </span>
                                <Badge className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize shadow-sm", statusColors[order.status])}>
                                    {statusLabels[order.status] || order.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                {order.items && (
                                    <div className="flex items-center gap-1.5">
                                        <Package className="h-3.5 w-3.5" />
                                        {order.items.length} {t.orders.items}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-start sm:text-end">
                            <p className="text-2xl font-bold text-primary tracking-tight">
                                {order.total_amount.toFixed(0)} <span className="text-sm font-medium text-muted-foreground">{t.common.da}</span>
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-border/40 mb-4" />

                    {order.items && order.items.length > 0 && (
                        <div className="space-y-3">
                            {order.items.slice(0, 3).map((item) => {
                                const itemName = language === 'ar'
                                    ? (item.pack?.name_ar || item.product?.name_ar || item.product_name)
                                    : item.product_name;

                                return (
                                    <div key={item.id} className="flex items-start justify-between text-sm group/item p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-muted/50 border border-border/30 flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                {item.quantity}x
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{itemName}</span>
                                                {(item.selected_color || item.selected_version || (item.selected_options && Object.keys(item.selected_options).length > 0)) && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {item.selected_color && `${item.selected_color} `}
                                                        {item.selected_version && `• ${item.selected_version} `}
                                                        {item.selected_options && Object.entries(item.selected_options).map(([k, v]) => `• ${v}`).join(' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground font-mono text-xs">
                                            {(item.product_price || 0).toFixed(0)} DA
                                        </div>
                                    </div>
                                );
                            })}

                            {order.items.length > 3 && (
                                <div className="text-center pt-1">
                                    <span className="text-xs font-medium text-primary cursor-pointer hover:underline">
                                        +{order.items.length - 3} {t.packs.more}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {order.shipping_address && (
                        <div className="mt-4 pt-4 border-t border-border/40 flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>
                                <span className="font-medium text-foreground">{t.orders.shipsTo}:</span> {order.shipping_address}, {order.shipping_city}, {order.shipping_country}
                            </span>
                        </div>
                    )}

                    <OrderTracker status={order.status} t={t} />
                </div>
            ))}
        </div>
    );
}
