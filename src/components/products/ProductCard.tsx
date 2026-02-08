import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { WishlistButton } from './WishlistButton';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) addToCart.mutate({ productId: product.id });
  };

  const displayCategories = product.categories && product.categories.length > 0
    ? product.categories
    : product.category ? [product.category] : [];

  return (
    <Link to={`/products/${product.slug}`}>
      <div className="group bg-card rounded-2xl overflow-hidden shadow-card product-card border border-border">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">{t.products.noImage}</div>
          )}
          <div className="absolute top-3 start-3 flex flex-col gap-2">
            {hasDiscount && <span className="badge-sale">-{discountPercent}%</span>}
            {product.is_featured && <span className="badge-new">{t.products.featured}</span>}
          </div>
          <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <WishlistButton productId={product.id} className="bg-white/80 hover:bg-white shadow-sm backdrop-blur-sm rounded-full h-8 w-8" size="icon" />
          </div>
          {user && product.stock_quantity > 0 && (
            <div className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button size="icon" onClick={handleAddToCart} disabled={addToCart.isPending} className="rounded-full shadow-lg">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          {displayCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 hidden sm:flex">
              {displayCategories.map(cat => (
                <Badge key={cat.id} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium uppercase tracking-wide">{cat.name}</Badge>
              ))}
            </div>
          )}
          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-foreground">{product.price.toFixed(0)} {t.common.da}</span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">{product.compare_at_price!.toFixed(0)} {t.common.da}</span>
            )}
          </div>
          {product.stock_quantity === 0 && (
            <span className="text-sm text-destructive font-medium">{t.products.outOfStock}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
