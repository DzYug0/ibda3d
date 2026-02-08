import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string | null;
  pack_id: string | null;
  quantity: number;
  selected_color: string | null;
  selected_version: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock_quantity: number;
    colors?: string[];
    versions?: string[];
  } | null;
  pack: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    slug: string;
  } | null;
}

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          pack_id,
          quantity,
          selected_color,
          selected_version,
          product:products (
            id,
            name,
            price,
            image_url,
            stock_quantity,
            colors,
            versions
          ),
          pack:packs (
            id,
            name,
            price,
            image_url,
            slug
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as unknown as CartItem[];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
      selectedColor,
      selectedVersion
    }: {
      productId: string;
      quantity?: number;
      selectedColor?: string;
      selectedVersion?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if item exists with same options
      let query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (selectedColor) query = query.eq('selected_color', selectedColor);
      else query = query.is('selected_color', null);

      if (selectedVersion) query = query.eq('selected_version', selectedVersion);
      else query = query.is('selected_version', null);

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            selected_color: selectedColor || null,
            selected_version: selectedVersion || null
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const addPackToCart = useMutation({
    mutationFn: async ({ packId, quantity = 1 }: { packId: string; quantity?: number }) => {
      if (!user) throw new Error('Must be logged in');

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('pack_id', packId)
        .is('product_id', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ user_id: user.id, pack_id: packId, product_id: null, quantity } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

  const cartTotal = cartItems.reduce(
    (total, item) => {
      const price = item.pack_id ? (item.pack?.price || 0) : (item.product?.price || 0);
      return total + price * item.quantity;
    },
    0
  );

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return {
    cartItems,
    cartTotal,
    cartCount,
    isLoading,
    addToCart,
    addPackToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
