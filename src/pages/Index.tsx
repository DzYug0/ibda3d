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
  CarouselDots,
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
    { icon: Truck, title: t.features.fastDelivery, description: t.features.fastDeliveryDesc, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Shield, title: t.features.securePayment, description: t.features.securePaymentDesc, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: RefreshCw, title: t.features.qualityGuaranteed, description: t.features.qualityGuaranteedDesc, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Headphones, title: t.features.support247, description: t.features.support247Desc, color: "text-amber-500", bg: "bg-amber-500/10" },
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
          ].filter(Boolean) as string[],
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
      <ScrollReveal className="relative z-10">
        <HeroBanner banners={heroBanners} />
      </ScrollReveal>

      {/* Features - Floating Cards */}
      <section className="py-12 relative z-20 container mx-auto px-4 mt-8">
        <ScrollReveal delay={100} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-4 sm:p-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-3 text-center sm:text-start group">
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight mb-1">{feature.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{feature.description}</p>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* Promo Banners */}
      {promoBanners.length > 0 && (
        <section className="py-8">
          <ScrollReveal delay={100}>
            <PromoBanner banners={promoBanners} />
          </ScrollReveal>
        </section>
      )}

      {/* Featured Packs */}
      {featuredPacks.length > 0 && (
        <section className="py-12 md:py-20 relative z-10">
          <ScrollReveal className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30 px-4 py-1 rounded-full text-sm">Best Value</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t.packs.featuredPacks}</h2>
              <p className="text-muted-foreground text-lg">{t.packs.featuredPacksDesc}</p>
            </div>

            <Carousel opts={{ align: "center", loop: false }} className="w-full max-w-6xl mx-auto">
              <CarouselContent className="-ml-6 py-8 justify-center">
                {featuredPacks.map(pack => {
                  const individualTotal = pack.items?.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;
                  const savings = individualTotal > pack.price ? individualTotal - pack.price : 0;
                  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

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
                    <CarouselItem key={pack.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3 max-w-md">
                      <Link to={`/packs/${pack.slug}`} className="block h-full group">
                        <div className="bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-border/50 h-full flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative">
                          {/* Floating Badge */}
                          {savings > 0 && (
                            <div className="absolute top-4 right-4 z-20">
                              <Badge className="bg-success text-success-foreground text-sm font-bold px-3 py-1 shadow-lg shadow-success/20">
                                Save {savingsPercent}%
                              </Badge>
                            </div>
                          )}

                          <div className="relative aspect-[4/3] overflow-hidden bg-muted flex-shrink-0">
                            {allImages.length > 0 ? (
                              <div className="w-full h-full p-2 grid grid-cols-2 grid-rows-2 gap-2">
                                <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden">
                                  <OptimizedImage
                                    src={allImages[0]}
                                    alt={pack.name}
                                    width={400}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                  />
                                  {/* Overlay generic items if more than 1 */}
                                  {allImages.length > 1 && (
                                    <div className="absolute bottom-2 right-2 flex -space-x-3">
                                      {allImages.slice(1, 4).map((img, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white">
                                          <OptimizedImage src={img} alt="" width={50} className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                      {allImages.length > 4 && (
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-black/80 text-white text-[10px] flex items-center justify-center font-bold">
                                          +{allImages.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                <Package className="h-16 w-16 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          <div className="p-6 flex flex-col flex-1 relative">
                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                                {language === 'ar' ? (pack.name_ar || pack.name) : pack.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{pack.description}</p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                              <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground line-through decoration-red-500/50">{individualTotal.toFixed(0)} DA</span>
                                <span className="text-2xl font-bold text-primary">{pack.price.toFixed(0)} <span className="text-sm font-normal text-foreground">DA</span></span>
                              </div>
                              <Button
                                size="icon"
                                className="h-12 w-12 rounded-full shadow-lg bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addPackToCart.mutate({ packId: pack.id, packDetails: pack });
                                }}
                              >
                                <ShoppingCart className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="flex justify-center mt-8">
                <CarouselDots />
              </div>
            </Carousel>
          </ScrollReveal>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 md:py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <ScrollReveal className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t.products.featuredProducts}</h2>
              <p className="text-muted-foreground mt-2 text-lg">{t.products.handpicked}</p>
            </div>
            <Link to="/products">
              <Button variant="outline" className="hidden sm:flex rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
                {t.products.viewAll} <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={featuredProducts} isLoading={productsLoading} />
          <div className="mt-10 text-center sm:hidden">
            <Link to="/products">
              <Button variant="outline" className="w-full rounded-full border-primary/20">
                {t.products.viewAll} <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Categories - Modern Glassmorphic Cards */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16">
          <ScrollReveal className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{t.categories.shopByCategory}</h2>
                <div className="h-1 w-20 bg-primary mt-2 rounded-full" />
              </div>
              <Link to="/products">
                <Button variant="ghost" className="hidden sm:flex group">
                  {t.products.viewAll} <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full"
            >
              <CarouselContent className="-ml-5 py-4">
                {categories.filter(c => !c.parent_id).map((category, index) => (
                  <CarouselItem key={category.id} className="pl-5 basis-[80%] xs:basis-[60%] sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
                    <Link to={`/products?category=${category.slug}`} className="block group relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ring-1 ring-border/10">
                      {category.image_url ? (
                        <OptimizedImage
                          src={category.image_url}
                          alt={category.name}
                          width={400}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Layers className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Content */}
                      <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col items-start justify-end h-full">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <h3 className="text-2xl font-bold text-white mb-2 leading-none">{category.name}</h3>
                          <p className="text-white/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 flex items-center gap-1">
                            Explore <ArrowRight className="h-3 w-3" />
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center mt-8">
                <CarouselDots />
              </div>
            </Carousel>
          </ScrollReveal>
        </section>
      )
      }

      {/* CTA Section - Simple & Effective */}
      {
        !user && (
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 clip-path-slant" />
            <ScrollReveal className="container mx-auto px-4 text-center relative z-10">
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t.cta.title}</h2>
                <p className="text-xl text-muted-foreground">{t.cta.subtitle}</p>
                <Link to="/auth?tab=signup">
                  <Button size="lg" className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    {t.cta.createAccount} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </section>
        )
      }
    </Layout >
  );
}
