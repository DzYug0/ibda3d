import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Package, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductGallery } from '@/components/products/ProductGallery';
import { usePack } from '@/hooks/usePacks';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export default function PackDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: pack, isLoading } = usePack(slug || '');
  const { user } = useAuth();
  const { addPackToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square skeleton rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 w-32 skeleton rounded" />
              <div className="h-12 w-full skeleton rounded" />
              <div className="h-24 w-full skeleton rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pack) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t.packs.packNotFound}</h1>
          <Link to="/packs"><Button>{t.packs.backToPacks}</Button></Link>
        </div>
      </Layout>
    );
  }

  const galleryImages: string[] = [];
  if (pack.image_url) galleryImages.push(pack.image_url);
  if (pack.items) {
    for (const item of pack.items) {
      if (item.product?.image_url && !galleryImages.includes(item.product.image_url)) galleryImages.push(item.product.image_url);
    }
  }

  const hasDiscount = pack.compare_at_price && pack.compare_at_price > pack.price;
  const discountPercent = hasDiscount ? Math.round(((pack.compare_at_price! - pack.price) / pack.compare_at_price!) * 100) : 0;
  const individualTotal = pack.items?.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;
  const savings = individualTotal > pack.price ? individualTotal - pack.price : 0;

  const handleAddPackToCart = () => {
    addPackToCart.mutate({
      packId: pack.id,
      quantity,
      packDetails: pack // Pass pack details for guest cart
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30 pb-20">
        <div className="container mx-auto px-4 py-8">
          <nav className="mb-8">
            <Link to="/packs" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors group">
              <div className="bg-card group-hover:bg-primary/10 border border-border/50 rounded-full p-2 me-2 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <span className="font-medium">{t.packs?.backToPacks || 'Back to Packs'}</span>
            </Link>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Gallery Section */}
            <div className="space-y-6">
              {galleryImages.length > 0 ? (
                <ProductGallery images={galleryImages} productName={pack.name} />
              ) : pack.items && pack.items.length > 0 && pack.items[0].product?.image_url ? (
                <div className="aspect-square rounded-3xl overflow-hidden bg-card border border-border shadow-sm">
                  <OptimizedImage
                    src={pack.items[0].product.image_url}
                    alt={pack.name}
                    className="w-full h-full object-cover"
                    width={800}
                    priority
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-3xl bg-card border border-border flex items-center justify-center shadow-sm">
                  <Package className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-8 sticky top-24">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {hasDiscount && <Badge variant="destructive" className="px-3 py-1 text-sm rounded-full shadow-lg shadow-destructive/20">-{discountPercent}% OFF</Badge>}
                  {savings > 0 && <Badge className="bg-success text-success-foreground px-3 py-1 text-sm rounded-full shadow-lg shadow-success/20">{t.packs?.save || 'Save'} {savings.toFixed(0)} {t.common?.da || 'DA'}</Badge>}
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                  {language === 'ar' ? (pack.name_ar || pack.name) : pack.name}
                </h1>

                {(language === 'ar' ? (pack.description_ar || pack.description) : pack.description) && (
                  <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/20 pl-4">
                    {language === 'ar' ? (pack.description_ar || pack.description) : pack.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">{pack.price.toFixed(0)} <span className="text-xl font-normal text-muted-foreground">{t.common?.da || 'DA'}</span></span>
                    {hasDiscount && (
                      <span className="text-xl text-muted-foreground line-through decoration-destructive/30">{pack.compare_at_price!.toFixed(0)}</span>
                    )}
                  </div>
                </div>
                {individualTotal > 0 && <p className="text-sm font-medium text-muted-foreground bg-muted/50 inline-block px-3 py-1 rounded-full">{t.packs?.individualTotal || 'Individual Total'}: {individualTotal.toFixed(0)} {t.common?.da || 'DA'}</p>}
              </div>

              <div className="bg-card/60 backdrop-blur-md rounded-3xl p-6 border border-border/50 shadow-sm space-y-6">

                {/* Pack Items List */}
                {pack.items && pack.items.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {t.packs?.whatsIncluded || "What's Included"}
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {pack.items.map(item => (
                        <Link key={item.id} to={`/products/${item.product?.slug}`} className="group flex items-center gap-3 bg-background/50 hover:bg-primary/5 rounded-xl p-3 border border-border/50 hover:border-primary/20 transition-all duration-300">
                          <div className="w-16 h-16 rounded-xl bg-background border border-border/50 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                            {item.product?.image_url ?
                              <OptimizedImage src={item.product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" width={64} />
                              : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">—</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {item.product ? (language === 'ar' && (item.product as any).name_ar ? (item.product as any).name_ar : item.product.name) : 'Product'}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.product?.price?.toFixed(0)} {t.common?.da || 'DA'} {t.packs?.each || 'each'}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-foreground bg-muted w-8 h-8 flex items-center justify-center rounded-lg">×{item.quantity}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{t.products?.quantity || 'Quantity'}</span>
                    <div className="flex items-center bg-muted/50 rounded-xl border border-border/50 p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background shadow-none" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-bold font-mono">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background shadow-none" onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {quantity > 1 && (
                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground bg-primary/5 p-2 rounded-lg">
                      <span>{t.packs?.total || 'Total'}</span>
                      <span className="text-primary font-bold">{(pack.price * quantity).toFixed(0)} {t.common?.da || 'DA'}</span>
                    </div>
                  )}

                  <Button size="xl" className="w-full text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5" onClick={handleAddPackToCart} disabled={addPackToCart.isPending}>
                    <ShoppingCart className="h-5 w-5 me-2" />
                    {addPackToCart.isPending ? t.products?.adding || 'Adding...' : quantity > 1 ? (t.packs?.addPacksToCart || 'Add Packs to Cart').replace('{count}', String(quantity)) : t.packs?.addPackToCart || 'Add to Cart'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
