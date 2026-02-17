import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones, Printer, Box, Layers, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ProductGrid } from '@/components/products/ProductGrid';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useFeaturedProducts, useCategories } from '@/hooks/useProducts';
import { usePacks } from '@/hooks/usePacks';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import logo from '@/assets/logo.png';
import { SEO } from '@/components/SEO';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useBanners } from '@/hooks/useContent';
import { HeroBanner } from '@/components/home/HeroBanner';
import { PromoBanner } from '@/components/home/PromoBanner';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function Index() {
  const { data: featuredProducts = [], isLoading: productsLoading } = useFeaturedProducts();
  const { data: categories = [] } = useCategories();
  const { data: allPacks = [] } = usePacks();
  const { user } = useAuth();
  const { addToCart, addPackToCart } = useCart();
  const { t, language } = useLanguage();
  const { data: settings } = useStoreSettings();

  /* Fetch Banners */
  const { data: banners = [] } = useBanners();
  const heroBanners = banners.filter(b => b.location === 'hero');
  const promoBanners = banners.filter(b => b.location === 'promo');

  const featuredPacks = allPacks.filter(p => p.is_featured).slice(0, 3);

  const features = [
    { icon: Truck, title: t.features.fastDelivery, description: t.features.fastDeliveryDesc },
    { icon: Shield, title: t.features.securePayment, description: t.features.securePaymentDesc },
    { icon: RefreshCw, title: t.features.qualityGuaranteed, description: t.features.qualityGuaranteedDesc },
    { icon: Headphones, title: t.features.support247, description: t.features.support247Desc },
  ];



  return (
    <Layout>
      <SEO
        title={t.hero.title1 + " " + t.hero.title2}
        description={t.hero.subtitle}
        schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Ibda3D - 3D Printing Algeria",
          "url": "https://www.ibda3d.shop",
          "logo": "https://www.ibda3d.shop/pwa-192x192.png",
          "description": t.hero.subtitle,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "DZ"
          },
          "sameAs": [
            settings?.social_facebook,
            settings?.social_instagram,
            settings?.social_twitter
          ].filter(Boolean),
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": settings?.contact_phone,
            "contactType": "customer service",
            "areaServed": "DZ",
            "availableLanguage": ["en", "ar", "fr"]
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.ibda3d.shop/products?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />

      {/* Hero Section */}
      <ScrollReveal>
        <HeroBanner banners={heroBanners} />
      </ScrollReveal>

      {/* Promo Banners */}
      <ScrollReveal delay={100}>
        <PromoBanner banners={promoBanners} />
      </ScrollReveal>

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

      {/* Featured Packs - CAROUSEL & FIRST */}
      {featuredPacks.length > 0 && (
        <section className="py-16">
          <ScrollReveal className="container mx-auto px-4">
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

            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {featuredPacks.map(pack => {
                  const individualTotal = pack.items?.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;
                  const savings = individualTotal > pack.price ? individualTotal - pack.price : 0;

                  const allImages: string[] = [];
                  if (pack.image_url) allImages.push(pack.image_url);
                  if (pack.items) {
                    for (const item of pack.items) {
                      if (item.product?.image_url && !allImages.includes(item.product.image_url)) {
                        allImages.push(item.product.image_url);
                      }
                    }
                  }

                  return (
                    <CarouselItem key={pack.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <Link to={`/packs/${pack.slug}`} className="block h-full">
                        <div className="group bg-card rounded-2xl overflow-hidden shadow-card border border-border h-full flex flex-col hover:shadow-lg transition-shadow">
                          <div className="relative aspect-video overflow-hidden bg-muted flex-shrink-0">
                            {allImages.length > 0 ? (
                              <div className="w-full h-full flex">
                                {allImages.slice(0, 4).map((img, i) => (
                                  <div key={i} className="relative flex-1 overflow-hidden" style={{ borderRight: i < Math.min(allImages.length, 4) - 1 ? '2px solid hsl(var(--border))' : 'none' }}>
                                    <OptimizedImage
                                      src={img}
                                      alt=""
                                      width={300}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                ))}
                                {allImages.length > 4 && (
                                  <div className="absolute bottom-2 end-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded-full">
                                    +{allImages.length - 4} {t.packs.more}
                                  </div>
                                )}
                              </div>
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
                          <div className="p-5 space-y-3 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {language === 'ar' ? (pack.name_ar || pack.name) : pack.name}
                            </h3>
                            {pack.items && pack.items.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {pack.items.map(item => (
                                  <Badge key={item.id} variant="secondary" className="text-xs">
                                    {(language === 'ar' && item.product && (item.product as any).name_ar) ? (item.product as any).name_ar : item.product?.name} ×{item.quantity}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="mt-auto pt-3">
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl font-bold text-foreground">{pack.price.toFixed(0)} {t.common.da}</span>
                                {pack.compare_at_price && pack.compare_at_price > pack.price && (
                                  <span className="text-sm text-muted-foreground line-through">{pack.compare_at_price.toFixed(0)} {t.common.da}</span>
                                )}
                              </div>
                              <Button
                                className="w-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addPackToCart.mutate({
                                    packId: pack.id,
                                    packDetails: pack // Pass pack details for guest cart
                                  });
                                }}
                                disabled={addPackToCart.isPending}
                              >
                                <ShoppingCart className="h-4 w-4 me-2" /> {t.products.addToCart}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </ScrollReveal>
        </section>
      )}

      {/* Featured Products - Grid & SECOND */}
      <section className="py-16 bg-muted/50">
        <ScrollReveal className="container mx-auto px-4">
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
        </ScrollReveal>
      </section>

      {/* Categories - CAROUSEL & THIRD */}
      {categories.length > 0 && (
        <section className="py-16 bg-muted/30">
          <ScrollReveal className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-foreground">{t.categories.shopByCategory}</h2>
              <Link to="/products">
                <Button variant="ghost">
                  {t.products.viewAll} <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {categories.filter(c => !c.parent_id).map((category) => (
                  <CarouselItem key={category.id} className="pl-4 basis-full xs:basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Link to={`/products?category=${category.slug}`} className="block group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                      {category.image_url ? (
                        <OptimizedImage
                          src={category.image_url}
                          alt={category.name}
                          width={400}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-dark" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
                      <div className="absolute bottom-4 start-4">
                        <h3 className="text-xl font-bold text-secondary-foreground">{category.name}</h3>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </ScrollReveal>
        </section>
      )}

      {/* CTA Section - Only for guests */}
      {!user && (
        <section className="py-20 bg-gradient-to-r from-secondary via-primary to-secondary text-white">
          <ScrollReveal className="container mx-auto px-4 text-center">
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
          </ScrollReveal>
        </section>
      )}
    </Layout>
  );
}
