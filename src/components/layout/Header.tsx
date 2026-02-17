import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchDialog } from '@/components/SearchDialog';
import logo from '@/assets/logo.png';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Ibda3D" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t.nav.home}
            </Link>
            <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t.nav.allProducts}
            </Link>
            <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t.nav.categories}
            </Link>
            <Link to="/packs" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t.nav.packs}
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:flex" />
            <ThemeToggle className="hidden md:flex" />
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Cart Button - Visible to everyone */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative hidden md:flex">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce-in">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm">{t.nav.admin}</Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
                  </Link>
                  <Link to="/wishlist">
                    <Button variant="ghost" size="icon" className="relative">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="ghost" size="sm">{t.nav.myOrders}</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    {t.nav.signOut}
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost">{t.nav.signIn}</Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button>{t.nav.signUp}</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mx-4 mb-2">
                <LanguageSwitcher variant="outline" />
                <ThemeToggle />
              </div>
              <button
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                onClick={() => { setSearchOpen(true); setMobileMenuOpen(false); }}
              >
                <Search className="h-4 w-4" /> {t.common.search}
              </button>
              <Link to="/" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.home}
              </Link>
              <Link to="/products" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.allProducts}
              </Link>
              <Link to="/categories" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.categories}
              </Link>
              <Link to="/packs" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.packs}
              </Link>

              <Link to="/cart" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingCart className="h-4 w-4" /> {t.nav.cart} ({cartCount})
              </Link>

              {user ? (
                <>
                  <Link to="/profile" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4" /> {t.nav.myProfile}
                  </Link>
                  <Link to="/wishlist" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Heart className="h-4 w-4" /> {t.wishlist?.title || 'Wishlist'}
                  </Link>
                  <Link to="/orders" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.myOrders}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      {t.nav.adminDashboard}
                    </Link>
                  )}
                  <button className="px-4 py-2 text-left text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                    {t.nav.signOut}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.signIn}
                  </Link>
                  <Link to="/auth?tab=signup" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.signUp}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
