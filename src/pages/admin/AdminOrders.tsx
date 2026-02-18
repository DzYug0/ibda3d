import { useState, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminOrders, useUpdateOrderStatus, useBulkUpdateOrderStatus, useDeleteOrder } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { Button } from '@/components/ui/button';
import { Eye, Search, Filter, X, Printer, Download, Check, Calendar, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const deleteOrder = useDeleteOrder();

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
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-background/50 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders (ID, Name, Phone)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary ml-2">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isBulkActionPending} className="bg-background/80 hover:bg-background border-primary/20 hover:border-primary/50 text-foreground">
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

            <Button size="sm" variant="outline" onClick={() => handlePrint && handlePrint()} className="bg-background/80 hover:bg-background border-primary/20 hover:border-primary/50 text-foreground gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
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

      <div className="bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 p-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="min-w-[120px]">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="min-w-[200px]">Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="p-4">
                    <div className="h-16 skeleton rounded-lg bg-muted/60" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No orders match your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const parsed = parseNotes(order.notes);
                return (
                  <TableRow key={order.id} className={`group hover:bg-muted/30 ${selectedIds.has(order.id) ? 'bg-primary/5 hover:bg-primary/10' : ''}`}>
                    <TableCell className="p-4">
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelectOne(order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-primary">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {parsed.name ? (
                          <span className="font-medium text-foreground">{parsed.name}</span>
                        ) : <span className="text-muted-foreground italic">Guest</span>}
                        {parsed.phone && <span className="text-xs text-muted-foreground">{parsed.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 opacity-70" />
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">x{item.quantity}</span>
                            <span className="truncate max-w-[150px]" title={item.product_name}>{item.product_name}</span>
                          </div>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/30">
                            +{order.items!.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-foreground">{order.total_amount.toLocaleString()} DA</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className={`h-7 px-2 text-xs border ${statusColors[order.status] || 'bg-muted text-muted-foreground border-border'} hover:brightness-95 transition-all`}>
                            {statuses.find(s => s.value === order.status)?.label || order.status}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {statuses.map((s) => (
                            <DropdownMenuItem key={s.value} onClick={() => handleStatusChange(order.id, s.value as OrderStatus)}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${statusColors[s.value].split(' ')[0].replace('/10', '')}`} />
                              {s.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <OrderDetailsDialog
                          order={order}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
                              deleteOrder.mutate(order.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
