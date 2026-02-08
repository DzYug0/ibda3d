import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, ShoppingBag, Users, History, ChevronLeft, LogOut, Truck, Boxes, PanelLeftClose, PanelLeft, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const baseNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: FolderOpen, label: 'Categories', path: '/admin/categories' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: Truck, label: 'Shipping', path: '/admin/shipping' },
  { icon: Boxes, label: 'Packs', path: '/admin/packs' },
  { icon: Users, label: 'Users', path: '/admin/users' },
];

const ownerOnlyItems = [
  { icon: History, label: 'Activity Log', path: '/admin/activity' },
];

function SidebarNav({ navItems, location, collapsed, onNavigate }: {
  navItems: typeof baseNavItems;
  location: ReturnType<typeof useLocation>;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cn("flex-1 space-y-1", collapsed ? "p-2" : "p-4")}>
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/admin' && location.pathname.startsWith(item.path));

        const linkContent = (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors",
              collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }
        return <div key={item.path}>{linkContent}</div>;
      })}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();
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

  const navItems = isOwner ? [...baseNavItems, ...ownerOnlyItems] : baseNavItems;

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

  const sidebarFooter = (onNavigate?: () => void) => (
    <div className="border-t border-sidebar-border space-y-2 p-4">
      <Link to="/" onClick={onNavigate}>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Store
        </Button>
      </Link>
      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => { signOut(); onNavigate?.(); }}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  // Mobile layout with sheet
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <div className="p-4 border-b border-sidebar-border">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <img src={logo} alt="Ibda3D" className="h-8 w-8 shrink-0 object-contain" />
                  <span className="text-lg font-bold">Admin</span>
                </Link>
              </div>
              <SidebarNav navItems={navItems} location={location} onNavigate={() => setMobileOpen(false)} />
              {sidebarFooter(() => setMobileOpen(false))}
            </SheetContent>
          </Sheet>
          <span className="font-bold text-sm">Admin Panel</span>
          <Link to="/">
            <img src={logo} alt="Ibda3D" className="h-7 w-7 object-contain" />
          </Link>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop layout with collapsible sidebar
  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-muted/30">
        <aside className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}>
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              <img src={logo} alt="Ibda3D" className="h-8 w-8 shrink-0 object-contain" />
              {!collapsed && <span className="text-lg font-bold whitespace-nowrap">Admin</span>}
            </Link>
          </div>

          <SidebarNav navItems={navItems} location={location} collapsed={collapsed} />

          <div className={cn("border-t border-sidebar-border space-y-2", collapsed ? "p-2" : "p-4")}>
            {collapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/">
                      <Button variant="ghost" size="icon" className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Back to Store</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => signOut()}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Store
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className={cn("w-full text-sidebar-foreground/70 hover:text-sidebar-foreground", !collapsed && "justify-start")}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4 mr-2" />Collapse</>}
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
