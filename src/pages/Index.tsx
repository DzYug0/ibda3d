import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones, Printer, Box, Layers, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts, useCategories } from '@/hooks/useProducts';
import { usePacks } from '@/hooks/usePacks';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import logo from '@/assets/logo.png';
import { SEO } from '@/components/SEO';

export default function Index() {
  const { data: featuredProducts = [], isLoading: productsLoading } = useFeaturedProducts();
  const { data: categories = [] } = useCategories();
  const { data: allPacks = [] } = usePacks();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const featuredPacks = allPacks.filter(p => p.is_featured).slice(0, 3);

  const features = [
    { icon: Truck, title: t.features.fastDelivery, description: t.features.fastDeliveryDesc },
    { icon: Shield, title: t.features.securePayment, description: t.features.securePaymentDesc },
    { icon: RefreshCw, title: t.features.qualityGuaranteed, description: t.features.qualityGuaranteedDesc },
    { icon: Headphones, title: t.features.support247, description: t.features.support247Desc },
  ];

  const handleAddPackToCart = (pack: typeof allPacks[0], qty: number) => {
    if (!user || !pack.items) return;
    for (let i = 0; i < qty; i++) {
      for (const item of pack.items) {
        addToCart.mutate({ productId: item.product_id, quantity: item.quantity });
      }
    }
  };

  return (
    <Layout>
      <SEO
        title={t.hero.title1 + " " + t.hero.title2}
        description={t.hero.subtitle}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/30 blur-3xl animate-pulse" />
          <div className="absolute top-40 right-10 w-96 h-96 rounded-full bg-secondary/40 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-64 h-64 rounded-full bg-accent/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-destructive/20 blur-3xl" />
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 sm:py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up text-center lg:text-start">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Printer className="h-4 w-4 text-accent" />
                <span className="text-sm text-white/90 font-medium">{t.hero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-white">
                {t.hero.title1}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-accent">
                  {t.hero.title2}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link to="/products">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 shadow-lg hover:shadow-xl transition-all">
                    {t.hero.discover} <ArrowRight className="ms-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                    {t.hero.ourCategories}
                  </Button>
                </Link>
              </div>

              <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">58</div>
                  <div className="text-sm text-white/60">{t.hero.wilayas}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-white/60">{t.hero.support}</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl scale-150" />
                <img src={logo} alt="Ibda3D" className="relative w-80 h-80 object-contain drop-shadow-2xl animate-fade-in" />
              </div>
              <div className="absolute top-10 right-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                <Box className="h-8 w-8 text-accent" />
              </div>
              <div className="absolute bottom-20 left-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                <Layers className="h-8 w-8 text-white" />
              </div>
              <div className="absolute bottom-10 right-20 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                <Printer className="h-8 w-8 text-destructive" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 text-center sm:text-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{feature.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{t.products.featuredProducts}</h2>
              <p className="text-muted-foreground mt-2">{t.products.handpicked}</p>
            </div>
            <Link to="/products">
              <Button variant="outline">
                {t.products.viewAll} <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={featuredProducts} isLoading={productsLoading} />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-foreground">{t.categories.shopByCategory}</h2>
              <Link to="/products">
                <Button variant="ghost">
                  {t.products.viewAll} <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category) => (
                <Link key={category.id} to={`/products?category=${category.slug}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-dark" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
                  <div className="absolute bottom-4 start-4">
                    <h3 className="text-xl font-bold text-secondary-foreground">{category.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Packs */}
      {featuredPacks.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{t.packs.featuredPacks}</h2>
                <p className="text-muted-foreground mt-2">{t.packs.featuredPacksDesc}</p>
              </div>
              <Link to="/packs">
                <Button variant="outline">
                  {t.packs.viewAllPacks} <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPacks.map(pack => {
                const individualTotal = pack.items?.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;
                const savings = individualTotal > pack.price ? individualTotal - pack.price : 0;
                return (
                  <div key={pack.id} className="group bg-card rounded-2xl overflow-hidden shadow-card border border-border">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {pack.image_url ? (
                        <img src={pack.image_url} alt={pack.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {savings > 0 && (
                        <div className="absolute top-3 start-3">
                          <Badge className="bg-success text-success-foreground">{t.packs.save} {savings.toFixed(0)} {t.common.da}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-xl font-bold text-foreground">{pack.name}</h3>
                      {pack.items && pack.items.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pack.items.map(item => (
                            <Badge key={item.id} variant="secondary" className="text-xs">
                              {item.product?.name} ×{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{pack.price.toFixed(0)} {t.common.da}</span>
                        {pack.compare_at_price && pack.compare_at_price > pack.price && (
                          <span className="text-sm text-muted-foreground line-through">{pack.compare_at_price.toFixed(0)} {t.common.da}</span>
                        )}
                      </div>
                      {user ? (
                        <Button className="w-full" onClick={() => handleAddPackToCart(pack, 1)} disabled={addToCart.isPending}>
                          <ShoppingCart className="h-4 w-4 me-2" /> {t.products.addToCart}
                        </Button>
                      ) : (
                        <Link to="/auth" className="block">
                          <Button className="w-full">{t.products.signInToShop}</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary via-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Printer className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">{t.cta.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.cta.title}</h2>
          <p className="text-white/70 max-w-md mx-auto mb-8">{t.cta.subtitle}</p>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 shadow-lg">
              {t.cta.createAccount}
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
