import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useWishlist() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch wishlist items
    const { data: wishlist = [], isLoading } = useQuery({
        queryKey: ['wishlist', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // @ts-ignore
            const { data, error } = await supabase
                .from('wishlist')
                .select(`
          product_id,
          product:products (
            id,
            name,
            price,
            image_url,
            slug,
            stock_quantity
          )
        `)
                .eq('user_id', user.id);

            if (error) {
                throw error;
            }

            return data.map(item => item.product) as any[];
        },
        enabled: !!user,
    });

    // Check if a product is in wishlist
    const isInWishlist = (productId: string) => {
        return wishlist.some((item: any) => item.id === productId);
    };

    // Add to wishlist
    const addToWishlist = useMutation({
        mutationFn: async (productId: string) => {
            if (!user) throw new Error('Must be logged in');

            // @ts-ignore
            const { error } = await supabase
                .from('wishlist')
                .insert({ user_id: user.id, product_id: productId });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            toast.success('Added to wishlist');
        },
        onError: (error) => {
            toast.error('Failed to add to wishlist: ' + error.message);
        },
    });

    // Remove from wishlist
    const removeFromWishlist = useMutation({
        mutationFn: async (productId: string) => {
            if (!user) throw new Error('Must be logged in');

            // @ts-ignore
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            toast.success('Removed from wishlist');
        },
        onError: (error) => {
            toast.error('Failed to remove from wishlist: ' + error.message);
        },
    });

    // Toggle wishlist
    const toggleWishlist = (productId: string) => {
        if (!user) {
            toast.error('Please login to use wishlist');
            return;
        }

        if (isInWishlist(productId)) {
            removeFromWishlist.mutate(productId);
        } else {
            addToWishlist.mutate(productId);
        }
    };

    return {
        wishlist,
        isLoading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
    };
}
