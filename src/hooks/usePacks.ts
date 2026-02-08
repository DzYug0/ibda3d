import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Pack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  items?: PackItem[];
}

export interface PackItem {
  id: string;
  pack_id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  };
}

export function usePack(slug: string) {
  return useQuery({
    queryKey: ['pack', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packs')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      if (error) throw error;

      const pack = data as Pack;
      const { data: items, error: iError } = await supabase
        .from('pack_items')
        .select('*, product:products(id, name, slug, price, image_url)')
        .eq('pack_id', pack.id);
      if (iError) throw iError;

      return { ...pack, items: (items || []) as PackItem[] };
    },
    enabled: !!slug,
  });
}

export function usePacks() {
  return useQuery({
    queryKey: ['packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const packs = data as Pack[];
      if (packs.length === 0) return packs;

      // Fetch pack items with products
      const { data: items, error: iError } = await supabase
        .from('pack_items')
        .select('*, product:products(id, name, slug, price, image_url)')
        .in('pack_id', packs.map(p => p.id));
      if (iError) throw iError;

      const itemMap: Record<string, PackItem[]> = {};
      for (const item of (items || [])) {
        if (!itemMap[item.pack_id]) itemMap[item.pack_id] = [];
        itemMap[item.pack_id].push(item as PackItem);
      }

      return packs.map(p => ({ ...p, items: itemMap[p.id] || [] }));
    },
  });
}

export function useAdminPacks() {
  return useQuery({
    queryKey: ['admin-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const packs = data as Pack[];
      if (packs.length === 0) return packs;

      const { data: items, error: iError } = await supabase
        .from('pack_items')
        .select('*, product:products(id, name, slug, price, image_url)')
        .in('pack_id', packs.map(p => p.id));
      if (iError) throw iError;

      const itemMap: Record<string, PackItem[]> = {};
      for (const item of (items || [])) {
        if (!itemMap[item.pack_id]) itemMap[item.pack_id] = [];
        itemMap[item.pack_id].push(item as PackItem);
      }

      return packs.map(p => ({ ...p, items: itemMap[p.id] || [] }));
    },
  });
}

export function useCreatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, ...pack }: Omit<Pack, 'id' | 'created_at' | 'items'> & { items: { product_id: string; quantity: number }[] }) => {
      const { data, error } = await supabase
        .from('packs')
        .insert(pack)
        .select()
        .single();
      if (error) throw error;

      if (items.length > 0) {
        const { error: iError } = await supabase
          .from('pack_items')
          .insert(items.map(i => ({ pack_id: data.id, ...i })));
        if (iError) throw iError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-packs'] });
      toast.success('Pack created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create pack: ' + error.message);
    },
  });
}

export function useUpdatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items, ...pack }: Omit<Partial<Pack>, 'items'> & { id: string; items?: { product_id: string; quantity: number }[] }) => {
      const { data, error } = await supabase
        .from('packs')
        .update(pack)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (items !== undefined) {
        await supabase.from('pack_items').delete().eq('pack_id', id);
        if (items.length > 0) {
          const { error: iError } = await supabase
            .from('pack_items')
            .insert(items.map(i => ({ pack_id: id, ...i })));
          if (iError) throw iError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-packs'] });
      toast.success('Pack updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update pack: ' + error.message);
    },
  });
}

export function useDeletePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('packs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-packs'] });
      toast.success('Pack deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete pack: ' + error.message);
    },
  });
}
