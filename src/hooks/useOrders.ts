import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  shipping_zip: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  pack_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  selected_color?: string | null;
  selected_version?: string | null;
  selected_options?: Record<string, string> | null;
  product?: { name_ar: string | null };
  pack?: { name_ar: string | null };
}

export function useUserOrders(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['orders', targetId],
    queryFn: async () => {
      if (!targetId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *,
            product:products(name_ar),
            pack:packs(name_ar)
          )
        `)
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Order[];
    },
    enabled: !!targetId,
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Order[];
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      items,
      shippingInfo,
      notes,
      couponCode,
    }: {
      items: {
        product_id: string | null;
        pack_id?: string | null;
        quantity: number;
        selected_color?: string | null;
        selected_version?: string | null;
        selected_options?: Record<string, string> | null;
        name?: string;
        price?: number;
      }[];
      shippingInfo: {
        address: string;
        city: string;
        country: string;
        zip: string;
        email?: string;
      };
      notes?: string;
      couponCode?: string | null;
    }) => {
      // Calculate total amount from passed items (trust frontend for display, but ideally valid on backend)
      // Since we are inserting directly, we are responsible for the data.
      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += (item.price || 0) * item.quantity;
      });

      const { data: { user } } = await supabase.auth.getUser();

      // Generate ID client-side to assume ownership without needing SELECT permissions
      const orderId = crypto.randomUUID();

      const orderData = {
        id: orderId,
        user_id: user ? user.id : null,
        status: 'pending' as OrderStatus,
        total_amount: totalAmount,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_country: shippingInfo.country || 'Algeria', // Fallback
        shipping_zip: shippingInfo.zip,
        email: shippingInfo.email || null,
        notes: notes || '',
        // coupon_code: couponCode // If schema has this
      };

      // 1. Create Order
      const { error: orderError } = await supabase
        .from('orders')
        .insert(orderData); // No .select() to avoid RLS Select policy issues for guests

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItemsData = items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        pack_id: item.pack_id,
        quantity: item.quantity,
        product_name: item.name || 'Unknown Item',
        product_price: item.price || 0,
        selected_color: item.selected_color,
        selected_version: item.selected_version,
        selected_options: item.selected_options
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        // Optional: Delete order if items fail? Or log it?
        console.error('Failed to insert items', itemsError);
        throw itemsError;
      }

      return { id: orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      toast.error('Failed to place order: ' + error.message);
    },
  });
}


export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'order_update',
          target_type: 'order',
          target_id: variables.orderId,
          details: { new_status: variables.status },
        });
      }

      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
}

export function useBulkUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      // toast.success(`${variables.ids.length} orders updated`); // Handled in component
    },
    onError: (error) => {
      toast.error('Failed to update orders: ' + error.message);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .select()
        .single();

      if (!data) throw new Error('Order not found or permission denied');

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'order_delete',
          target_type: 'order',
          target_id: variables,
          details: { order_id: variables },
        });
      }

      toast.success('Order deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete order: ' + error.message);
    },
  });
}
