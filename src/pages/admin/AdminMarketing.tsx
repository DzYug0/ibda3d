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
import { Plus, Pencil, Trash2, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    min_spend: number;
    usage_limit: number | null;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

export default function AdminMarketing() {
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'fixed' as 'fixed' | 'percentage',
        discount_value: '',
        min_spend: '',
        usage_limit: '',
        expires_at: '',
        is_active: true,
    });

    const queryClient = useQueryClient();

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Coupon[];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(data)
                    .eq('id', editingCoupon.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert(data);
                if (error) throw error;
            }
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    action: editingCoupon ? 'coupon_update' : 'coupon_create',
                    target_type: 'coupon',
                    target_id: editingCoupon?.id || null, // For create, we might need the new ID but for now null or omitted is fine, or we can fetch it. Ideally we return data from mutation.
                    details: {
                        code: formData.code,
                        discount_type: formData.discount_type,
                        discount_value: formData.discount_value
                    },
                });
            }

            setIsDialogOpen(false);
            resetForm();
            toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
        },
        onError: (error) => {
            toast.error('Failed to save coupon: ' + error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, code }: { id: string; code: string }) => {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: async (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    action: 'coupon_delete',
                    target_type: 'coupon',
                    target_id: variables.id,
                    details: { code: variables.code },
                });
            }

            toast.success('Coupon deleted');
        },
        onError: (error) => {
            toast.error('Failed to delete coupon: ' + error.message);
        },
    });

    const resetForm = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            discount_type: 'fixed',
            discount_value: '',
            min_spend: '',
            usage_limit: '',
            expires_at: '',
            is_active: true,
        });
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            min_spend: coupon.min_spend?.toString() || '0',
            usage_limit: coupon.usage_limit?.toString() || '',
            expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
            is_active: coupon.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value),
            min_spend: parseFloat(formData.min_spend) || 0,
            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
            expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            is_active: formData.is_active,
        });
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Marketing</h1>
                    <p className="text-muted-foreground mt-1">Manage coupons and discounts</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Coupon
                </Button>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-xl shadow-sm mb-6">
                <div className="relative max-w-sm">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search coupons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                    />
                </div>
            </div>

            <div className="bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : filteredCoupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No coupons found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCoupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                                    <TableCell>
                                        {coupon.discount_type === 'percentage'
                                            ? `${coupon.discount_value}%`
                                            : `${coupon.discount_value} DA`}
                                        {coupon.min_spend > 0 && <span className="text-xs text-muted-foreground block">Min: {coupon.min_spend} DA</span>}
                                    </TableCell>
                                    <TableCell>
                                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.expires_at
                                            ? format(new Date(coupon.expires_at), 'PPP')
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    if (confirm('Delete this coupon?')) deleteMutation.mutate({ id: coupon.id, code: coupon.code });
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
                        <DialogDescription>
                            Set up a discount code for your customers.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input
                                id="code"
                                placeholder="SUMMER2024"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.discount_type}
                                    onValueChange={(v: 'fixed' | 'percentage') => setFormData({ ...formData, discount_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Amount (DA)</SelectItem>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Value</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    min="0"
                                    step={formData.discount_type === 'fixed' ? '0.01' : '1'}
                                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_spend">Min Spend (DA)</Label>
                                <Input
                                    id="min_spend"
                                    type="number"
                                    min="0"
                                    value={formData.min_spend}
                                    onChange={(e) => setFormData({ ...formData, min_spend: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="limit">Usage Limit</Label>
                                <Input
                                    id="limit"
                                    type="number"
                                    min="1"
                                    value={formData.usage_limit}
                                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="expiry"
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label>Active Status</Label>
                                <div className="text-sm text-muted-foreground">
                                    Enable or disable this coupon
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
                                {saveMutation.isPending ? 'Saving...' : 'Save Coupon'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
