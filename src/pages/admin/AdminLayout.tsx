import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Mobile Sidebar (Drawer) */}
        {isMobile && (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[280px] border-r border-border">
              <AdminSidebar collapsed={false} setCollapsed={() => { }} isOwner={isOwner} />
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} isOwner={isOwner} />
        </div>

        {/* Main Content Area */}
        <div className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          !isMobile && (collapsed ? "pl-[70px]" : "pl-64")
        )}>
          <AdminHeader
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <main className="flex-1 p-6 md:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
