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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
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
            <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[120px] bg-background/50 border-border/50">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      <div className={`
        flex items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-lg transition-all duration-300
        ${selectedIds.size > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none hidden'}
      `}>
        <span className="text-sm font-medium text-primary ml-2">
          {selectedIds.size} selected
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-background/80 hover:bg-background border-primary/20 hover:border-primary/50 text-foreground"
            onClick={handleBulkActivate}
            disabled={isBulkActionPending}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-background/80 hover:bg-background border-primary/20 hover:border-primary/50 text-foreground"
            onClick={handleBulkDeactivate}
            disabled={isBulkActionPending}
          >
            Deactivate
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-2"
            onClick={handleBulkDelete}
            disabled={isBulkActionPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelectedIds(new Set())}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          Clear selection
        </Button>
      </div>

      {/* Products table (Desktop) */}
      <div className="hidden md:block bg-card/60 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 p-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="min-w-[300px]">Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="p-4">
                    <div className="h-16 skeleton rounded-lg bg-muted/60" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>{products.length === 0 ? 'No products found' : 'No matches found'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className={`group transition-colors ${selectedIds.has(product.id) ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'}`}
                >
                  <TableCell className="p-4">
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleSelectOne(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                            <span className="text-[10px]">No Img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
                        <span className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate font-mono opacity-80">
                          {product.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.categories && product.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.categories.slice(0, 2).map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50">
                            {c.name}
                          </Badge>
                        ))}
                        {product.categories.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50">
                            +{product.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.price.toLocaleString()} DA</span>
                      {product.compare_at_price && (
                        <span className="text-xs text-muted-foreground line-through opacity-70">
                          {product.compare_at_price.toLocaleString()} DA
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`
                         ${product.stock_quantity === 0 ? 'border-destructive text-destructive bg-destructive/5' :
                          product.stock_quantity <= 10 ? 'border-warning text-warning bg-warning/5' :
                            'border-border text-muted-foreground bg-muted/20'}
                       `}
                    >
                      {product.stock_quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {product.is_active ? (
                        <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200 shadow-none font-normal">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                          Inactive
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-200 shadow-none font-normal">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <span className="sr-only">Open menu</span>
                          <Filter className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(product.id, product.name)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <div key={i} className="h-32 skeleton rounded-xl bg-muted/60" />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="h-32 text-center flex flex-col items-center justify-center text-muted-foreground bg-card/30 rounded-xl border border-dashed border-border/50">
            <Search className="h-8 w-8 mb-2 opacity-50" />
            <p>{products.length === 0 ? 'No products found' : 'No matches found'}</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-card/60 backdrop-blur-md rounded-xl border border-border/50 p-4 shadow-sm ${selectedIds.has(product.id) ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                        <span className="text-[10px]">No Img</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mb-1">{product.slug}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{product.price.toLocaleString()} DA</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        Qty: {product.stock_quantity}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={() => toggleSelectOne(product.id)}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex gap-1.5">
                  <Badge variant={product.is_active ? 'default' : 'secondary'} className={`text-[10px] h-5 px-1.5 ${product.is_active ? 'bg-emerald-500/15 text-emerald-600' : ''}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {product.is_featured && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-500/15 text-amber-600">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(product)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(product.id, product.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
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

