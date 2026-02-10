import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Review {
    id: string;
    user_id: string;
    product_id: string;
    rating: number;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user?: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

export function useProductReviews(productId: string) {
    return useQuery({
        queryKey: ['reviews', productId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
                .eq('product_id', productId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as Review[];
        },
        enabled: !!productId,
    });
}

export function useSubmitReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, rating, comment }: { productId: string; rating: number; comment: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to review.');

            const { error } = await supabase
                .from('reviews')
                .insert({
                    product_id: productId,
                    user_id: user.id,
                    rating,
                    comment,
                    status: 'pending' // Explictly set pending, though default handled by DB
                });

            if (error) throw error;
        },
        onSuccess: (_, { productId }) => {
            // We don't necessarily invalidate 'reviews' immediately because the new one is pending and won't show up.
            // But we might want to invalidate if we showed "My Pending Reviews" somewhere.
            toast.success('Review submitted for moderation!');
        },
        onError: (error) => {
            toast.error('Failed to submit review: ' + error.message);
        },
    });
}

export function useAdminReviews() {
    return useQuery({
        queryKey: ['admin-reviews'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          *,
          user:profiles(full_name, avatar_url),
          product:products(name, slug, image_url)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as (Review & { product?: { name: string; slug: string; image_url: string } })[];
        },
    });
}

export function useUpdateReviewStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
            const { error } = await supabase
                .from('reviews')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            // Also invalidate public reviews so they appear/disappear
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast.success('Review status updated');
        },
        onError: (error) => {
            toast.error('Failed to update review: ' + error.message);
        },
    });
}

export function useDeleteReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast.success('Review deleted');
        },
        onError: (error) => {
            toast.error('Failed to delete review: ' + error.message);
        },
    });
}
