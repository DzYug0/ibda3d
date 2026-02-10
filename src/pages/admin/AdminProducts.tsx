import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useAdminProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useBulkDeleteProducts,
  useBulkUpdateProductStatus,
  useBulkUpdateProductFields,
  type Product,
} from '@/hooks/useProducts';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { ProductOptionsEditor, type ProductOption } from '@/components/admin/ProductOptionsEditor';
import { ProductsTable } from '@/components/admin/ProductsTable';
import { translateToArabic } from '@/services/translationService';

export default function AdminProducts() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const bulkDelete = useBulkDeleteProducts();
  const bulkUpdateStatus = useBulkUpdateProductStatus();
  const bulkUpdateFields = useBulkUpdateProductFields();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    price: '',
    compare_at_price: '',
    category_ids: [] as string[],
    image_url: '',
    images: [] as string[],
    stock_quantity: '',
    is_featured: false,
    is_active: true,
    colors: '' as string,
    versions: '' as string,
    product_options: [] as ProductOption[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      slug: '',
      description: '',
      description_ar: '',
      price: '',
      compare_at_price: '',
      category_ids: [],
      image_url: '',
      images: [],
      stock_quantity: '',
      is_featured: false,
      is_active: true,
      colors: '',
      versions: '',
      product_options: [],
    });
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_ar: product.name_ar || '',
      slug: product.slug,
      description: product.description || '',
      description_ar: product.description_ar || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      category_ids: product.categories?.map(c => c.id) || (product.category_id ? [product.category_id] : []),
      image_url: product.image_url || '',
      images: product.images || [],
      stock_quantity: product.stock_quantity.toString(),
      is_featured: product.is_featured,
      is_active: product.is_active,
      colors: product.colors?.join(', ') || '',
      versions: product.versions?.join(', ') || '',
      product_options: (product.product_options as ProductOption[]) || [],
    });
    setIsDialogOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalNameAr = formData.name_ar;
    let finalDescriptionAr = formData.description_ar;

    // Auto-translate if empty
    if (!finalNameAr && formData.name) {
      finalNameAr = await translateToArabic(formData.name);
    }
    if (!finalDescriptionAr && formData.description) {
      finalDescriptionAr = await translateToArabic(formData.description);
    }

    const productData = {
      name: formData.name,
      name_ar: finalNameAr || null,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description || null,
      description_ar: finalDescriptionAr || null,
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      category_id: formData.category_ids[0] || null,
      image_url: formData.image_url || null,
      images: formData.images,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      category_ids: formData.category_ids,
      colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
      versions: formData.versions.split(',').map(v => v.trim()).filter(Boolean),
      product_options: formData.product_options,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null); // Treat as new product
    setFormData({
      name: `${product.name} (Copy)`,
      name_ar: product.name_ar ? `${product.name_ar} (نسخة)` : '',
      slug: '', // Reset slug to auto-generate
      description: product.description || '',
      description_ar: product.description_ar || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      category_ids: product.categories?.map(c => c.id) || (product.category_id ? [product.category_id] : []),
      image_url: product.image_url || '',
      images: product.images || [],
      stock_quantity: product.stock_quantity.toString(),
      is_featured: product.is_featured,
      is_active: false, // Default to inactive for copies
      colors: product.colors?.join(', ') || '',
      versions: product.versions?.join(', ') || '',
      product_options: (product.product_options as ProductOption[]) || [],
    });
    setIsDialogOpen(true);
  };

  const handleBulkDelete = async (ids: string[]) => {
    await bulkDelete.mutateAsync(ids);
  };

  const handleBulkUpdateStatus = async (ids: string[], isActive: boolean) => {
    await bulkUpdateStatus.mutateAsync({ ids, isActive });
  };

  const handleBulkEdit = async (ids: string[], data: { price?: number; stock_quantity?: number }) => {
    await bulkUpdateFields.mutateAsync({ ids, data });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name (EN) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="name_ar">Product Name (AR)</Label>
                    <button
                      type="button"
                      onClick={async () => {
                        const translated = await translateToArabic(formData.name);
                        setFormData({ ...formData, name_ar: translated });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Auto Translate
                    </button>
                  </div>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-from-name"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description (EN)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="description_ar">Description (AR)</Label>
                    <button
                      type="button"
                      onClick={async () => {
                        const translated = await translateToArabic(formData.description);
                        setFormData({ ...formData, description_ar: translated });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Auto Translate
                    </button>
                  </div>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="compare_at_price">Compare at Price</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <ProductOptionsEditor
                  options={formData.product_options}
                  onChange={(options) => setFormData({ ...formData, product_options: options })}
                />
              </div>

              {/* Legacy Options (Hidden or Collapsed if you prefer, keeping for now as fallback plan) */}
              <div className="grid sm:grid-cols-2 gap-4 hidden">
                <div>
                  <Label htmlFor="colors">Colors</Label>
                  <Input
                    id="colors"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Red, Blue, Green (comma separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="versions">Versions</Label>
                  <Input
                    id="versions"
                    value={formData.versions}
                    onChange={(e) => setFormData({ ...formData, versions: e.target.value })}
                    placeholder="V1, V2, Pro (comma separated)"
                  />
                </div>
              </div>

              <div>
                <Label>Categories</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 p-3 border border-border rounded-lg max-h-60 overflow-y-auto">
                  {categories.filter(c => !c.parent_id).map((parent) => {
                    const children = categories.filter(c => c.parent_id === parent.id);
                    return (
                      <div key={parent.id} className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:bg-muted/50 p-1 rounded">
                          <Checkbox
                            checked={formData.category_ids.includes(parent.id)}
                            onCheckedChange={() => toggleCategory(parent.id)}
                          />
                          {parent.name}
                        </label>

                        {children.length > 0 && (
                          <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-1 border-l-2 border-muted ml-2">
                            {children.map(child => (
                              <label
                                key={child.id}
                                className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 p-1 rounded"
                              >
                                <Checkbox
                                  checked={formData.category_ids.includes(child.id)}
                                  onCheckedChange={() => toggleCategory(child.id)}
                                />
                                {child.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No categories available</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Main Product Image</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div>
                <Label>Product Gallery</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add additional images. Drag to reorder.
                </p>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                  maxImages={8}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ProductsTable
        products={products}
        categories={categories}
        isLoading={isLoading}
        onEdit={openEditDialog}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkEdit={handleBulkEdit}
      />
    </div>
  );
}
