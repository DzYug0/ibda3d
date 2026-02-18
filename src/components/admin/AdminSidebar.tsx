import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Package, FolderOpen, ShoppingBag, Users, History,
    PanelLeftClose, PanelLeft, Tag, Layout, Settings,
    Star, Truck, Boxes, LogOut, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';

export const baseNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: FolderOpen, label: 'Categories', path: '/admin/categories' },
    { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
    { icon: Truck, label: 'Shipping', path: '/admin/shipping' },
    { icon: Boxes, label: 'Packs', path: '/admin/packs' },
    { icon: Users, label: 'Customers', path: '/admin/users' },
];

export const ownerOnlyItems = [
    { icon: Tag, label: 'Marketing', path: '/admin/marketing' },
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
    { icon: History, label: 'Activity Log', path: '/admin/activity' },
];

interface AdminSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    isOwner: boolean;
    onNavigate?: () => void;
    className?: string;
}

export function AdminSidebar({ collapsed, setCollapsed, isOwner, onNavigate, className }: AdminSidebarProps) {
    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = isOwner ? [...baseNavItems, ...ownerOnlyItems] : baseNavItems;

    const SidebarLink = ({ item }: { item: typeof navItems[0] }) => {
        const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

        return (
            <Link
                to={item.path}
                onClick={onNavigate}
                className={cn(
                    "flex items-center gap-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                    collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
        );
    };

    return (
        <aside className={cn(
            "flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out z-30",
            collapsed ? "w-20" : "w-64",
            className
        )}>
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-border/50">
                <Link to="/" className="flex items-center gap-3 overflow-hidden group">
                    <div className="relative w-8 h-8 shrink-0 transition-transform duration-300 group-hover:rotate-12">
                        <img src={logo} alt="Ibda3D" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate animate-in fade-in slide-in-from-left-4 duration-500">
                            Admin Panel
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <TooltipProvider delayDuration={0}>
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {navItems.map((item) => (
                        collapsed ? (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                    <div><SidebarLink item={item} /></div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-medium" sideOffset={10}>
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <SidebarLink key={item.path} item={item} />
                        )
                    ))}
                </nav>
            </TooltipProvider>

            {/* Footer Actions */}
            <div className="p-3 border-t border-border/50 bg-muted/30">
                <div className="space-y-1">
                    {collapsed ? (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link to="/">
                                        <Button variant="ghost" size="icon" className="w-full h-10 hover:bg-background hover:shadow-sm">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">Back to Store</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-full h-10 hover:bg-destructive/10 hover:text-destructive" onClick={() => signOut()}>
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Sign Out</TooltipContent>
                            </Tooltip>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-full h-10 mt-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setCollapsed(!collapsed)}
                            >
                                <PanelLeft className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-background hover:shadow-sm" asChild>
                                <Link to="/">
                                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Back to Store</span>
                                </Link>
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-10 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                onClick={() => signOut()}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm">Sign Out</span>
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-10 mt-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setCollapsed(!collapsed)}
                            >
                                <PanelLeftClose className="h-4 w-4" />
                                <span className="text-sm">Collapse Sidebar</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
