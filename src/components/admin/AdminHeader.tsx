import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Bell } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminSearch } from './AdminSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';

interface AdminHeaderProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    isOwner: boolean;
}

export function AdminHeader({ mobileOpen, setMobileOpen, isOwner }: AdminHeaderProps) {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <header className="sticky top-0 z-20 h-16 bg-background/80backdrop-blur-md border-b border-border/50 px-6 flex items-center justify-between gap-4 transition-all duration-300">

            {/* Mobile Menu Trigger */}
            <div className="flex items-center gap-4 lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-r border-border/50">
                        <AdminSidebar
                            collapsed={false}
                            setCollapsed={() => { }}
                            isOwner={isOwner}
                            onNavigate={() => setMobileOpen(false)}
                            className="w-full border-none bg-transparent"
                        />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="flex-1 flex justify-start">
                <AdminSearch />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <ThemeToggle />

                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full" />
                </Button>

                <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

                <div className="flex items-center gap-3 pl-1">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium leading-none">{user?.user_metadata?.username || 'Admin'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isOwner ? 'Store Owner' : 'Administrator'}</p>
                    </div>
                    <Avatar className="h-9 w-9 border border-border transition-transform hover:scale-105 cursor-pointer">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'A'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
