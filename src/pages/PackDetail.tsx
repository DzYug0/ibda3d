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
    if (!user) return;
    addPackToCart.mutate({ packId: pack.id, quantity });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link to="/packs" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4 me-1" />
            {t.packs.backToPacks}
          </Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {galleryImages.length > 0 ? (
            <ProductGallery images={galleryImages} productName={pack.name} />
          ) : (
            <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-20 w-20 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {hasDiscount && <Badge variant="destructive">-{discountPercent}%</Badge>}
              {savings > 0 && <Badge className="bg-success text-success-foreground">{t.packs.save} {savings.toFixed(0)} {t.common.da}</Badge>}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {language === 'ar' ? (pack.name_ar || pack.name) : pack.name}
            </h1>
            {(language === 'ar' ? (pack.description_ar || pack.description) : pack.description) && (
              <p className="text-muted-foreground leading-relaxed">
                {language === 'ar' ? (pack.description_ar || pack.description) : pack.description}
              </p>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">{pack.price.toFixed(0)} {t.common.da}</span>
              {hasDiscount && <span className="text-xl text-muted-foreground line-through">{pack.compare_at_price!.toFixed(0)} {t.common.da}</span>}
            </div>
            {individualTotal > 0 && <p className="text-sm text-muted-foreground">{t.packs.individualTotal} {individualTotal.toFixed(0)} {t.common.da}</p>}

            {pack.items && pack.items.length > 0 && (
              <div className="space-y-3 border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground">{t.packs.whatsIncluded}</h3>
                <div className="space-y-3">
                  {pack.items.map(item => (
                    <Link key={item.id} to={`/products/${item.product?.slug}`} className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? <img src={item.product.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">—</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {item.product ? (language === 'ar' ? (item.product.name /* types don't have name_ar in nested product yet? */ || item.product.name) : item.product.name) : 'Product'}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.product?.price?.toFixed(0)} {t.common.da} {t.packs.each}</p>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">×{item.quantity}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">{t.products.quantity}</span>
                  <div className="flex items-center border border-border rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="h-4 w-4" /></Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {quantity > 1 && <span className="text-sm text-muted-foreground">{t.packs.total} {(pack.price * quantity).toFixed(0)} {t.common.da}</span>}
                </div>
                <Button size="xl" className="w-full" onClick={handleAddPackToCart} disabled={addPackToCart.isPending}>
                  <ShoppingCart className="h-5 w-5 me-2" />
                  {addPackToCart.isPending ? t.products.adding : quantity > 1 ? t.packs.addPacksToCart.replace('{count}', String(quantity)) : t.packs.addPackToCart}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-center">{t.products.pleaseSignInToAdd}</p>
                <Link to="/auth" className="block"><Button size="xl" className="w-full">{t.products.signInToShop}</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
