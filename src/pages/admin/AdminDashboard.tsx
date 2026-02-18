import { useState } from 'react';
import { Package, FolderOpen, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useAdminOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useProducts';
import { RevenueChart, OrderStatusChart, TopProductsChart } from '@/components/admin/AnalyticsCharts';
import { LowStockAlerts } from '@/components/admin/LowStockAlerts';
import { format, subDays, isSameDay, isAfter, startOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type DateRange = 'today' | '7d' | '30d' | '90d' | 'all';
type TopProductsType = 'quantity' | 'revenue';

export default function AdminDashboard() {
  const { data: products = [] } = useAdminProducts();
  const { data: orders = [] } = useAdminOrders();
  const { data: categories = [] } = useCategories();

  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [topProductsType, setTopProductsType] = useState<TopProductsType>('quantity');

  // Filter orders based on date range
  const filteredOrders = orders.filter(order => {
    if (dateRange === 'all') return true;

    const orderDate = new Date(order.created_at);
    const today = startOfDay(new Date());

    if (dateRange === 'today') {
      return isSameDay(orderDate, today);
    }

    const daysToSubtract = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = subDays(today, daysToSubtract);

    return isAfter(orderDate, cutoffDate);
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length; // Keep total pending regardless of date range

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
      label: `${dateRange === 'all' ? 'Total' : 'Period'} Orders`,
      value: filteredOrders.length,
      subtext: `${pendingOrders} pending total`,
      color: 'text-warning bg-warning/10',
    },
    {
      icon: DollarSign,
      label: `${dateRange === 'all' ? 'Total' : 'Period'} Revenue`,
      value: `${totalRevenue.toFixed(0)} DA`,
      color: 'text-success bg-success/10',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>

        <div className="flex items-center gap-2 bg-card/50 p-1 rounded-lg border border-border/50 backdrop-blur-sm">
          <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px] border-none bg-transparent focus:ring-0 shadow-none h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Analytics Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-sm hover:border-primary/20 transition-colors">
              <RevenueChart data={getRevenueData(filteredOrders, dateRange)} />
            </div>
            <div className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-sm hover:border-primary/20 transition-colors">
              <OrderStatusChart data={getOrderStatusData(filteredOrders)} />
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-sm">
            <div className="flex justify-end mb-4">
              <div className="flex bg-muted/50 rounded-lg p-1">
                <Button
                  variant={topProductsType === 'quantity' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs rounded-md"
                  onClick={() => setTopProductsType('quantity')}
                >
                  By Quantity
                </Button>
                <Button
                  variant={topProductsType === 'revenue' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs rounded-md"
                  onClick={() => setTopProductsType('revenue')}
                >
                  By Revenue
                </Button>
              </div>
            </div>
            <TopProductsChart data={getTopProductsData(filteredOrders, topProductsType)} type={topProductsType} />
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <LowStockAlerts products={products} />

          {/* Recent orders */}
          <div className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 h-fit overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/10">
              <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
              <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                <a href="/admin/orders">View All</a>
              </Button>
            </div>
            <div className="divide-y divide-border/50">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-default">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">Order #{order.id.slice(0, 8)}</p>
                      {order.total_amount > 10000 && <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-200">High Value</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(order.created_at), 'PPP')} • {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-foreground">{order.total_amount.toFixed(0)} DA</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 font-medium border ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                      order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                        'bg-blue-500/10 text-blue-600 border-blue-200'
                      }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No orders yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for analytics data
function getRevenueData(orders: any[], range: DateRange) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30; // Default to 30 for 'all' or '30d' or 'today' (to show context)

  const data = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), i);
    return {
      date: format(d, 'MMM dd'),
      fullDate: d,
      revenue: 0,
    };
  }).reverse();

  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    const dayStat = data.find(d => isSameDay(d.fullDate, orderDate));
    if (dayStat) {
      dayStat.revenue += order.total_amount;
    }
  });

  return data.map(({ date, revenue }) => ({ date, revenue }));
}

function getOrderStatusData(orders: any[]) {
  const statusCounts: Record<string, number> = {};

  orders.forEach(order => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
}

function getTopProductsData(orders: any[], type: TopProductsType) {
  const productStats: Record<string, number> = {};

  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item.product_name) {
          const value = type === 'quantity' ? item.quantity : (item.quantity * item.product_price);
          productStats[item.product_name] = (productStats[item.product_name] || 0) + value;
        }
      });
    }
  });

  return Object.entries(productStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}
