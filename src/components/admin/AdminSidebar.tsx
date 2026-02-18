import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Settings,
    Truck,
    Star,
    Tags,
    Image as ImageIcon,
    History,
    LogOut,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

interface AdminSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    isOwner?: boolean;
}

export function AdminSidebar({ collapsed, setCollapsed, isOwner }: AdminSidebarProps) {
    const location = useLocation();
    const { signOut } = useAuth();

    const navGroups = [
        {
            label: 'Overview',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
                { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
                { icon: Users, label: 'Customers', path: '/admin/users' },
            ]
        },
        {
            label: 'Catalog',
            items: [
                { icon: Package, label: 'Products', path: '/admin/products' },
                { icon: Tags, label: 'Categories', path: '/admin/categories' },
                { icon: Star, label: 'Reviews', path: '/admin/reviews' },
                { icon: Package, label: 'Packs', path: '/admin/packs' }, // Reusing Package icon for now, ideally Box
            ]
        },
        {
            label: 'Management',
            items: [
                { icon: Truck, label: 'Shipping', path: '/admin/shipping' },
                ...(isOwner ? [
                    { icon: Tags, label: 'Marketing', path: '/admin/marketing' },
                    { icon: ImageIcon, label: 'Content', path: '/admin/content' },
                    { icon: History, label: 'Activity', path: '/admin/activity' },
                ] : [])
            ]
        }
    ];

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
                collapsed ? "w-[70px]" : "w-64"
            )}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-4 border-b border-border">
                <Link to="/" className="flex items-center gap-2 overflow-hidden">
                    <img src={logo} alt="Ibda3D" className="h-8 w-8 shrink-0 object-contain" />
                    {!collapsed && <span className="font-bold text-xl tracking-tight">Admin</span>}
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {navGroups.map((group, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {group.label}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            collapsed && "justify-center px-0"
                                        )}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        {!collapsed && <span>{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border space-y-1 bg-card">
                <Link to="/">
                    <Button variant="ghost" className={cn("w-full justify-start text-muted-foreground", collapsed && "justify-center px-0")} title="Back to Store">
                        <ChevronLeft className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="ml-2">Back to Store</span>}
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "justify-center px-0")}
                    onClick={() => signOut()}
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-2">Sign Out</span>}
                </Button>
            </div>
        </aside>
    );
}
