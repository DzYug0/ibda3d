import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import logo from '@/assets/logo.png';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Ibda3D" className="h-10 w-auto" />
            </Link>
            <p className="text-secondary-foreground/70 text-sm">
              {t.footer.tagline}
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t.footer.shop}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/products" className="hover:text-secondary-foreground transition-colors">{t.footer.allProducts}</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-secondary-foreground transition-colors">{t.footer.featured}</Link></li>
              <li><Link to="/products" className="hover:text-secondary-foreground transition-colors">{t.footer.newArrivals}</Link></li>
              <li><Link to="/products" className="hover:text-secondary-foreground transition-colors">{t.footer.sale}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t.footer.account}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/auth" className="hover:text-secondary-foreground transition-colors">{t.footer.signIn}</Link></li>
              <li><Link to="/auth?tab=signup" className="hover:text-secondary-foreground transition-colors">{t.footer.createAccount}</Link></li>
              <li><Link to="/orders" className="hover:text-secondary-foreground transition-colors">{t.footer.orderHistory}</Link></li>
              <li><Link to="/cart" className="hover:text-secondary-foreground transition-colors">{t.footer.shoppingCart}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t.footer.contact}</h4>
            <div className="space-y-2 text-sm text-secondary-foreground/70">
              <p>
                <a href="mailto:dbmohamed410@gmail.com" className="hover:text-secondary-foreground transition-colors">
                  Email: dbmohamed410@gmail.com
                </a>
              </p>
              <p>
                <a href="https://wa.me/213796720677" target="_blank" rel="noopener noreferrer" className="hover:text-secondary-foreground transition-colors">
                  WhatsApp: +213 796 720 677
                </a>
              </p>
              <p>{t.footer.deliveryAll58}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 pt-8 text-center text-sm text-secondary-foreground/50">
          © {new Date().getFullYear()} Ibda3D. {t.footer.allRightsReserved}
        </div>
      </div>
    </footer>
  );
}
