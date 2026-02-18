import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { OrderHistory } from '@/components/profile/OrderHistory';

export default function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.cart.pleaseSignIn}</h1>
          <p className="text-muted-foreground mb-6">{t.orders.signInOrders}</p>
          <Link to="/auth"><Button size="lg">{t.nav.signIn}</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.orders.title}</h1>
        <p className="text-muted-foreground mb-8">
          Track and manage your recent orders.
        </p>

        <OrderHistory />
      </div>
    </Layout>
  );
}
