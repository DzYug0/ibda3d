import { Package, FolderOpen, ShoppingBag, DollarSign } from 'lucide-react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useAdminOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useProducts';

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
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'pending' ? 'bg-warning/10 text-warning' :
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
