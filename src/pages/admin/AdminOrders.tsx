import { useState, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminOrders, useUpdateOrderStatus, useBulkUpdateOrderStatus } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { Button } from '@/components/ui/button';
import { Eye, Search, Filter, X, Printer, Download, Check, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { OrderInvoice } from '@/components/admin/OrderInvoice';
import { format, isSameDay, subDays, isAfter, startOfDay } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-accent/10 text-accent border-accent/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type DateRange = 'today' | '7d' | '30d' | 'all';

function parseNotes(notes: string | null) {
  if (!notes) return { name: null, company: null, phone: null, delivery: null, shipping: null };
  const extract = (key: string) => {
    const match = notes.match(new RegExp(`${key}:\\s*([^|]+)`));
    return match ? match[1].trim() : null;
  };
  return {
    name: extract('Name'),
    company: extract('Company'),
    phone: extract('Phone'),
    delivery: notes.split('|')[0]?.trim() || null,
    shipping: extract('Shipping'),
  };
}

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const bulkUpdateStatus = useBulkUpdateOrderStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);

  // Printing logic
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const parsed = parseNotes(order.notes);
        const matchesSearch =
          order.id.toLowerCase().includes(query) ||
          parsed.name?.toLowerCase().includes(query) ||
          parsed.phone?.includes(query);
        if (!matchesSearch) return false;
      }

      // Status
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Date
      if (dateRange !== 'all') {
        const orderDate = new Date(order.created_at);
        const today = startOfDay(new Date());
        if (dateRange === 'today') {
          if (!isSameDay(orderDate, today)) return false;
        } else {
          const days = dateRange === '7d' ? 7 : 30;
          if (!isAfter(orderDate, subDays(today, days))) return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, dateRange]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateRange !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRange('all');
  };

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const isAllSelected = filteredOrders.length > 0 && selectedIds.size === filteredOrders.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredOrders.length;

  // Actions
  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus.mutate({ orderId, status });
  };

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (selectedIds.size === 0) return;
    setIsBulkActionPending(true);
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status });
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} orders updated`);
    } catch {
      toast.error('Failed to update orders');
    } finally {
      setIsBulkActionPending(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Status', 'Total', 'Items'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => {
        const parsed = parseNotes(order.notes);
        const items = order.items?.map((i: any) => `${i.product_name} (${i.quantity})`).join('; ') || '';
        return [
          order.id,
          new Date(order.created_at).toLocaleDateString(),
          `"${parsed.name || ''}"`,
          `"${parsed.phone || ''}"`,
          order.status,
          order.total_amount,
          `"${items}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Prepare print content
  const selectedOrdersData = orders.filter(o => selectedIds.has(o.id));

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders (ID, Name, Phone)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isBulkActionPending}>
                  Update Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {statuses.map(s => (
                  <DropdownMenuItem key={s.value} onClick={() => handleBulkStatusUpdate(s.value as OrderStatus)}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="outline" onClick={() => handlePrint && handlePrint()}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoices
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto">
            Clear
          </Button>
        </div>
      )}

      {/* Print Container (Hidden) */}
      <div className="hidden">
        <div ref={componentRef}>
          {selectedOrdersData.map((order, index) => (
            <div key={order.id} className="print-page-break-after">
              <OrderInvoice order={order} />
              {index < selectedOrdersData.length - 1 && <div className="page-break" style={{ pageBreakAfter: 'always' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 p-4">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </th>
                <th className="text-left p-4 font-semibold text-foreground">Order</th>
                <th className="text-left p-4 font-semibold text-foreground">Customer</th>
                <th className="text-left p-4 font-semibold text-foreground">Date</th>
                <th className="text-left p-4 font-semibold text-foreground">Items</th>
                <th className="text-left p-4 font-semibold text-foreground">Total</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-4"><div className="h-12 skeleton rounded" /></td></tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders match your filters</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const parsed = parseNotes(order.notes);
                  return (
                    <tr key={order.id} className={`hover:bg-muted/30 ${selectedIds.has(order.id) ? 'bg-muted/20' : ''}`}>
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.has(order.id)}
                          onCheckedChange={() => toggleSelectOne(order.id)}
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">#{order.id.slice(0, 8)}</p>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {parsed.name && <p className="font-medium text-foreground">{parsed.name}</p>}
                          {parsed.phone && <p className="text-muted-foreground">{parsed.phone}</p>}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.items?.slice(0, 2).map((item: any) => (
                            <p key={item.id} className="text-sm text-muted-foreground">{item.product_name} × {item.quantity}</p>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-sm text-muted-foreground">+{order.items!.length - 2} more</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4"><span className="font-bold text-foreground">{order.total_amount.toFixed(0)} DA</span></td>
                      <td className="p-4">
                        <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                            {/* Removed Badge inside Trigger to fix hydration issues with nested buttons if any, keeping it simple */}
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <OrderDetailsDialog
                          order={order}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
