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
      return data as Order[];
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
      paymentMethod = 'cod',
    }: {
      items: {
        product_id: string | null;
        pack_id?: string | null;
        quantity: number;
        selected_color?: string | null;
        selected_version?: string | null;
        selected_options?: Record<string, string> | null;
      }[];
      shippingInfo: {
        address: string;
        city: string;
        country: string;
        zip: string;
      };
      notes?: string;
      couponCode?: string | null;
      paymentMethod?: 'cod' | 'chargily';
    }) => {
      // Use RPC instead of Edge Function
      const { data, error } = await supabase.rpc('create_new_order' as any, {
        p_items: items.map(item => ({
          product_id: item.product_id,
          pack_id: item.pack_id || null,
          quantity: item.quantity,
          selected_color: item.selected_color || null,
          selected_version: item.selected_version || null,
          selected_options: item.selected_options || null
        })),
        p_shipping_info: shippingInfo,
        p_notes: notes || '',
        p_coupon_code: couponCode || null,
        p_payment_method: paymentMethod,
      });

      if (error) throw error;

      // data is { success: boolean, order_id: string }
      const result = data as any;
      if (!result || !result.success) {
        throw new Error('Failed to create order');
      }

      return { id: result.order_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // toast.success('Order placed successfully!'); // Handled in component now for better flow control
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete order: ' + error.message);
    },
  });
}
