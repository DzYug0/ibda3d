import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

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

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus.mutate({ orderId, status });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-foreground">Order</th>
                <th className="text-left p-4 font-semibold text-foreground">Customer</th>
                <th className="text-left p-4 font-semibold text-foreground">Date</th>
                <th className="text-left p-4 font-semibold text-foreground">Items</th>
                <th className="text-left p-4 font-semibold text-foreground">Total</th>
                <th className="text-left p-4 font-semibold text-foreground">Shipping</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="h-12 skeleton rounded" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const parsed = parseNotes(order.notes);
                  return (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="p-4">
                        <p className="font-medium text-foreground">#{order.id.slice(0, 8)}</p>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {parsed.name && (
                            <p className="font-medium text-foreground">{parsed.name}</p>
                          )}
                          {parsed.phone && (
                            <p className="text-muted-foreground">{parsed.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.items?.slice(0, 2).map((item) => (
                            <p key={item.id} className="text-sm text-muted-foreground">
                              {item.product_name} × {item.quantity}
                            </p>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-sm text-muted-foreground">
                              +{order.items!.length - 2} more
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-foreground">
                          {order.total_amount.toFixed(0)} DA
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {parsed.company && (
                            <p className="font-medium text-primary">{parsed.company}</p>
                          )}
                          {parsed.delivery && (
                            <p className="text-muted-foreground">{parsed.delivery}</p>
                          )}
                          {order.shipping_address && (
                            <p className="text-muted-foreground">{order.shipping_address}</p>
                          )}
                          {order.shipping_city && (
                            <p className="text-muted-foreground">{order.shipping_city}</p>
                          )}
                          {parsed.shipping && (
                            <p className="text-xs text-muted-foreground">{parsed.shipping}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-36">
                            <Badge className={statusColors[order.status]}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
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