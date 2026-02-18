import { useState } from 'react';
import { Package, FolderOpen, ShoppingBag, DollarSign, Calendar, Plus, ExternalLink, ArrowRight } from 'lucide-react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useAdminOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useProducts';
import { RevenueChart, OrderStatusChart, TopProductsChart } from '@/components/admin/AnalyticsCharts';
import { LowStockAlerts } from '@/components/admin/LowStockAlerts';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { format, subDays, isSameDay, isAfter, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  // Mock trends (in a real app, calculate vs previous period)
  const stats = [
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `${totalRevenue.toFixed(0)} DA`,
      trend: 12,
      trendLabel: 'vs last period',
      color: 'text-primary', // Blueish
    },
    {
      icon: ShoppingBag,
      label: 'Orders',
      value: filteredOrders.length.toString(),
      trend: 8,
      trendLabel: 'vs last period',
      color: 'text-purple-600',
    },
    {
      icon: Package,
      label: 'Products',
      value: products.length.toString(),
      color: 'text-orange-600',
    },
    {
      icon: FolderOpen,
      label: 'Categories',
      value: categories.length.toString(),
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store's performance.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
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
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Live Store
          </Button>
        </div>
      </div>

      {/* Stats Components */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/products/new">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all">
            <Plus className="h-6 w-6 text-primary" />
            <span className="font-medium">Add Product</span>
          </Button>
        </Link>
        <Link to="/admin/orders">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="font-medium">View Orders</span>
          </Button>
        </Link>
        <Link to="/admin/users">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-medium">Customers</span>
          </Button>
        </Link>
        <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
          More actions coming soon
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pl-0">
                <RevenueChart data={getRevenueData(filteredOrders, dateRange)} />
              </CardContent>
            </Card>
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusChart data={getOrderStatusData(filteredOrders)} />
              </CardContent>
            </Card>
          </div>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing products by {topProductsType}</CardDescription>
              </div>
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={topProductsType === 'quantity' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setTopProductsType('quantity')}
                >
                  Quantity
                </Button>
                <Button
                  variant={topProductsType === 'revenue' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setTopProductsType('revenue')}
                >
                  Revenue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TopProductsChart data={getTopProductsData(filteredOrders, topProductsType)} type={topProductsType} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <LowStockAlerts products={products} />

          {/* Recent Orders List */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{order.id.slice(0, 8)}</span>
                        {order.status === 'pending' && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{order.total_amount.toFixed(0)} DA</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium ${order.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No orders yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
