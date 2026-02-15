import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layout, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface Banner {
    id: string;
    title: string;
    image_url: string;
    link_url: string | null;
    location: 'hero' | 'promo' | 'sidebar';
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export default function AdminContent() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        link_url: '',
        location: 'hero' as 'hero' | 'promo' | 'sidebar',
        display_order: '0',
        is_active: true,
    });

    const queryClient = useQueryClient();

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['admin-banners'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('location', { ascending: true })
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as Banner[];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingBanner) {
                const { error } = await supabase
                    .from('banners')
                    .update(data)
                    .eq('id', editingBanner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('banners')
                    .insert(data);
                if (error) throw error;
            }
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    action: editingBanner ? 'banner_update' : 'banner_create',
                    target_type: 'banner',
                    target_id: editingBanner?.id || null,
                    details: {
                        title: formData.title,
                        location: formData.location
                    },
                });
            }

            setIsDialogOpen(false);
            resetForm();
            toast.success(editingBanner ? 'Banner updated' : 'Banner created');
        },
        onError: (error) => {
            toast.error('Failed to save banner: ' + error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: async (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    action: 'banner_delete',
                    target_type: 'banner',
                    target_id: variables,
                    details: { banner_id: variables },
                });
            }

            toast.success('Banner deleted');
        },
        onError: (error) => {
            toast.error('Failed to delete banner: ' + error.message);
        },
    });

    const resetForm = () => {
        setEditingBanner(null);
        setFormData({
            title: '',
            image_url: '',
            link_url: '',
            location: 'hero',
            display_order: '0',
            is_active: true,
        });
    };

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            image_url: banner.image_url,
            link_url: banner.link_url || '',
            location: banner.location,
            display_order: banner.display_order.toString(),
            is_active: banner.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            location: formData.location,
            display_order: parseInt(formData.display_order) || 0,
            is_active: formData.is_active,
        });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
                    <p className="text-muted-foreground">Manage website banners and visual content</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Banner
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Preview</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : banners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No banners found
                                </TableCell>
                            </TableRow>
                        ) : (
                            banners.map((banner) => (
                                <TableRow key={banner.id}>
                                    <TableCell>
                                        <div className="w-24 h-12 bg-muted rounded overflow-hidden">
                                            <img
                                                src={banner.image_url}
                                                alt={banner.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {banner.title}
                                        {banner.link_url && (
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <LinkIcon className="h-3 w-3 mr-1" />
                                                {banner.link_url}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {banner.location}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{banner.display_order}</TableCell>
                                    <TableCell>
                                        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    if (confirm('Delete this banner?')) deleteMutation.mutate(banner.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
                        <DialogDescription>
                            Configure banner display and linking.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Summer Sale Banner"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Banner Image</Label>
                            <ImageUpload
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                folder="banners"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Select
                                    value={formData.location}
                                    onValueChange={(v: 'hero' | 'promo' | 'sidebar') => setFormData({ ...formData, location: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hero">Hero Slider (Home)</SelectItem>
                                        <SelectItem value="promo">Promo Section</SelectItem>
                                        <SelectItem value="sidebar">Sidebar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link">Link URL (Optional)</Label>
                            <Input
                                id="link"
                                placeholder="/products/category/sale"
                                value={formData.link_url}
                                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label>Active Status</Label>
                                <div className="text-sm text-muted-foreground">
                                    Show or hide this banner
                                </div>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? 'Saving...' : 'Save Banner'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
