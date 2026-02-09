import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePacks } from '@/hooks/usePacks';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

function PackCard({ pack }: { pack: ReturnType<typeof usePacks>['data'] extends (infer T)[] ? T : never }) {
  const { user } = useAuth();
  const { addPackToCart } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);

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

  const handleAddPackToCart = () => {
    if (!user) return;
    addPackToCart.mutate({ packId: pack.id, quantity });
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-card border border-border">
      <Link to={`/packs/${pack.slug}`} className="relative block aspect-video overflow-hidden bg-muted">
        {allImages.length > 0 ? (
          <div className="w-full h-full flex">
            {allImages.slice(0, 4).map((img, i) => (
              <div key={i} className="relative flex-1 overflow-hidden" style={{ borderRight: i < Math.min(allImages.length, 4) - 1 ? '2px solid hsl(var(--border))' : 'none' }}>
                <OptimizedImage
                  src={img}
                  alt=""
                  width={200}
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
          <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-muted-foreground" /></div>
        )}
        <div className="absolute top-3 start-3 flex flex-col gap-2">
          {hasDiscount && <span className="badge-sale">-{discountPercent}%</span>}
          {savings > 0 && <Badge className="bg-success text-success-foreground">{t.packs.save} {savings.toFixed(0)} {t.common.da}</Badge>}
        </div>
      </Link>

      <div className="p-5 space-y-3">
        <Link to={`/packs/${pack.slug}`} className="hover:underline"><h3 className="text-xl font-bold text-foreground">{pack.name}</h3></Link>
        {pack.description && <p className="text-sm text-muted-foreground line-clamp-2">{pack.description}</p>}

        {pack.items && pack.items.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.packs.includes}</p>
            {pack.items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                  {item.product?.image_url ?
                    <OptimizedImage src={item.product.image_url} alt="" className="w-full h-full object-cover" width={32} />
                    : <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">—</div>}
                </div>
                <span className="text-sm text-foreground flex-1 truncate">{item.product?.name || 'Product'}</span>
                <span className="text-xs text-muted-foreground">×{item.quantity}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-2xl font-bold text-foreground">{pack.price.toFixed(0)} {t.common.da}</span>
          {hasDiscount && <span className="text-sm text-muted-foreground line-through">{pack.compare_at_price!.toFixed(0)} {t.common.da}</span>}
        </div>

        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{t.packs.qty}</span>
              <div className="flex items-center border border-border rounded-lg">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="h-3 w-3" /></Button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}><Plus className="h-3 w-3" /></Button>
              </div>
              {quantity > 1 && <span className="text-sm text-muted-foreground">{t.packs.total} {(pack.price * quantity).toFixed(0)} {t.common.da}</span>}
            </div>
            <Button className="w-full" onClick={handleAddPackToCart} disabled={addPackToCart.isPending}>
              <ShoppingCart className="h-4 w-4 me-2" />
              {addPackToCart.isPending ? t.products.adding : quantity > 1 ? t.packs.addPacksToCart.replace('{count}', String(quantity)) : t.packs.addPackToCart}
            </Button>
          </div>
        ) : (
          <Link to="/auth" className="block"><Button className="w-full">{t.products.signInToShop}</Button></Link>
        )}
      </div>
    </div>
  );
}

export default function Packs() {
  const { data: packs = [], isLoading } = usePacks();
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t.packs.title}</h1>
          <p className="text-muted-foreground mt-1">{t.packs.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="aspect-[3/4] skeleton rounded-2xl" />))}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t.packs.noPacksYet}</h2>
            <p className="text-muted-foreground">{t.packs.checkBackSoon}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map(pack => (<PackCard key={pack.id} pack={pack} />))}
          </div>
        )}
      </div>
    </Layout>
  );
}
