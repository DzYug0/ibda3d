import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Footer() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: settings } = useStoreSettings();

  const currentYear = new Date().getFullYear();
  const storeName = settings?.store_name || 'Ibda3D';

  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Social */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt={storeName} className="h-10 w-auto object-contain" />
              <span className="font-bold text-xl">{storeName}</span>
            </Link>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
            <div className="flex gap-4 pt-2">
              {settings?.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings?.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings?.social_twitter && (
                <a
                  href={settings.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">{t.footer.shop}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/products" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.allProducts}</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.featured}</Link></li>
              <li><Link to="/products?sort=newest" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.newArrivals}</Link></li>
              <li><Link to="/packs" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.packs.menuLink}</Link></li>
            </ul>
          </div>

          {/* Account Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">{t.footer.account}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              {user ? (
                <>
                  <li><Link to="/profile" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.header.profile}</Link></li>
                  <li><Link to="/orders" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.orderHistory}</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/auth" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.signIn}</Link></li>
                  <li><Link to="/auth?tab=signup" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.createAccount}</Link></li>
                </>
              )}
              <li><Link to="/cart" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.footer.shoppingCart}</Link></li>
              <li><Link to="/wishlist" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{t.header.wishlist}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">{t.footer.contact}</h4>
            <div className="space-y-3 text-sm text-secondary-foreground/70">
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
                  <div className="bg-secondary-foreground/5 p-2 rounded-md group-hover:bg-primary/10 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span>{settings.contact_email}</span>
                </a>
              )}
              {settings?.contact_phone && (
                <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
                  <div className="bg-secondary-foreground/5 p-2 rounded-md group-hover:bg-primary/10 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span dir="ltr">{settings.contact_phone}</span>
                </a>
              )}
              <div className="flex items-center gap-3">
                <div className="bg-secondary-foreground/5 p-2 rounded-md">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>{t.footer.deliveryAll58}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/50">
          <p>© {currentYear} {storeName}. {t.footer.allRightsReserved}</p>
          <div className="flex gap-6">
            <Link to="/policy" className="hover:text-secondary-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-secondary-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
