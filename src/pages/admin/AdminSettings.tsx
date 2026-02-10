import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Store, Mail, Phone, Facebook, Instagram, Twitter, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StoreSettings {
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
    contact_email: '',
    contact_phone: '',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    maintenance_mode: false,
    maintenance_message: 'We are currently performing scheduled maintenance. We will be back shortly.',
    shipping_free_threshold: 0,
};

export default function AdminSettings() {
    const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
    const queryClient = useQueryClient();

    const { data: fetchedSettings, isLoading } = useQuery({
        queryKey: ['store-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_settings')
                .select('*');

            if (error) throw error;

            const settingsMap: Partial<StoreSettings> = {};
            data.forEach(item => {
                // @ts-ignore
                // Handle both wrapped and unwrapped legacy values
                const val = item.value;
                settingsMap[item.key] = (val && typeof val === 'object' && 'val' in val) ? val.val : val;
            });

            return { ...DEFAULT_SETTINGS, ...settingsMap };
        },
    });

    useEffect(() => {
        if (fetchedSettings) {
            setSettings(fetchedSettings);
        }
    }, [fetchedSettings]);

    const saveMutation = useMutation({
        mutationFn: async (newSettings: StoreSettings) => {
            const updates = Object.entries(newSettings).map(([key, value]) => ({
                key,
                value: { val: value }, // Wrap in object to ensure valid JSONB
                updated_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('store_settings')
                .upsert(updates);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-settings'] });
            toast.success('Settings saved successfully');
        },
        onError: (error) => {
            toast.error('Failed to save settings: ' + error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(settings);
    };

    const handleChange = (key: keyof StoreSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Store Settings</h1>
                    <p className="text-muted-foreground">Manage general store configuration</p>
                </div>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="space-y-6">
                {/* General Info */}
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Store className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">General Information</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="store_name">Store Name</Label>
                            <Input
                                id="store_name"
                                value={settings.store_name}
                                onChange={(e) => handleChange('store_name', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_email">Contact Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="contact_email"
                                    type="email"
                                    className="pl-9"
                                    value={settings.contact_email}
                                    onChange={(e) => handleChange('contact_email', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="contact_phone"
                                    className="pl-9"
                                    value={settings.contact_phone}
                                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-semibold">Social Links</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook URL</Label>
                            <Input
                                id="facebook"
                                placeholder="https://facebook.com/..."
                                value={settings.social_facebook}
                                onChange={(e) => handleChange('social_facebook', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram URL</Label>
                            <Input
                                id="instagram"
                                placeholder="https://instagram.com/..."
                                value={settings.social_instagram}
                                onChange={(e) => handleChange('social_instagram', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter/X URL</Label>
                            <Input
                                id="twitter"
                                placeholder="https://twitter.com/..."
                                value={settings.social_twitter}
                                onChange={(e) => handleChange('social_twitter', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h2 className="text-xl font-semibold">System & Maintenance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Maintenance Mode</Label>
                                <div className="text-sm text-muted-foreground">
                                    Disable the storefront for customers. Admins can still access everything.
                                </div>
                            </div>
                            <Switch
                                checked={settings.maintenance_mode}
                                onCheckedChange={(c) => handleChange('maintenance_mode', c)}
                            />
                        </div>

                        {settings.maintenance_mode && (
                            <div className="space-y-2">
                                <Label htmlFor="maintenance_msg">Maintenance Message</Label>
                                <Input
                                    id="maintenance_msg"
                                    value={settings.maintenance_message}
                                    onChange={(e) => handleChange('maintenance_message', e.target.value)}
                                />
                            </div>
                        )}

                        <Separator className="my-4" />

                        <div className="space-y-2 max-w-sm">
                            <Label htmlFor="free_ship_threshold">Free Shipping Threshold (DA)</Label>
                            <Input
                                id="free_ship_threshold"
                                type="number"
                                min="0"
                                value={settings.shipping_free_threshold}
                                onChange={(e) => handleChange('shipping_free_threshold', parseFloat(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">Set to 0 to disable automatic free shipping.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
