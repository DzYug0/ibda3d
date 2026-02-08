import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { useAdminPacks, useCreatePack, useUpdatePack, useDeletePack, type Pack } from '@/hooks/usePacks';
import { useAdminProducts } from '@/hooks/useProducts';

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
    slug: '',
    description: '',
    price: '',
    compare_at_price: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    items: [] as PackItemForm[],
  });

  const resetForm = () => {
    setFormData({
      name: '', slug: '', description: '', price: '', compare_at_price: '',
      image_url: '', is_active: true, is_featured: false, items: [],
    });
    setEditingPack(null);
  };

  const openCreate = () => { resetForm(); setIsDialogOpen(true); };

  const openEdit = (pack: Pack) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      slug: pack.slug,
      description: pack.description || '',
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
    const packData = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description || null,
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

  const handleDelete = async (id: string) => {
    if (confirm('Delete this pack?')) await deletePack.mutateAsync(id);
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
                  <Label htmlFor="pack-name">Pack Name *</Label>
                  <Input id="pack-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="pack-slug">Slug</Label>
                  <Input id="pack-slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated" />
                </div>
              </div>

              <div>
                <Label htmlFor="pack-desc">Description</Label>
                <Textarea id="pack-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
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

      {/* Packs list */}
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
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-12 skeleton rounded" /></td></tr>
                ))
              ) : packs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No packs yet. Click "Add Pack" to create one.
                  </td>
                </tr>
              ) : packs.map(pack => (
                <tr key={pack.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {pack.image_url ? (
                          <img src={pack.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
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
                      {pack.items?.map(item => (
                        <Badge key={item.id} variant="secondary" className="text-xs">
                          {item.product?.name} ×{item.quantity}
                        </Badge>
                      ))}
                      {(!pack.items || pack.items.length === 0) && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-foreground">{pack.price.toFixed(0)} DA</span>
                    {pack.compare_at_price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">{pack.compare_at_price.toFixed(0)} DA</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {pack.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">Active</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">Inactive</span>
                      )}
                      {pack.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(pack)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(pack.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
