import { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, X, Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Pack } from '@/hooks/usePacks';

interface PacksTableProps {
    packs: Pack[];
    isLoading: boolean;
    onEdit: (pack: Pack) => void;
    onDelete: (id: string) => Promise<void>;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured';

export function PacksTable({
    packs,
    isLoading,
    onEdit,
    onDelete,
}: PacksTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Filter packs
    const filteredPacks = useMemo(() => {
        return packs.filter((pack) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    pack.name.toLowerCase().includes(query) ||
                    pack.slug.toLowerCase().includes(query) ||
                    pack.description?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter === 'active' && !pack.is_active) return false;
            if (statusFilter === 'inactive' && pack.is_active) return false;
            if (statusFilter === 'featured' && !pack.is_featured) return false;

            return true;
        });
    }, [packs, searchQuery, statusFilter]);

    const hasActiveFilters = searchQuery || statusFilter !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this pack?')) {
            await onDelete(id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search packs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="featured">Featured</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filters:</span>
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: {searchQuery}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                        </Badge>
                    )}
                    {statusFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            {statusFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                        </Badge>
                    )}
                    <span className="text-sm text-muted-foreground ml-2">
                        {filteredPacks.length} of {packs.length} packs
                    </span>
                </div>
            )}

            {/* Packs table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-semibold text-foreground">Pack</th>
                                <th className="text-left p-4 font-semibold text-foreground">Products</th>
                                <th className="text-left p-4 font-semibold text-foreground">Price</th>
                                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                                <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="p-4">
                                            <div className="h-12 skeleton rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredPacks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        {packs.length === 0
                                            ? 'No packs yet. Click "Add Pack" to create one.'
                                            : 'No packs match your filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPacks.map((pack) => (
                                    <tr key={pack.id} className="hover:bg-muted/30">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                    {pack.image_url ? (
                                                        <img
                                                            src={pack.image_url}
                                                            alt=""
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{pack.name}</p>
                                                    <p className="text-sm text-muted-foreground">{pack.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {pack.items?.map((item) => (
                                                    <Badge key={item.id} variant="secondary" className="text-xs">
                                                        {item.product?.name} ×{item.quantity}
                                                    </Badge>
                                                ))}
                                                {(!pack.items || pack.items.length === 0) && (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-foreground">{pack.price.toFixed(0)} DA</span>
                                            {pack.compare_at_price && (
                                                <span className="text-sm text-muted-foreground line-through ml-2">
                                                    {pack.compare_at_price.toFixed(0)} DA
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {pack.is_active ? (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                                        Inactive
                                                    </span>
                                                )}
                                                {pack.is_featured && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => onEdit(pack)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(pack.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
