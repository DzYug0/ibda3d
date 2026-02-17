import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Cart() {
  const { user } = useAuth();
  const { cartItems, cartTotal, isLoading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // if (!user) block removed for guest access

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">{t.cart.title}</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="h-24 skeleton rounded-xl" />))}
          </div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.cart.emptyCart}</h1>
          <p className="text-muted-foreground mb-6">{t.cart.startShopping}</p>
          <Link to="/products">
            <Button size="lg">{t.cart.browseProducts} <ArrowRight className="ms-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t.cart.title}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const isPack = !!item.pack_id;
              const name = isPack
                ? (language === 'ar' ? (item.pack?.name_ar || item.pack?.name) : item.pack?.name)
                : (language === 'ar' ? (item.product?.name_ar || item.product?.name) : item.product?.name);
              const price = isPack ? (item.pack?.price || 0) : (item.product?.price || 0);
              const imageUrl = isPack ? item.pack?.image_url : item.product?.image_url;
              const linkTo = isPack ? `/packs/${item.pack?.slug}` : `/products/${item.product_id}`;

              return (
                <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl border border-border">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{t.products.noImage}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={linkTo} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                      {name}
                    </Link>
                    {isPack && <span className="text-xs text-muted-foreground ml-2">({t.packs.title})</span>}

                    {/* Display Options */}
                    {(item.selected_color || item.selected_version) && (
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        {item.selected_color && <span>{t.products.color || 'Color'}: {item.selected_color}</span>}
                        {item.selected_version && <span>{t.products.version || 'Version'}: {item.selected_version}</span>}
                      </div>
                    )}

                    <p className="text-lg font-bold text-foreground mt-1">{price.toFixed(0)} {t.common.da}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })} disabled={!isPack && item.quantity >= (item.product?.stock_quantity || 0)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeFromCart.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="font-bold text-foreground">{(price * item.quantity).toFixed(0)} {t.common.da}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-4">{t.cart.orderSummary}</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart.subtotal}</span>
                  <span>{cartTotal.toFixed(0)} {t.common.da}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart.shipping}</span>
                  <span>{t.cart.calculatedAtCheckout}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>{t.cart.total}</span>
                    <span>{cartTotal.toFixed(0)} {t.common.da}</span>
                  </div>
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate('/checkout')}>
                {t.cart.placeOrder}
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-4">{t.cart.algeriaOnly}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
