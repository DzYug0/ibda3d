import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { PacksTable } from '@/components/admin/PacksTable';
import { useAdminPacks, useCreatePack, useUpdatePack, useDeletePack, type Pack } from '@/hooks/usePacks';
import { useAdminProducts } from '@/hooks/useProducts';
import { translateToArabic } from '@/services/translationService';
import { Minus, Trash2 } from 'lucide-react'; // Kept for form items

interface PackItemForm {
  product_id: string;
  quantity: number;
}

export default function AdminPacks() {
  const { data: packs = [], isLoading } = useAdminPacks();
  const { data: products = [] } = useAdminProducts();
  const createPack = useCreatePack();
  const updatePack = useUpdatePack();
  const deletePack = useDeletePack();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    price: '',
    compare_at_price: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    items: [] as PackItemForm[],
  });

  const resetForm = () => {
    setFormData({
      name: '', name_ar: '', slug: '', description: '', description_ar: '', price: '', compare_at_price: '',
      image_url: '', is_active: true, is_featured: false, items: [],
    });
    setEditingPack(null);
  };

  const openCreate = () => { resetForm(); setIsDialogOpen(true); };

  const openEdit = (pack: Pack) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      name_ar: pack.name_ar || '',
      slug: pack.slug,
      description: pack.description || '',
      description_ar: pack.description_ar || '',
      price: pack.price.toString(),
      compare_at_price: pack.compare_at_price?.toString() || '',
      image_url: pack.image_url || '',
      is_active: pack.is_active,
      is_featured: pack.is_featured,
      items: pack.items?.map(i => ({ product_id: i.product_id, quantity: i.quantity })) || [],
    });
    setIsDialogOpen(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1 }],
    }));
  };

  const updateItem = (index: number, field: keyof PackItemForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
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

    const packData = {
      name: formData.name,
      name_ar: finalNameAr || null,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description || null,
      description_ar: finalDescriptionAr || null,
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      items: formData.items.filter(i => i.product_id),
    };

    try {
      if (editingPack) {
        await updatePack.mutateAsync({ id: editingPack.id, ...packData });
      } else {
        await createPack.mutateAsync(packData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch { /* handled */ }
  };

  // Calculate total value of items in pack
  const itemsValue = formData.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Packs</h1>
          <p className="text-muted-foreground">Create product bundles for better deals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPack ? 'Edit Pack' : 'Add New Pack'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pack-name">Pack Name (EN) *</Label>
                  <Input id="pack-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="pack-name-ar">Pack Name (AR)</Label>
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
                    id="pack-name-ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pack-slug">Slug</Label>
                  <Input id="pack-slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pack-desc">Description (EN)</Label>
                  <Textarea id="pack-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="pack-desc-ar">Description (AR)</Label>
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
                    id="pack-desc-ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pack-price">Pack Price *</Label>
                  <Input id="pack-price" type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="pack-compare">Compare at Price</Label>
                  <Input id="pack-compare" type="number" step="0.01" min="0" value={formData.compare_at_price} onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })} />
                </div>
              </div>

              {/* Products in pack */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Products in Pack</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Add Product
                  </Button>
                </div>
                {formData.items.length === 0 && (
                  <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-lg text-center">
                    No products added yet. Click "Add Product" to start building your pack.
                  </p>
                )}
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                      <Select value={item.product_id} onValueChange={v => updateItem(index, 'product_id', v)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.is_active).map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {p.price.toFixed(0)} DA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center border border-border rounded">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateItem(index, 'quantity', item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                {formData.items.length > 0 && itemsValue > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Individual total: {itemsValue.toFixed(0)} DA
                    {formData.price && parseFloat(formData.price) < itemsValue && (
                      <span className="text-success ml-2">
                        (Save {(itemsValue - parseFloat(formData.price)).toFixed(0)} DA)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label>Pack Image</Label>
                <ImageUpload value={formData.image_url} onChange={url => setFormData({ ...formData, image_url: url })} />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="pack-featured" checked={formData.is_featured} onCheckedChange={c => setFormData({ ...formData, is_featured: c })} />
                  <Label htmlFor="pack-featured">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="pack-active" checked={formData.is_active} onCheckedChange={c => setFormData({ ...formData, is_active: c })} />
                  <Label htmlFor="pack-active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPack.isPending || updatePack.isPending}>
                  {editingPack ? 'Update Pack' : 'Create Pack'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <PacksTable
        packs={packs}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(id) => deletePack.mutateAsync(id)}
      />
    </div>
  );
}
