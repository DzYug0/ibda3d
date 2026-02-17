import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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
  selected_options: Record<string, string> | null;
  product: {
    id: string;
    name: string;
    name_ar: string | null;
    price: number;
    image_url: string | null;
    stock_quantity: number;
    colors?: string[];
    versions?: string[];
    product_options?: any;
  } | null;
  pack: {
    id: string;
    name: string;
    name_ar: string | null;
    price: number;
    image_url: string | null;
    slug: string;
  } | null;
}

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);

  // Load local cart on mount
  useEffect(() => {
    const saved = localStorage.getItem('ibda3d_guest_cart');
    if (saved) {
      try {
        setLocalCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local cart', e);
      }
    }
    setIsLocalLoaded(true);
  }, []);

  // Save local cart whenever it changes
  useEffect(() => {
    if (isLocalLoaded) {
      localStorage.setItem('ibda3d_guest_cart', JSON.stringify(localCart));
    }
  }, [localCart, isLocalLoaded]);

  const { data: dbCartItems = [], isLoading: isDbLoading } = useQuery({
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
          selected_options,
          product:products (
            id,
            name,
            name_ar,
            price,
            image_url,
            stock_quantity,
            colors,
            versions,
            product_options
          ),
          pack:packs (
            id,
            name,
            name_ar,
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

  // Combine logic: if user, use DB. If guest, use Local.
  // Note: We are NOT merging them automatically here to avoid complexity.
  // A proper merge would happen on login (out of scope for now).
  const cartItems = user ? dbCartItems : localCart;
  const isLoading = user ? isDbLoading : !isLocalLoaded;

  const addToCart = useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
      selectedColor,
      selectedVersion,
      selectedOptions,
      productDetails // New: required for local cart
    }: {
      productId: string;
      quantity?: number;
      selectedColor?: string;
      selectedVersion?: string;
      selectedOptions?: Record<string, string>;
      productDetails?: any;
    }) => {
      if (user) {
        // DB Logic
        let query = supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (selectedColor) query = query.eq('selected_color', selectedColor);
        if (selectedVersion) query = query.eq('selected_version', selectedVersion);

        if (selectedOptions) {
          query = query.contains('selected_options', selectedOptions);
        } else {
          query = query.is('selected_options', null);
        }

        const { data: candidates } = await query;
        let existing = candidates && candidates.length > 0 ? candidates[0] : null;

        if (existing) {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity,
              selected_color: selectedColor || null,
              selected_version: selectedVersion || null,
              selected_options: selectedOptions || null
            });
          if (error) throw error;
        }
      } else {
        // Local Logic
        // Generate a pseudo-ID for the item
        const existingIndex = localCart.findIndex(item =>
          item.product_id === productId &&
          item.selected_color === (selectedColor || null) &&
          item.selected_version === (selectedVersion || null) &&
          JSON.stringify(item.selected_options) === JSON.stringify(selectedOptions || null)
        );

        if (existingIndex >= 0) {
          const updated = [...localCart];
          updated[existingIndex].quantity += quantity;
          setLocalCart(updated);
        } else {
          if (!productDetails) throw new Error("Product details required for guest cart");

          const newItem: CartItem = {
            id: `local_${Date.now()}_${Math.random()}`,
            product_id: productId,
            pack_id: null,
            quantity,
            selected_color: selectedColor || null,
            selected_version: selectedVersion || null,
            selected_options: selectedOptions || null,
            product: productDetails,
            pack: null
          };
          setLocalCart([...localCart, newItem]);
        }
        // Artificial delay to simulate async
        await new Promise(r => setTimeout(r, 100));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: (err) => {
      toast.error('Failed to add to cart');
      console.error(err);
    },
  });

  const addPackToCart = useMutation({
    mutationFn: async ({
      packId,
      quantity = 1,
      packDetails // New: required for local cart
    }: {
      packId: string;
      quantity?: number;
      packDetails?: any;
    }) => {
      if (user) {
        // DB Logic
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
      } else {
        // Local Logic
        const existingIndex = localCart.findIndex(item => item.pack_id === packId);

        if (existingIndex >= 0) {
          const updated = [...localCart];
          updated[existingIndex].quantity += quantity;
          setLocalCart(updated);
        } else {
          if (!packDetails) throw new Error("Pack details required for guest cart");

          const newItem: CartItem = {
            id: `local_${Date.now()}_${Math.random()}`,
            product_id: null,
            pack_id: packId,
            quantity,
            selected_color: null,
            selected_version: null,
            selected_options: null,
            product: null,
            pack: packDetails
          };
          setLocalCart([...localCart, newItem]);
        }
        await new Promise(r => setTimeout(r, 100));
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
      if (user) {
        if (quantity <= 0) {
          const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
          if (error) throw error;
        }
      } else {
        if (quantity <= 0) {
          setLocalCart(localCart.filter(item => item.id !== itemId));
        } else {
          setLocalCart(localCart.map(item => item.id === itemId ? { ...item, quantity } : item));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      if (user) {
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
        if (error) throw error;
      } else {
        setLocalCart(localCart.filter(item => item.id !== itemId));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (user) {
        const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
        if (error) throw error;
      } else {
        setLocalCart([]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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
