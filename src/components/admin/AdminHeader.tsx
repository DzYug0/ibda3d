import { Bell, Search, PanelLeft, Menu, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSearch } from './AdminSearch';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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
    const navigate = useNavigate();

    // Mock notifications for now
    const notifications = [
        { id: 1, title: 'New Order #1023', time: '5 min ago', unread: true },
        { id: 2, title: 'Low Stock: White Filament', time: '1 hour ago', unread: true },
        { id: 3, title: 'New Review on Printer', time: '2 hours ago', unread: true },
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
                            {notifications.some(n => n.unread) && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span className="font-semibold text-sm">Notifications</span>
                            <span className="text-xs text-muted-foreground">{notifications.length} new</span>
                        </div>
                        <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div key={notification.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Inbox className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{notification.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No new notifications
                                </div>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-border">
                                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/admin/orders')}>
                                    View all activity
                                </Button>
                            </div>
                        )}
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
                                <p className="text-sm font-medium leading-none">Admin User</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                            Settings
                        </DropdownMenuItem>
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
