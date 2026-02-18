import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils'; // Ensure cn is imported if used, otherwise remove it if not needed

export default function AdminLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: isOwner = false } = useQuery({
    queryKey: ['is-owner', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_owner', { _user_id: user.id });
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block h-screen sticky top-0 z-30">
        <AdminSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isOwner={isOwner}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          isOwner={isOwner}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

