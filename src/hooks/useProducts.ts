import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
  colors?: string[];
  versions?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

// Helper to fetch product categories from junction table
async function fetchProductCategories(productIds: string[]) {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase
    .from('product_categories')
    .select('product_id, category:categories(id, name, slug)')
    .in('product_id', productIds);
  if (error) throw error;

  const map: Record<string, { id: string; name: string; slug: string }[]> = {};
  for (const row of data || []) {
    if (!map[row.product_id]) map[row.product_id] = [];
    if (row.category) {
      map[row.product_id].push(row.category as any);
    }
  }
  return map;
}

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let products = data as Product[];

      // Fetch categories from junction table
      const catMap = await fetchProductCategories(products.map(p => p.id));
      products = products.map(p => ({
        ...p,
        categories: catMap[p.id] || [],
        category: catMap[p.id]?.[0] || undefined,
      }));

      // Filter by category if specified
      if (categorySlug) {
        products = products.filter(p =>
          p.categories?.some(c => c.slug === categorySlug)
        );
      }

      return products;
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      const products = data as Product[];
      const catMap = await fetchProductCategories(products.map(p => p.id));
      return products.map(p => ({
        ...p,
        categories: catMap[p.id] || [],
        category: catMap[p.id]?.[0] || undefined,
      }));
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const catMap = await fetchProductCategories([data.id]);
      return {
        ...data,
        categories: catMap[data.id] || [],
        category: catMap[data.id]?.[0] || undefined,
      } as Product;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const products = data as Product[];
      const catMap = await fetchProductCategories(products.map(p => p.id));
      return products.map(p => ({
        ...p,
        categories: catMap[p.id] || [],
        category: catMap[p.id]?.[0] || undefined,
      }));
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'category' | 'categories'> & { category_ids?: string[] }) => {
      const { category_ids, ...productData } = product;
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      // Insert junction table entries
      if (category_ids && category_ids.length > 0) {
        const { error: jError } = await supabase
          .from('product_categories')
          .insert(category_ids.map(cid => ({ product_id: data.id, category_id: cid })));
        if (jError) throw jError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, category_ids, ...product }: Partial<Product> & { id: string; category_ids?: string[] }) => {
      const { categories, category, ...cleanProduct } = product as any;
      const { data, error } = await supabase
        .from('products')
        .update(cleanProduct)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Product update failed — you may not have permission');

      // Update junction table
      if (category_ids !== undefined) {
        // Delete existing
        const { error: delError } = await supabase.from('product_categories').delete().eq('product_id', id);
        if (delError) throw delError;
        // Insert new
        if (category_ids.length > 0) {
          const { error: jError } = await supabase
            .from('product_categories')
            .insert(category_ids.map(cid => ({ product_id: id, category_id: cid })));
          if (jError) throw jError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error) => {
      toast.error('Failed to delete products: ' + error.message);
    },
  });
}

export function useBulkUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error) => {
      toast.error('Failed to update products: ' + error.message);
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'category_create',
        target_type: 'category',
        target_id: data.id,
        details: { category_name: data.name },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Category update failed — you may not have permission');

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'category_update',
        target_type: 'category',
        target_id: data.id,
        details: { category_name: data.name },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'category_delete',
        target_type: 'category',
        target_id: id,
        details: { category_name: name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });
}

export function useRelatedProducts(currentProductId: string, categoryIds: string[]) {
  return useQuery({
    queryKey: ['related-products', currentProductId, categoryIds],
    queryFn: async () => {
      if (!categoryIds || categoryIds.length === 0) return [];

      // 1. Get product IDs from the same categories
      const { data: relatedCats, error: catError } = await supabase
        .from('product_categories')
        .select('product_id')
        .in('category_id', categoryIds)
        .neq('product_id', currentProductId)
        .limit(20);

      if (catError) throw catError;

      if (!relatedCats || relatedCats.length === 0) return [];

      // Extract IDs and remove duplicates
      const ids = [...new Set(relatedCats.map(r => r.product_id))].slice(0, 4);

      if (ids.length === 0) return [];

      // 2. Fetch full product details
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', ids)
        .eq('is_active', true);

      if (error) throw error;

      const products = data as Product[];
      const catMap = await fetchProductCategories(products.map(p => p.id));

      return products.map(p => ({
        ...p,
        categories: catMap[p.id] || [],
        category: catMap[p.id]?.[0] || undefined,
      }));
    },
    enabled: !!currentProductId && categoryIds.length > 0,
  });
}
