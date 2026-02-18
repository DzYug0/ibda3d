import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Minus, Plus, Check, Zap, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { ProductGallery } from '@/components/products/ProductGallery';
import { WishlistButton } from '@/components/products/WishlistButton';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { ReviewList } from '@/components/products/ReviewList';
import { ReviewForm } from '@/components/products/ReviewForm';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useLanguage } from '@/i18n/LanguageContext';
import { SEO } from '@/components/SEO';
import type { ProductOption } from '@/components/admin/ProductOptionsEditor';
import { useProductReviews } from '@/hooks/useReviews';

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProduct(slug as string);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Legacy support
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: reviews = [] } = useProductReviews(product?.id || '');

  // Parse product options if they exist
  const productOptions: ProductOption[] = (product as any)?.options ? (typeof (product as any).options === 'string' ? JSON.parse((product as any).options) : (product as any).options) : [];

  // Initialize default options
  useEffect(() => {
    if (productOptions.length > 0 && Object.keys(selectedOptions).length === 0) {
      const defaults: Record<string, string> = {};
      productOptions.forEach(opt => {
        if (opt.values.length > 0) {
          defaults[opt.name] = opt.values[0].name;
        }
      });
      setSelectedOptions(defaults);
    }
  }, [productOptions, selectedOptions]);


  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error || !product) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">{t.common?.error || "Error"}</h2>
        <Button onClick={() => navigate('/products')}>{t.products?.backToProducts || "Back to Products"}</Button>
      </div>
    </Layout>
  );

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || '/placeholder.svg'];

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  // Legacy checks
  const hasColors = product.colors && product.colors.length > 0;
  const hasVersions = product.versions && product.versions.length > 0;
  const hasOptions = productOptions.length > 0;

  // Check if all required options are selected
  const allOptionsSelected = productOptions.every(opt => selectedOptions[opt.name]);

  const isSelectionMissing = hasOptions
    ? !allOptionsSelected
    : (hasColors && !selectedColor) || (hasVersions && !selectedVersion);

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity,
      selectedColor: selectedColor || undefined,
      selectedVersion: selectedVersion || undefined,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      productDetails: product
    });
    toast.success((t.cart as any)?.added || "Added to cart");
  };

  const handleBuyNow = () => {
    addToCart.mutate({
      productId: product.id,
      quantity,
      selectedColor: selectedColor || undefined,
      selectedVersion: selectedVersion || undefined,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      productDetails: product
    }, {
      onSuccess: () => navigate('/checkout'),
    });
  };


  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  return (
    <Layout>
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} at Ibda3D. Best price in Algeria.`}
        image={product.image_url || undefined}
        type="product"
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": images,
          "description": product.description,
          "brand": {
            "@type": "Brand",
            "name": "Ibda3D"
          },
          "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "DZD",
            "price": product.price,
            "availability": product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
          },
          ...(reviews.length > 0 && {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": averageRating.toFixed(1),
              "reviewCount": reviews.length
            },
            "review": reviews.map(review => ({
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating
              },
              "author": {
                "@type": "Person",
                "name": review.user?.username || "Anonymous"
              },
              "datePublished": review.created_at
            }))
          })
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors group">
            <div className="bg-muted group-hover:bg-primary/10 rounded-full p-1 me-2 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <span className="font-medium">{t.products.backToProducts}</span>
          </Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <ProductGallery images={images} productName={product.name} />

          <div className="space-y-8 sticky top-24">
            <div className="space-y-4">
              {product.categories && product.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.categories.map(cat => (
                    <Link key={cat.id} to={`/products?category=${cat.slug}`} className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              ) : product.category ? (
                <Link to={`/products?category=${product.category.slug}`} className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
                  {product.category.name}
                </Link>
              ) : null}

              <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                {language === 'ar' ? (product.name_ar || product.name) : product.name}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{product.price.toLocaleString()} <span className="text-lg text-foreground/80">{t.common.da}</span></span>
                  {hasDiscount && (
                    <span className="text-xl text-muted-foreground line-through decoration-destructive/40">{product.compare_at_price!.toLocaleString()}</span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="badge-sale px-2 py-1 text-sm font-bold">-{discountPercent}% OFF</span>
                )}
              </div>
            </div>

            {(language === 'ar' ? (product.description_ar || product.description) : product.description) && (
              <p className="text-muted-foreground leading-relaxed text-lg border-l-4 border-primary/20 pl-4">
                {language === 'ar' ? (product.description_ar || product.description) : product.description}
              </p>
            )}

            <div className="bg-card/40 backdrop-blur-md rounded-2xl p-6 border border-border/50 shadow-sm space-y-6">
              {/* Product Options */}
              <div className="space-y-6">
                {/* New Dynamic Options */}
                {productOptions.map((option) => (
                  <div key={option.id}>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
                      <span>{option.name}</span>
                      {selectedOptions[option.name] && (
                        <span className="text-primary font-medium text-xs bg-primary/5 px-2 py-0.5 rounded-full">
                          {selectedOptions[option.name]}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val) => {
                        const isSelected = selectedOptions[option.name] === val.name;

                        if (option.type === 'color') {
                          return (
                            <button
                              key={val.name}
                              onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val.name }))}
                              className={cn(
                                "group relative h-10 w-10 rounded-full border shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                isSelected ? "ring-2 ring-primary ring-offset-2 scale-110 border-primary" : "border-border/50 hover:border-border"
                              )}
                              title={val.name}
                            >
                              <span
                                className="absolute inset-1 rounded-full border border-black/5 shadow-inner"
                                style={{ backgroundColor: val.value }}
                              />
                              {isSelected && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <Check className={cn("h-4 w-4 drop-shadow-md", ['#ffffff', '#fff', 'white'].includes(val.value.toLowerCase()) ? 'text-black' : 'text-white')} />
                                </span>
                              )}
                            </button>
                          );
                        }

                        return (
                          <Button
                            key={val.name}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val.name }))}
                            className={cn(
                              "min-w-[3.5rem] h-9 rounded-full transition-all",
                              isSelected ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" : "bg-transparent hover:bg-muted"
                            )}
                          >
                            {val.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legacy Options (Fallback) */}
                {productOptions.length === 0 && product.colors && product.colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">{t.products.selectColor || 'Select Color'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <Button
                          key={color}
                          variant={selectedColor === color ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "min-w-[3.5rem] rounded-full",
                            selectedColor === color && "shadow-md"
                          )}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {productOptions.length === 0 && product.versions && product.versions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">{t.products.selectVersion || 'Select Version'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.versions.map((version) => (
                        <Button
                          key={version}
                          variant={selectedVersion === version ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedVersion(version)}
                          className={cn(
                            "min-w-[3.5rem] rounded-full",
                            selectedVersion === version && "shadow-md"
                          )}
                        >
                          {version}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-4 border-t border-border/40">
                <span className="font-semibold text-foreground">{t.products.quantity}</span>
                <div className="flex items-center bg-muted/50 rounded-xl border border-border/50 p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background shadow-none" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-bold font-mono">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background shadow-none" onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={quantity >= product.stock_quantity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Button
                    size="xl"
                    className="w-full text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0 || addToCart.isPending || isSelectionMissing}
                  >
                    <ShoppingCart className="h-5 w-5 me-2" />
                    {addToCart.isPending ? t.products.adding : (isSelectionMissing ? t.products.selectOptions || 'Select Options' : t.products.addToCart)}
                  </Button>
                  <WishlistButton productId={product.id} size="lg" className="h-14 w-14 rounded-xl border-2 border-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all" variant="outline" />
                </div>
                <Button
                  size="xl"
                  className="w-full text-base font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5"
                  variant="default"
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0 || isSelectionMissing}
                >
                  <Zap className="h-5 w-5 me-2 fill-current" />
                  {t.products.buyNow}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
              {product.stock_quantity > 0 ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-success">{t.products.inStock}</p>
                    <p className="text-xs text-muted-foreground">{product.stock_quantity} {t.products.available} - {t.features.fastDeliveryDesc}</p>
                  </div>
                </>
              ) : (
                <span className="text-destructive font-bold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  {t.products.outOfStock}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 sm:mt-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">{t.reviews?.title || "Customer Reviews"}</h2>
            <Badge variant="secondary" className="text-lg px-3 py-0.5">{reviews.length}</Badge>
          </div>

          <div className="bg-card/30 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-border/50 shadow-sm">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              <div>
                <div className="sticky top-32">
                  <h3 className="text-xl font-bold mb-6">{t.reviews?.writeReview || "Write a Review"}</h3>
                  <div className="bg-background/50 rounded-2xl p-6 border border-border/50">
                    <ReviewForm productId={product.id} />
                  </div>
                </div>
              </div>
              <div>
                <ReviewList productId={product.id} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/50 pt-16">
          <RelatedProducts
            currentProductId={product.id}
            categories={product.categories || (product.category ? [product.category] : [])}
          />
        </div>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 sm:hidden z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="font-bold text-sm truncate">{language === 'ar' ? (product.name_ar || product.name) : product.name}</p>
            <p className="text-primary font-bold">{product.price.toFixed(0)} DA</p>
          </div>
          <Button onClick={handleAddToCart} disabled={product.stock_quantity === 0 || addToCart.isPending || isSelectionMissing} className="rounded-full px-6 shadow-md">
            {addToCart.isPending ? "..." : t.products.addToCart}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
