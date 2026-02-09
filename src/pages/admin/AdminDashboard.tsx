import { Package, FolderOpen, ShoppingBag, DollarSign } from 'lucide-react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useAdminOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useProducts';
import { RevenueChart, OrderStatusChart, TopProductsChart } from '@/components/admin/AnalyticsCharts';
import { format, subDays, isSameDay } from 'date-fns';

export default function AdminDashboard() {
  const { data: products = [] } = useAdminProducts();
  const { data: orders = [] } = useAdminOrders();
  const { data: categories = [] } = useCategories();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const stats = [
    {
      icon: Package,
      label: 'Total Products',
      value: products.length,
      color: 'text-primary bg-primary/10',
    },
    {
      icon: FolderOpen,
      label: 'Categories',
      value: categories.length,
      color: 'text-accent bg-accent/10',
    },
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: orders.length,
      subtext: `${pendingOrders} pending`,
      color: 'text-warning bg-warning/10',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `${totalRevenue.toFixed(0)} DA`,
      color: 'text-success bg-success/10',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <RevenueChart data={getRevenueData(orders)} />
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <OrderStatusChart data={getOrderStatusData(orders)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-8 shadow-sm">
        <TopProductsChart data={getTopProductsData(orders)} />
      </div>

      {/* Recent orders */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Recent Orders</h2>
        </div>
        <div className="divide-y divide-border">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{order.total_amount.toFixed(0)} DA</p>
                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-warning/10 text-warning' :
                  order.status === 'delivered' ? 'bg-success/10 text-success' :
                    'bg-primary/10 text-primary'
                  }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No orders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for analytics data
function getRevenueData(orders: any[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), i);
    return {
      date: format(d, 'MMM dd'),
      fullDate: d,
      revenue: 0,
    };
  }).reverse();

  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    // Find the matching date in our array
    const dayStat = last30Days.find(d => isSameDay(d.fullDate, orderDate));
    if (dayStat) {
      dayStat.revenue += order.total_amount;
    }
  });

  return last30Days.map(({ date, revenue }) => ({ date, revenue }));
}

function getOrderStatusData(orders: any[]) {
  const statusCounts: Record<string, number> = {};

  orders.forEach(order => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
}

function getTopProductsData(orders: any[]) {
  const productCounts: Record<string, number> = {};

  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item.product_name) {
          productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
        }
      });
    }
  });

  return Object.entries(productCounts)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}
