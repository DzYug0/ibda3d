import { Link } from 'react-router-dom';
import { ShoppingCart, User, Search, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchDialog } from '@/components/SearchDialog';
import logo from '@/assets/logo.png';

import { MobileMenu } from './MobileMenu';

export function Header() {
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
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

