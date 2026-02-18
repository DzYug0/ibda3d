import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePacks } from '@/hooks/usePacks';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// PackCard Component
function PackCard({ pack }: { pack: ReturnType<typeof usePacks>['data'] extends (infer T)[] ? T : never }) {
  const { user } = useAuth();
  const { addPackToCart } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const allImages: string[] = [];
  if (pack.image_url) allImages.push(pack.image_url);
  if (pack.items) {
    for (const item of pack.items) {
      if (item.product?.image_url && !allImages.includes(item.product.image_url)) allImages.push(item.product.image_url);
    }
  }

  const hasDiscount = pack.compare_at_price && pack.compare_at_price > pack.price;
  const discountPercent = hasDiscount ? Math.round(((pack.compare_at_price! - pack.price) / pack.compare_at_price!) * 100) : 0;
  const individualTotal = pack.items?.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;
  const savings = individualTotal > pack.price ? individualTotal - pack.price : 0;

  const handleAddPackToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addPackToCart.mutate({
      packId: pack.id,
      quantity,
      packDetails: pack
    });
  };

  return (
    <div
      onClick={() => navigate(`/packs/${pack.slug}`)}
      className="group bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {allImages.length > 0 ? (
          <div className="w-full h-full flex">
            {allImages.slice(0, 4).map((img, i) => (
              <div key={i} className="relative flex-1 overflow-hidden h-full border-r border-background/20 last:border-0">
                <OptimizedImage
                  src={img}
                  alt=""
                  width={300}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            ))}
            {allImages.length > 4 && (
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                +{allImages.length - 4}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50"><Package className="h-16 w-16 text-muted-foreground/30" /></div>
        )}

        <div className="absolute top-3 inset-x-3 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {hasDiscount && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">-{discountPercent}%</span>}
            {savings > 0 && <span className="bg-success text-success-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">{t.packs.save || 'Save'} {savings.toFixed(0)} DA</span>}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{pack.name}</h3>
          {pack.description && <p className="text-sm text-muted-foreground line-clamp-2">{pack.description}</p>}
        </div>

        {pack.items && pack.items.length > 0 && (
          <div className="mb-6 space-y-2 bg-background/30 rounded-xl p-3 border border-border/30">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.packs.includes || 'INCLUDES'}</p>
            <div className="space-y-2">
              {pack.items.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-background shadow-sm overflow-hidden flex-shrink-0">
                    {item.product?.image_url && <OptimizedImage src={item.product.image_url} alt="" className="w-full h-full object-cover" width={24} />}
                  </div>
                  <span className="text-sm text-foreground/80 flex-1 truncate">{item.product?.name || 'Product'}</span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">×{item.quantity}</span>
                </div>
              ))}
              {pack.items.length > 3 && (
                <p className="text-xs text-muted-foreground pl-8">+ {pack.items.length - 3} more items...</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-0.5">Total Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">{pack.price.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">DA</span></span>
                {hasDiscount && <span className="text-sm text-muted-foreground line-through decoration-destructive/30">{pack.compare_at_price!.toFixed(0)}</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center border border-border rounded-xl bg-background/50 h-11 px-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="h-3 w-3" /></Button>
              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => setQuantity(quantity + 1)}><Plus className="h-3 w-3" /></Button>
            </div>
            <Button className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 text-base font-bold" onClick={handleAddPackToCart} disabled={addPackToCart.isPending}>
              <ShoppingCart className="h-4 w-4 me-2" />
              {addPackToCart.isPending ? t.products.adding : t.packs.addPackToCart || 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Packs() {
  const { data: packs = [], isLoading } = usePacks();
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">{t.packs.title || 'Value Packs'}</h1>
            <p className="text-xl text-muted-foreground">{t.packs.subtitle || 'Bundled products for better savings. Everything you need in one click.'}</p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="aspect-[3/4] skeleton rounded-3xl" />))}
            </div>
          ) : packs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-card/40 backdrop-blur-md rounded-3xl border border-border/50">
              <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.packs.noPacksYet || 'No packs available'}</h2>
              <p className="text-muted-foreground max-w-sm">{t.packs.checkBackSoon || 'We are currently creating amazing bundles for you. Please check back later.'}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {packs.map(pack => (<PackCard key={pack.id} pack={pack} />))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
