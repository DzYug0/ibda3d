import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Menu, X, Search, ShoppingCart, User, Heart,
    Package, Home, Grid, LogOut, ChevronRight, Facebook, Instagram, Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCategories } from '@/hooks/useProducts';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logo from '@/assets/logo.png';

export function MobileMenu() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { user, isAdmin, signOut } = useAuth();
    const { cartCount } = useCart();
    const { t, language } = useLanguage();
    const { data: categories = [] } = useCategories();
    const { data: settings } = useStoreSettings();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setOpen(false);
            setSearchQuery('');
        }
    };

    const closeMenu = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
                            <img src={logo} alt="Ibda3D" className="h-8 w-auto" />
                        </Link>
                        <ThemeToggle />
                    </div>
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                </SheetHeader>

                <div className="p-4 pb-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t.common?.search || "Search..."}
                            className="pl-9 bg-muted/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                <ScrollArea className="flex-1 px-4">
                    <nav className="flex flex-col gap-1 py-2">
                        <Link
                            to="/"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                        >
                            <Home className="h-4 w-4" />
                            {t.nav.home}
                        </Link>

                        <Link
                            to="/products"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                        >
                            <Package className="h-4 w-4" />
                            {t.nav.allProducts}
                        </Link>

                        <Link
                            to="/packs"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                        >
                            <Grid className="h-4 w-4" />
                            {t.nav.packs}
                        </Link>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="categories" className="border-none">
                                <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:bg-muted hover:no-underline rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Grid className="h-4 w-4" />
                                        {t.nav.categories}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-10 pr-2 pb-2">
                                    <div className="flex flex-col gap-1 border-l-2 border-border pl-2">
                                        <Link
                                            to="/categories"
                                            onClick={closeMenu}
                                            className="flex items-center justify-between py-1.5 px-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {(t.common as any)?.viewAll || "View All"} <ChevronRight className="h-3 w-3" />
                                        </Link>
                                        {categories.filter(c => !c.parent_id).map(category => (
                                            <Link
                                                key={category.id}
                                                to={`/products?category=${category.slug}`}
                                                onClick={closeMenu}
                                                className="py-1.5 px-2 text-sm text-muted-foreground hover:text-primary transition-colors block"
                                            >
                                                {language === 'ar' ? ((category as any).name_ar || category.name) : category.name}
                                            </Link>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </nav>

                    <Separator className="my-4" />

                    <div className="space-y-1">
                        <Link
                            to="/cart"
                            onClick={closeMenu}
                            className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="h-4 w-4" />
                                {t.nav.cart}
                            </div>
                            {cartCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to="/profile"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                                >
                                    <User className="h-4 w-4" />
                                    {t.nav.myProfile}
                                </Link>
                                <Link
                                    to="/orders"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                                >
                                    <Package className="h-4 w-4" />
                                    {t.nav.myOrders}
                                </Link>
                                <Link
                                    to="/wishlist"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                                >
                                    <Heart className="h-4 w-4" />
                                    {t.wishlist?.title || 'Wishlist'}
                                </Link>

                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={closeMenu}
                                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-primary transition-colors"
                                    >
                                        <Grid className="h-4 w-4" />
                                        {t.nav.adminDashboard}
                                    </Link>
                                )}

                                <button
                                    onClick={() => { signOut(); closeMenu(); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t.nav.signOut}
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 mt-2 px-1">
                                <Link to="/auth" onClick={closeMenu}>
                                    <Button variant="outline" className="w-full justify-center">
                                        {t.nav.signIn}
                                    </Button>
                                </Link>
                                <Link to="/auth?tab=signup" onClick={closeMenu}>
                                    <Button className="w-full justify-center">
                                        {t.nav.signUp}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 px-3">
                        <LanguageSwitcher className="w-full justify-between" />
                    </div>

                    {/* Social Links from Settings */}
                    {settings && (
                        <div className="mt-8 flex justify-center gap-4 pb-8 text-muted-foreground">
                            {settings.social_facebook && (
                                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                                    <Facebook className="h-5 w-5" />
                                </a>
                            )}
                            {settings.social_instagram && (
                                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                            {settings.social_twitter && (
                                <a href={settings.social_twitter} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                                    <Twitter className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
