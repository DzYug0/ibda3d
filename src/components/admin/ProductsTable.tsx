import { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, X, Filter, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BulkEditProductDialog } from '@/components/admin/BulkEditProductDialog';
import type { Product, Category } from '@/hooks/useProducts';

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkUpdateStatus: (ids: string[], isActive: boolean) => Promise<void>;
  onBulkEdit: (ids: string[], data: { price?: number; stock_quantity?: number }) => Promise<void>;
}

type StockFilter = 'all' | 'in-stock' | 'out-of-stock' | 'low-stock';
type StatusFilter = 'all' | 'active' | 'inactive' | 'featured';

export function ProductsTable({
  products,
  categories,
  isLoading,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkEdit,
}: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const hasCategory = product.categories?.some(c => c.id === categoryFilter) || product.category_id === categoryFilter;
        if (!hasCategory) return false;
      }

      // Stock filter
      if (stockFilter === 'out-of-stock' && product.stock_quantity > 0) return false;
      if (stockFilter === 'in-stock' && product.stock_quantity === 0) return false;
      if (stockFilter === 'low-stock' && (product.stock_quantity === 0 || product.stock_quantity > 10)) return false;

      // Status filter
      if (statusFilter === 'active' && !product.is_active) return false;
      if (statusFilter === 'inactive' && product.is_active) return false;
      if (statusFilter === 'featured' && !product.is_featured) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter]);

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || stockFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStockFilter('all');
    setStatusFilter('all');
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredProducts.length;

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} product(s)?`)) return;

    setIsBulkActionPending(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} product(s) deleted`);
    } catch {
      toast.error('Failed to delete products');
    } finally {
      setIsBulkActionPending(false);
    }
  };

  const handleBulkEdit = () => {
    setIsBulkEditDialogOpen(true);
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkActionPending(true);
    try {
      await onBulkUpdateStatus(Array.from(selectedIds), true);
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} product(s) activated`);
    } catch {
      toast.error('Failed to update products');
    } finally {
      setIsBulkActionPending(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkActionPending(true);
    try {
      await onBulkUpdateStatus(Array.from(selectedIds), false);
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} product(s) deactivated`);
    } catch {
      toast.error('Failed to update products');
    } finally {
      setIsBulkActionPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock (≤10)</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[120px]">
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
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.id === categoryFilter)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter('all')} />
            </Badge>
          )}
          {stockFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {stockFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStockFilter('all')} />
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {statusFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
            </Badge>
          )}
          <span className="text-sm text-muted-foreground ml-2">
            {filteredProducts.length} of {products.length} products
          </span>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkActivate}
              disabled={isBulkActionPending}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDeactivate}
              disabled={isBulkActionPending}
            >
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkActionPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Products table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 p-4">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </th>
                <th className="text-left p-4 font-semibold text-foreground">Product</th>
                <th className="text-left p-4 font-semibold text-foreground">Category</th>
                <th className="text-left p-4 font-semibold text-foreground">Price</th>
                <th className="text-left p-4 font-semibold text-foreground">Stock</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-right p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="h-12 skeleton rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {products.length === 0
                      ? 'No products yet. Click "Add Product" to create one.'
                      : 'No products match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-muted/30 ${selectedIds.has(product.id) ? 'bg-muted/20' : ''}`}
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelectOne(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {product.categories && product.categories.length > 0
                        ? product.categories.map(c => {
                          const categoryInfo = categories.find(cat => cat.id === c.id);
                          const parentName = categoryInfo?.parent_id
                            ? categories.find(p => p.id === categoryInfo.parent_id)?.name
                            : null;
                          return parentName ? `${parentName} > ${c.name}` : c.name;
                        }).join(', ')
                        : product.category?.name || '—'}
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">{product.price.toFixed(0)} DA</span>
                      {product.compare_at_price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {product.compare_at_price.toFixed(0)} DA
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={
                          product.stock_quantity === 0
                            ? 'text-destructive'
                            : product.stock_quantity <= 10
                              ? 'text-warning'
                              : 'text-foreground'
                        }
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {product.is_active ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            Inactive
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onDuplicate(product)} title="Duplicate">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(product.id, product.name)}
                          title="Delete"
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
      <BulkEditProductDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        selectedCount={selectedIds.size}
        onSave={async (data) => {
          await onBulkEdit(Array.from(selectedIds), data);
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
