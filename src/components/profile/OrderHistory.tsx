
import { Link } from 'react-router-dom';
import { Package, CheckCircle2, Clock, Truck, PackageCheck, XCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/i18n/LanguageContext';

const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-primary/10 text-primary border-primary/20',
    processing: 'bg-primary/10 text-primary border-primary/20',
    shipped: 'bg-accent/10 text-accent border-accent/20',
    delivered: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface OrderHistoryProps {
    userId?: string;
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
        return <div className="space-y-4">{[1, 2].map((i) => (<div key={i} className="h-24 skeleton rounded-xl" />))}</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-8 border border-dashed rounded-lg">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg">{t.orders.noOrders}</h3>
                <p className="text-muted-foreground mb-4">{t.orders.startShoppingOrders}</p>
                <Link to="/products"><Button variant="outline">{t.cart.browseProducts}</Button></Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-foreground">{t.orders.order} #{order.id.slice(0, 8)}</span>
                                <Badge className={statusColors[order.status]}>
                                    {statusLabels[order.status] || order.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{t.orders.placedOn} {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-start sm:text-end">
                            <p className="text-xl font-bold text-foreground">{order.total_amount.toFixed(0)} {t.common.da}</p>
                            <p className="text-sm text-muted-foreground">{order.items?.length || 0} {t.orders.items}</p>
                        </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                        <div className="border-t border-border pt-4">
                            <div className="flex flex-wrap gap-2">
                                {order.items.slice(0, 3).map((item) => {
                                    const itemName = language === 'ar'
                                        ? (item.pack?.name_ar || item.product?.name_ar || item.product_name)
                                        : item.product_name;

                                    return (
                                        <span key={item.id} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                                            {itemName} × {item.quantity}
                                        </span>
                                    );
                                })}
                                {order.items.length > 3 && (
                                    <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                                        +{order.items.length - 3} {t.packs.more}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
