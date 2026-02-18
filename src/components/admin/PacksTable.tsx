import { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, X, Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
            <div className="flex flex-col sm:flex-row gap-4 bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-xl shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search packs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
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
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap px-1">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filters:</span>
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1 bg-secondary/50">
                            Search: {searchQuery}
                            <X className="h-3 w-3 cursor-pointer hover:text-primary" onClick={() => setSearchQuery('')} />
                        </Badge>
                    )}
                    {statusFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1 bg-secondary/50">
                            {statusFilter}
                            <X className="h-3 w-3 cursor-pointer hover:text-primary" onClick={() => setStatusFilter('all')} />
                        </Badge>
                    )}
                    <span className="text-sm text-muted-foreground ml-auto">
                        {filteredPacks.length} of {packs.length} packs
                    </span>
                </div>
            )}

            {/* Packs table (Desktop) */}
            <div className="hidden md:block bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-[300px]">Pack</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredPacks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    {packs.length === 0
                                        ? 'No packs yet. Click "Add Pack" to create one.'
                                        : 'No packs match your filters.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPacks.map((pack) => (
                                <TableRow key={pack.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
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
                                                        <Package className="h-5 w-5 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{pack.name}</p>
                                                <p className="text-xs text-muted-foreground">{pack.slug}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {pack.items?.map((item) => (
                                                <Badge key={item.id} variant="outline" className="text-[10px] bg-background/50">
                                                    {item.product?.name} <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                                                </Badge>
                                            ))}
                                            {(!pack.items || pack.items.length === 0) && (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{pack.price.toLocaleString()} DA</span>
                                            {pack.compare_at_price && (
                                                <span className="text-xs text-muted-foreground line-through">
                                                    {pack.compare_at_price.toLocaleString()} DA
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {pack.is_active ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-muted-foreground">
                                                    Inactive
                                                </Badge>
                                            )}
                                            {pack.is_featured && (
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                    Featured
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(pack)}
                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleDelete(pack.id)}
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
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 bg-card/60 rounded-xl border border-border/50 animate-pulse" />
                    ))
                ) : filteredPacks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {packs.length === 0
                            ? 'No packs yet. Click "Add Pack" to create one.'
                            : 'No packs match your filters.'}
                    </div>
                ) : (
                    filteredPacks.map((pack) => (
                        <div key={pack.id} className="bg-card/60 backdrop-blur-md rounded-xl border border-border/50 p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                                        {pack.image_url ? (
                                            <img
                                                src={pack.image_url}
                                                alt=""
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="h-5 w-5 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground text-sm line-clamp-1">{pack.name}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{pack.slug}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(pack)}
                                        className="h-8 w-8 -mt-1 -mr-1 hover:bg-primary/10 hover:text-primary"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/50">
                                <div className="flex flex-col">
                                    <span className="font-medium text-foreground">{pack.price.toLocaleString()} DA</span>
                                    {pack.compare_at_price && (
                                        <span className="text-xs text-muted-foreground line-through">
                                            {pack.compare_at_price.toLocaleString()} DA
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {pack.is_active ? (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-1.5 py-0 h-5">
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-muted-foreground text-[10px] px-1.5 py-0 h-5">
                                            Inactive
                                        </Badge>
                                    )}
                                    {pack.is_featured && (
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-5">
                                            Featured
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
