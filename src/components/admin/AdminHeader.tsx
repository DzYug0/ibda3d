import { Bell, Search, PanelLeft, Menu, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { AdminSearch } from './AdminSearch';
import { useState } from 'react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useAdminOrders } from '@/hooks/useOrders';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (val: boolean) => void;
    title?: string;
}

export function AdminHeader({ collapsed, setCollapsed, mobileOpen, setMobileOpen, title }: AdminHeaderProps) {
    const { user, signOut } = useAuth();
    const [searchOpen, setSearchOpen] = useState(false);

    const { data: products = [] } = useAdminProducts();
    const { data: orders = [] } = useAdminOrders();

    const lowStockProducts = products.filter(p => p.stock_quantity <= 5);
    const pendingOrders = orders.filter(o => o.status === 'pending');

    // Combine notifications
    const notifications = [
        ...pendingOrders.map(o => ({
            id: o.id,
            title: 'New Order Pending',
            desc: `Order #${o.id.slice(0, 8)} needs processing`,
            link: `/admin/orders`,
            type: 'order'
        })),
        ...lowStockProducts.map(p => ({
            id: p.id,
            title: 'Low Stock Alert',
            desc: `${p.name} has only ${p.stock_quantity} left`,
            link: `/admin/products`,
            type: 'stock'
        }))
    ];

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Sidebar Toggle (Desktop) */}
            <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex -ml-2"
                onClick={() => setCollapsed(!collapsed)}
            >
                <PanelLeft className="h-5 w-5" />
            </Button>

            {/* Sidebar Toggle (Mobile) */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 flex justify-center max-w-xl mx-auto">
                <div
                    className="relative w-full max-w-md hidden sm:block"
                    onClick={() => setSearchOpen(true)}
                >
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <div className="h-9 w-full rounded-md border border-input bg-muted/50 pl-9 pr-4 text-sm text-muted-foreground flex items-center cursor-text hover:bg-muted/80 transition-colors">
                        Search products, orders... (Ctrl+K)
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 font-medium border-b border-border">Notifications</div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            ) : (
                                notifications.map((notif, i) => (
                                    <Link
                                        key={i}
                                        to={notif.link}
                                        className="block p-4 hover:bg-muted/50 border-b border-border last:border-0 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            {notif.type === 'stock' ? (
                                                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                                            ) : (
                                                <Bell className="h-4 w-4 text-blue-500 mt-0.5" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{notif.desc}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Admin</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AdminSearch open={searchOpen} setOpen={setSearchOpen} />
        </header>
    );
}
