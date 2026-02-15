import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShippingCompany {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  id: string;
  company_id: string;
  wilaya_code: string;
  desk_price: number;
  home_price: number;
  created_at: string;
  updated_at: string;
}

export function useShippingCompanies() {
  return useQuery({
    queryKey: ['shipping-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as ShippingCompany[];
    },
  });
}

export function useActiveShippingCompanies() {
  return useQuery({
    queryKey: ['shipping-companies', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_companies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as ShippingCompany[];
    },
  });
}

export function useShippingRates(companyId?: string) {
  return useQuery({
    queryKey: ['shipping-rates', companyId],
    queryFn: async () => {
      let query = supabase.from('shipping_rates').select('*');
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query.order('wilaya_code');
      if (error) throw error;
      return data as ShippingRate[];
    },
    enabled: !companyId || companyId.length > 0,
  });
}

export function useCreateShippingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('shipping_companies')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-companies'] });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'shipping_company_create',
          target_type: 'shipping_company',
          target_id: data.id,
          details: { name: variables },
        });
      }

      toast.success('Shipping company added');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
}

export function useUpdateShippingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, is_active, logo_url }: { id: string; name?: string; is_active?: boolean; logo_url?: string | null }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (is_active !== undefined) updates.is_active = is_active;
      if (logo_url !== undefined) updates.logo_url = logo_url;
      const { error } = await supabase.from('shipping_companies').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-companies'] });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'shipping_company_update',
          target_type: 'shipping_company',
          target_id: variables.id,
          details: { updates: variables },
        });
      }

      toast.success('Company updated');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
}

export function useDeleteShippingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-companies'] });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'shipping_company_delete',
          target_type: 'shipping_company',
          target_id: variables,
          details: { company_id: variables },
        });
      }

      toast.success('Company deleted');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
}

export function useUpsertShippingRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rate: { company_id: string; wilaya_code: string; desk_price: number; home_price: number }) => {
      const { error } = await supabase
        .from('shipping_rates')
        .upsert(rate, { onConflict: 'company_id,wilaya_code' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast.success('Rate saved');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
}

export function useBulkUpsertShippingRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rates: { company_id: string; wilaya_code: string; desk_price: number; home_price: number }[]) => {
      const { error } = await supabase
        .from('shipping_rates')
        .upsert(rates, { onConflict: 'company_id,wilaya_code' });
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'shipping_rates_update',
          target_type: 'shipping_rates',
          target_id: variables[0]?.company_id || null,
          details: { count: variables.length, company_id: variables[0]?.company_id },
        });
      }

      toast.success('Rates saved');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
}
