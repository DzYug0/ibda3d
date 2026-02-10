import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
    store_name: string;
    contact_email: string;
    contact_phone: string;
    social_facebook: string;
    social_instagram: string;
    social_twitter: string;
    maintenance_mode: boolean;
    maintenance_message: string;
    shipping_free_threshold: number;
}

const DEFAULT_SETTINGS: StoreSettings = {
    store_name: 'Ibda3D',
    contact_email: 'support@ibda3d.com',
    contact_phone: '+213 555 123 456',
    social_facebook: '#',
    social_instagram: '#',
    social_twitter: '#',
    maintenance_mode: false,
    maintenance_message: 'We are currently performing scheduled maintenance. We will be back shortly.',
    shipping_free_threshold: 0,
};

export function useStoreSettings() {
    return useQuery({
        queryKey: ['store-settings-public'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_settings')
                .select('*');

            if (error) {
                console.error('Error fetching settings:', error);
                return DEFAULT_SETTINGS;
            }

            const settingsMap: Partial<StoreSettings> = {};
            data.forEach(item => {
                // Handle both wrapped and unwrapped legacy values
                const val = item.value;
                // @ts-ignore
                settingsMap[item.key] = (val && typeof val === 'object' && 'val' in val) ? val.val : val;
            });

            return { ...DEFAULT_SETTINGS, ...settingsMap };
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}
