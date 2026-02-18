import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from "@/lib/utils";

export default function Cart() {
  const { user } = useAuth();
  const { cartItems, cartTotal, isLoading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center sm:text-left selection:bg-primary/20">{t.cart?.title || "Shopping Cart"}</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="h-32 skeleton rounded-3xl" />))}
          </div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <div className="bg-muted/30 p-12 rounded-full h-48 w-48 mx-auto mb-8 flex items-center justify-center animate-in zoom-in duration-500">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/50" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">{t.cart?.emptyCart || "Your cart is empty"}</h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-sm mx-auto">{t.cart?.startShopping || "Looks like you haven't added anything to your cart yet."}</p>
          <Link to="/products">
            <Button size="xl" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
              {t.cart?.browseProducts || "Start Shopping"} <ArrowRight className="ms-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 group transition-colors">
          <div className="bg-muted/50 group-hover:bg-primary/10 p-2 rounded-full mr-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>{t.products?.backToProducts || "Continue Shopping"}</span>
        </Link>

        <h1 className="text-4xl font-extrabold text-foreground mb-10 tracking-tight">{t.cart?.title || "Shopping Cart"}</h1>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-8 space-y-6">
            {cartItems.map((item) => {
              const isPack = !!item.pack_id;
              const name = isPack
                ? (language === 'ar' ? (item.pack?.name_ar || item.pack?.name) : item.pack?.name)
                : (language === 'ar' ? (item.product?.name_ar || item.product?.name) : item.product?.name);
              const price = isPack ? (item.pack?.price || 0) : (item.product?.price || 0);
              const imageUrl = isPack ? item.pack?.image_url : item.product?.image_url;
              const linkTo = isPack ? `/packs/${item.pack?.slug}` : `/products/${item.product_id}`;

              return (
                <div key={item.id} className="group relative flex gap-4 sm:gap-6 p-4 sm:p-5 bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:bg-card/60">
                  <Link to={linkTo} className="block shrink-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-muted/50 border border-border/30">
                      {imageUrl ? (
                        <img src={imageUrl} alt={name || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{t.products?.noImage || "No Image"}</div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <Link to={linkTo} className="font-bold text-lg sm:text-xl text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {name}
                        </Link>
                        <button
                          onClick={() => removeFromCart.mutate(item.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors -mr-2 -mt-2"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {isPack && <span className="inline-block mt-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Pack</span>}

                      {/* Display Options */}
                      {(item.selected_color || item.selected_version || (item.selected_options && Object.keys(item.selected_options).length > 0)) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.selected_color && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50">
                              {t.products?.color || 'Color'}: <span className="text-foreground">{item.selected_color}</span>
                            </span>
                          )}
                          {item.selected_version && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50">
                              {t.products?.version || 'Version'}: <span className="text-foreground">{item.selected_version}</span>
                            </span>
                          )}
                          {item.selected_options && Object.entries(item.selected_options as Record<string, string>).map(([key, value]) => (
                            <span key={key} className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50">
                              {key}: <span className="text-foreground">{value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted/50 rounded-xl border border-border/50 p-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background shadow-none" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-bold font-mono text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background shadow-none" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })} disabled={!isPack && item.quantity >= (item.product?.stock_quantity || 0)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground font-medium">{price.toLocaleString()} {t.common?.da || "DA"}</p>
                        <p className="text-xl font-bold text-foreground">{(price * item.quantity).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t.common?.da || "DA"}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 shadow-sm space-y-6">
              <h2 className="text-2xl font-bold text-foreground">{t.cart?.orderSummary || "Order Summary"}</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart?.subtotal || "Subtotal"}</span>
                  <span className="font-mono">{cartTotal.toLocaleString()} {t.common?.da || "DA"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart?.shipping || "Shipping"}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md">{t.cart?.calculatedAtCheckout || "Calculated at checkout"}</span>
                </div>

                <div className="border-t border-border/50 pt-4 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-foreground">{t.cart?.total || "Total"}</span>
                    <span className="text-3xl font-extrabold text-primary">{cartTotal.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">{t.common?.da || "DA"}</span></span>
                  </div>
                </div>
              </div>

              <Button
                size="xl"
                className="w-full text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1"
                onClick={() => navigate('/checkout')}
              >
                {t.cart?.placeOrder || "Checkout"} <ArrowRight className="ms-2 h-5 w-5" />
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground/80 flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  {t.cart?.algeriaOnly || "Shipping to 58 Wilayas in Algeria"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 lg:hidden z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t.cart?.total || "Total"}:</span>
            <span className="text-xl font-bold text-primary">{cartTotal.toLocaleString()} DA</span>
          </div>
          <Button
            size="lg"
            className="flex-1 rounded-full shadow-lg font-bold"
            onClick={() => navigate('/checkout')}
          >
            {t.cart?.placeOrder || "Checkout"} <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
