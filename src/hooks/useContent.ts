import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Banner {
    id: string;
    title: string;
    image_url: string;
    link_url: string | null;
    location: 'hero' | 'promo' | 'sidebar';
    display_order: number;
    is_active: boolean;
}

export function useBanners() {
    return useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as Banner[];
        },
    });
}
