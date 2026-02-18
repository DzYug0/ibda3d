import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, Package, FolderOpen, ShoppingBag, UserCog, Settings, Ticket, Truck, Star, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  actor_email?: string;
  actor_name?: string;
}

const actionLabels: Record<string, string> = {
  role_change: 'Changed Role',
  product_create: 'Created Product',
  product_update: 'Updated Product',
  product_delete: 'Deleted Product',
  category_create: 'Created Category',
  category_update: 'Updated Category',
  category_delete: 'Deleted Category',
  order_update: 'Updated Order',
  order_delete: 'Deleted Order',
  user_ban: 'Banned User',
  user_unban: 'Unbanned User',
  user_delete: 'Deleted User',
  settings_update: 'Updated Settings',
  coupon_create: 'Created Coupon',
  coupon_update: 'Updated Coupon',
  coupon_delete: 'Deleted Coupon',
  shipping_company_create: 'Added Shipping Company',
  shipping_company_update: 'Updated Shipping Company',
  shipping_company_delete: 'Deleted Shipping Company',
  shipping_rates_update: 'Updated Shipping Rates',
  review_update: 'Updated Review',
  review_delete: 'Deleted Review',
  banner_create: 'Created Banner',
  banner_update: 'Updated Banner',
  banner_delete: 'Deleted Banner',
};

const targetIcons: Record<string, typeof Shield> = {
  user: UserCog,
  product: Package,
  category: FolderOpen,
  order: ShoppingBag,
  settings: Settings,
  coupon: Ticket,
  shipping_company: Truck,
  shipping_rates: Truck,
  review: Star,
  banner: Image,
};

const actionColors: Record<string, string> = {
  role_change: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  product_create: 'bg-green-500/10 text-green-600 border-green-500/20',
  product_update: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  product_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  category_create: 'bg-green-500/10 text-green-600 border-green-500/20',
  category_update: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  category_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  order_update: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  order_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  user_ban: 'bg-red-500/10 text-red-600 border-red-500/20',
  user_unban: 'bg-green-500/10 text-green-600 border-green-500/20',
  user_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  settings_update: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  coupon_create: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  coupon_update: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  coupon_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  shipping_company_create: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  shipping_company_update: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  shipping_company_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  shipping_rates_update: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  review_update: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  review_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  banner_create: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  banner_update: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  banner_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function AdminActivityLog() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      // Get activity logs
      const { data: activityLogs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get profiles to map user IDs to emails
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, username');

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, { email: p.email, name: p.username }]) || []
      );

      // Enrich logs with actor info
      const enrichedLogs: ActivityLog[] = (activityLogs || []).map((log) => ({
        ...log,
        details: log.details as Record<string, unknown> | null,
        actor_email: profileMap.get(log.user_id)?.email || 'Unknown',
        actor_name: profileMap.get(log.user_id)?.name || null,
      }));

      return enrichedLogs;
    },
  });

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      (log.details?.target_email as string)?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const formatDetails = (log: ActivityLog) => {
    if (!log.details) return '—';

    switch (log.action) {
      case 'role_change':
        return (
          <span>
            Changed <span className="font-medium">{log.details.target_email as string}</span> from{' '}
            <Badge variant="outline" className="mx-1">
              {log.details.old_role as string}
            </Badge>
            to
            <Badge variant="outline" className="mx-1">
              {log.details.new_role as string}
            </Badge>
          </span>
        );
      case 'product_create':
      case 'product_update':
      case 'product_delete':
        return (
          <span>
            Product: <span className="font-medium">{log.details.product_name as string}</span>
          </span>
        );
      case 'category_create':
      case 'category_update':
      case 'category_delete':
        return (
          <span>
            Category: <span className="font-medium">{log.details.category_name as string}</span>
          </span>
        );
      case 'order_update':
        return (
          <span>
            Order #{(log.target_id || '').slice(0, 8)} → {log.details.new_status as string}
          </span>
        );
      case 'order_delete':
        return (
          <span>
            Deleted Order #{(log.details.order_id as string || log.target_id || '').slice(0, 8)}
          </span>
        );
      case 'user_ban':
        return (
          <span>
            Banned <span className="font-medium">{log.details.target_email as string}</span>
            {log.details.reason && <span className="text-muted-foreground ml-1">({log.details.reason as string})</span>}
          </span>
        );
      case 'user_unban':
      case 'user_delete':
        return (
          <span>
            {log.action === 'user_unban' ? 'Unbanned' : 'Deleted'} <span className="font-medium">{log.details.target_email as string}</span>
          </span>
        );
      case 'settings_update':
        return <span>Store settings updated</span>;
      case 'coupon_create':
      case 'coupon_update':
      case 'coupon_delete':
        return (
          <span>
            Coupon: <span className="font-mono font-medium">{log.details.code as string}</span>
            {log.details.discount_value && (
              <span className="text-muted-foreground ml-1">
                ({String(log.details.discount_value)} {log.details.discount_type === 'percentage' ? '%' : 'DA'})
              </span>
            )}
          </span>
        );
      case 'shipping_company_create':
      case 'shipping_company_update':
      case 'shipping_company_delete':
        return (
          <span>
            Shipping Company: <span className="font-medium">{log.details.name || (log.details.updates as any)?.name || (log.details.company_id) || 'Unknown'}</span>
          </span>
        );
      case 'shipping_rates_update':
        return (
          <span>
            Updated {log.details.count as number} rates for company
          </span>
        );
      case 'review_update':
        return (
          <span>
            Updated review status to <Badge variant="outline">{log.details.status as string}</Badge>
          </span>
        );
      case 'review_delete':
        return <span>Deleted Review</span>;
      case 'banner_create':
      case 'banner_update':
      case 'banner_delete':
        return (
          <span>
            Banner: <span className="font-medium">{log.details.title as string || log.target_id}</span>
            {log.details.location && <span className="text-muted-foreground ml-1">({log.details.location as string})</span>}
          </span>
        );
      default:
        return JSON.stringify(log.details);
    }
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Track all admin actions and changes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-background/50 border-border/50">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="role_change">Role Changes</SelectItem>
            <SelectItem value="product_create">Product Created</SelectItem>
            <SelectItem value="product_update">Product Updated</SelectItem>
            <SelectItem value="product_delete">Product Deleted</SelectItem>
            <SelectItem value="category_create">Category Created</SelectItem>
            <SelectItem value="category_update">Category Updated</SelectItem>
            <SelectItem value="category_delete">Category Deleted</SelectItem>
            <SelectItem value="order_update">Order Updated</SelectItem>
            <SelectItem value="order_delete">Order Deleted</SelectItem>
            <SelectItem value="user_ban">User Banned</SelectItem>
            <SelectItem value="user_unban">User Unbanned</SelectItem>
            <SelectItem value="user_delete">User Deleted</SelectItem>
            <SelectItem value="settings_update">Settings Updated</SelectItem>
            <SelectItem value="coupon_create">Coupon Created</SelectItem>
            <SelectItem value="coupon_update">Coupon Updated</SelectItem>
            <SelectItem value="coupon_delete">Coupon Deleted</SelectItem>
            <SelectItem value="shipping_company_create">Shipping Co. Created</SelectItem>
            <SelectItem value="shipping_company_update">Shipping Co. Updated</SelectItem>
            <SelectItem value="shipping_company_delete">Shipping Co. Deleted</SelectItem>
            <SelectItem value="shipping_rates_update">Shipping Rates Updated</SelectItem>
            <SelectItem value="review_update">Review Updated</SelectItem>
            <SelectItem value="review_delete">Review Deleted</SelectItem>
            <SelectItem value="banner_create">Banner Created</SelectItem>
            <SelectItem value="banner_update">Banner Updated</SelectItem>
            <SelectItem value="banner_delete">Banner Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity table */}
      {/* Activity table (Desktop) */}
      <div className="hidden md:block bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const TargetIcon = targetIcons[log.target_type] || Shield;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TargetIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge
                          variant="outline"
                          className={actionColors[log.action] || 'bg-muted text-muted-foreground'}
                        >
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {log.actor_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">{log.actor_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm text-foreground">{formatDetails(log)}</div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-card/60 rounded-xl border border-border/50 animate-pulse" />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No activity logs found
          </div>
        ) : (
          filteredLogs.map((log) => {
            const TargetIcon = targetIcons[log.target_type] || Shield;
            return (
              <div key={log.id} className="bg-card/60 backdrop-blur-md rounded-xl border border-border/50 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                      <TargetIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`mb-1 ${actionColors[log.action] || 'bg-muted text-muted-foreground'}`}
                      >
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        by <span className="text-foreground font-medium">{log.actor_name || log.actor_email}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>

                <div className="pt-3 border-t border-border/50 text-sm">
                  {formatDetails(log)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
