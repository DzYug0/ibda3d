import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layout, Image as ImageIcon, Link as LinkIcon, FileText, Globe } from 'lucide-react';
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

interface LegalPage {
    id: string;
    slug: string;
    title: string;
    content: string;
    is_active: boolean;
    updated_at: string;
}

export default function AdminContent() {
    const [activeTab, setActiveTab] = useState("banners");

    // Banner State
    const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [bannerFormData, setBannerFormData] = useState({
        title: '',
        image_url: '',
        link_url: '',
        location: 'hero' as 'hero' | 'promo' | 'sidebar',
        display_order: '0',
        is_active: true,
    });

    // Legal Page State
    const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
    const [pageFormData, setPageFormData] = useState({
        title: '',
        content: '',
        is_active: true,
    });

    const queryClient = useQueryClient();

    // --- Banners Queries & Mutations ---
    const { data: banners = [], isLoading: isLoadingBanners } = useQuery({
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

    const bannerMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingBanner) {
                const { error } = await supabase.from('banners').update(data).eq('id', editingBanner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('banners').insert(data);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
            setIsBannerDialogOpen(false);
            resetBannerForm();
            toast.success(editingBanner ? 'Banner updated' : 'Banner created');
        },
        onError: (error) => toast.error('Failed to save banner: ' + error.message),
    });

    const deleteBannerMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('banners').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
            toast.success('Banner deleted');
        },
        onError: (error) => toast.error('Failed to delete banner: ' + error.message),
    });

    // --- Legal Pages Queries & Mutations ---
    const { data: legalPages = [], isLoading: isLoadingPages } = useQuery({
        queryKey: ['admin-legal-pages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('legal_pages')
                .select('*')
                .order('title');

            if (error) throw error;
            return data as LegalPage[];
        },
    });

    const pageMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingPage) {
                const { error } = await supabase.from('legal_pages').update(data).eq('id', editingPage.id);
                if (error) throw error;
            } else {
                // Should not really happen as we seed them, but good to have
                const { error } = await supabase.from('legal_pages').insert(data);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-legal-pages'] });
            setIsPageDialogOpen(false);
            setEditingPage(null);
            toast.success('Page updated');
        },
        onError: (error) => toast.error('Failed to save page: ' + error.message),
    });

    // --- Handlers ---

    const resetBannerForm = () => {
        setEditingBanner(null);
        setBannerFormData({
            title: '',
            image_url: '',
            link_url: '',
            location: 'hero',
            display_order: '0',
            is_active: true,
        });
    };

    const handleEditBanner = (banner: Banner) => {
        setEditingBanner(banner);
        setBannerFormData({
            title: banner.title,
            image_url: banner.image_url,
            link_url: banner.link_url || '',
            location: banner.location,
            display_order: banner.display_order.toString(),
            is_active: banner.is_active,
        });
        setIsBannerDialogOpen(true);
    };

    const handleEditPage = (page: LegalPage) => {
        setEditingPage(page);
        setPageFormData({
            title: page.title,
            content: page.content,
            is_active: page.is_active,
        });
        setIsPageDialogOpen(true);
    };

    const handleBannerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bannerMutation.mutate({
            title: bannerFormData.title,
            image_url: bannerFormData.image_url,
            link_url: bannerFormData.link_url || null,
            location: bannerFormData.location,
            display_order: parseInt(bannerFormData.display_order) || 0,
            is_active: bannerFormData.is_active,
        });
    };

    const handlePageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        pageMutation.mutate({
            title: pageFormData.title,
            content: pageFormData.content,
            is_active: pageFormData.is_active,
            updated_at: new Date().toISOString(),
        });
    };

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Content Management</h1>
                    <p className="text-muted-foreground mt-1">Manage website banners and legal pages</p>
                </div>
            </div>

            <Tabs defaultValue="banners" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="banners">Banners & Visuals</TabsTrigger>
                    <TabsTrigger value="legal">Legal Pages</TabsTrigger>
                </TabsList>

                <TabsContent value="banners" className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => { resetBannerForm(); setIsBannerDialogOpen(true); }} className="shadow-lg hover:shadow-xl transition-all duration-300">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Banner
                        </Button>
                    </div>

                    {/* Banners Table (Desktop) */}
                    <div className="hidden md:block bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm">
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
                                {isLoadingBanners ? (
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
                                                <div className="w-24 h-12 bg-muted rounded overflow-hidden border border-border/50">
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
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditBanner(banner)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => {
                                                            if (confirm('Delete this banner?')) deleteBannerMutation.mutate(banner.id);
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

                    {/* Mobile Card View */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {isLoadingBanners ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-32 bg-card/60 rounded-xl border border-border/50 animate-pulse" />
                            ))
                        ) : banners.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No banners found
                            </div>
                        ) : (
                            banners.map((banner) => (
                                <div key={banner.id} className="bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm flex flex-col">
                                    {/* Banner Image Preview */}
                                    <div className="h-32 w-full bg-muted relative">
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => handleEditBanner(banner)}
                                                className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur-sm hover:bg-background"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8 shadow-sm"
                                                onClick={() => {
                                                    if (confirm('Delete this banner?')) deleteBannerMutation.mutate(banner.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Badge
                                            variant={banner.is_active ? 'default' : 'secondary'}
                                            className="absolute top-2 left-2 shadow-sm text-[10px] px-1.5 h-5 pointer-events-none"
                                        >
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="p-4 flex flex-col gap-2">
                                        <div>
                                            <h3 className="font-semibold text-foreground">{banner.title}</h3>
                                            {banner.link_url && (
                                                <div className="flex items-center text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                    <LinkIcon className="h-3 w-3 mr-1 shrink-0" />
                                                    {banner.link_url}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50 mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="capitalize">{banner.location}</span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                Order: <span className="font-medium text-foreground">{banner.display_order}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="legal" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoadingPages ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="h-40 skeleton rounded-xl bg-muted/50" />
                            ))
                        ) : (
                            legalPages.map((page) => (
                                <div
                                    key={page.id}
                                    className="group relative bg-card/60 backdrop-blur-md rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground">{page.title}</h3>
                                                <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                                            </div>
                                        </div>
                                        <Badge variant={page.is_active ? 'default' : 'secondary'}>
                                            {page.is_active ? 'Active' : 'Draft'}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                                        {page.content.replace(/<[^>]*>?/gm, '')}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center">
                                        <div className="text-xs text-muted-foreground">
                                            Last updated: {new Date(page.updated_at).toLocaleDateString()}
                                        </div>
                                        <Button size="sm" onClick={() => handleEditPage(page)}>
                                            <Pencil className="h-3.5 w-3.5 mr-2" />
                                            Edit Content
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Banner Dialog */}
            <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
                        <DialogDescription>
                            Configure banner display and linking.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBannerSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Summer Sale Banner"
                                value={bannerFormData.title}
                                onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Banner Image</Label>
                            <ImageUpload
                                value={bannerFormData.image_url}
                                onChange={(url) => setBannerFormData({ ...bannerFormData, image_url: url })}
                                folder="banners"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Select
                                    value={bannerFormData.location}
                                    onValueChange={(v: 'hero' | 'promo' | 'sidebar') => setBannerFormData({ ...bannerFormData, location: v })}
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
                                    value={bannerFormData.display_order}
                                    onChange={(e) => setBannerFormData({ ...bannerFormData, display_order: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link">Link URL (Optional)</Label>
                            <Input
                                id="link"
                                placeholder="/products/category/sale"
                                value={bannerFormData.link_url}
                                onChange={(e) => setBannerFormData({ ...bannerFormData, link_url: e.target.value })}
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
                                checked={bannerFormData.is_active}
                                onCheckedChange={(c) => setBannerFormData({ ...bannerFormData, is_active: c })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsBannerDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={bannerMutation.isPending}>
                                {bannerMutation.isPending ? 'Saving...' : 'Save Banner'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Legal Page Dialog */}
            <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
                <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit {editingPage?.title}</DialogTitle>
                        <DialogDescription>
                            Use HTML tags for formatting (e.g., &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;)
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePageSubmit} className="space-y-4 flex-1 flex flex-col overflow-hidden text-left">
                        <div className="space-y-2">
                            <Label htmlFor="pageTitle">Page Title</Label>
                            <Input
                                id="pageTitle"
                                value={pageFormData.title}
                                onChange={(e) => setPageFormData({ ...pageFormData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col min-h-0">
                            <Label htmlFor="content">Content (HTML)</Label>
                            <Textarea
                                id="content"
                                value={pageFormData.content}
                                onChange={(e) => setPageFormData({ ...pageFormData, content: e.target.value })}
                                required
                                className="flex-1 font-mono text-sm resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm shrink-0">
                            <div className="space-y-0.5">
                                <Label>Active Status</Label>
                                <Switch
                                    checked={pageFormData.is_active}
                                    onCheckedChange={(c) => setPageFormData({ ...pageFormData, is_active: c })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="shrink-0">
                            <Button type="button" variant="outline" onClick={() => setIsPageDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pageMutation.isPending}>
                                {pageMutation.isPending ? 'Saving...' : 'Save Page'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
