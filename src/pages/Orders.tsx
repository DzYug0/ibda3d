import { Link } from 'react-router-dom';
import { Package, CheckCircle2, Clock, Truck, PackageCheck, XCircle, Settings } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-accent/10 text-accent border-accent/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

function OrderTracker({ status }: { status: string }) {
  const { t } = useLanguage();

  const trackingSteps = [
    { key: 'pending', label: t.orders.pending, icon: Clock },
    { key: 'confirmed', label: t.orders.confirmed, icon: CheckCircle2 },
    { key: 'processing', label: t.orders.processing, icon: Settings },
    { key: 'shipped', label: t.orders.shipped, icon: Truck },
    { key: 'delivered', label: t.orders.delivered, icon: PackageCheck },
  ];

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
        <XCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">{t.orders.cancelled}</span>
      </div>
    );
  }

  const currentIdx = trackingSteps.findIndex((s) => s.key === status);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        {trackingSteps.map((step, i) => {
          const isCompleted = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {i > 0 && (
                <div className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${i <= currentIdx ? 'bg-primary' : 'bg-border'}`} style={{ zIndex: 0 }} />
              )}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] sm:text-xs mt-1.5 text-center ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useUserOrders();
  const { t, language } = useLanguage();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.cart.pleaseSignIn}</h1>
          <p className="text-muted-foreground mb-6">{t.orders.signInOrders}</p>
          <Link to="/auth"><Button size="lg">{t.nav.signIn}</Button></Link>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">{t.orders.title}</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="h-32 skeleton rounded-xl" />))}
          </div>
        </div>
      </Layout>
    );
  }

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.orders.noOrders}</h1>
          <p className="text-muted-foreground mb-6">{t.orders.startShoppingOrders}</p>
          <Link to="/products"><Button size="lg">{t.cart.browseProducts}</Button></Link>
        </div>
      </Layout>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: t.orders.pending,
    confirmed: t.orders.confirmed,
    processing: t.orders.processing,
    shipped: t.orders.shipped,
    delivered: t.orders.delivered,
    cancelled: t.orders.cancelled,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t.orders.title}</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-foreground">{t.orders.order} #{order.id.slice(0, 8)}</span>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.orders.placedOn} {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-end">
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

              {order.shipping_address && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <span>{t.orders.shipsTo}</span>
                  <span>{order.shipping_address}, {order.shipping_city}, {order.shipping_country}</span>
                </div>
              )}

              <OrderTracker status={order.status} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
