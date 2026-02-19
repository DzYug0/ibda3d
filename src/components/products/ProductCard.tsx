import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { WishlistButton } from './WishlistButton';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { openCartDrawer } = useCartDrawer();
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate({
      productId: product.id,
      productDetails: product
    });
    openCartDrawer();
  };

  const displayCategories = product.categories && product.categories.length > 0
    ? product.categories
    : product.category ? [product.category] : [];

  return (
    <Link to={`/products/${product.slug}`} className="group block h-full">
      <div className="bg-card/50 backdrop-blur-md rounded-2xl overflow-hidden border border-border/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 h-full flex flex-col items-stretch">
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          <OptimizedImage
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            width={400}
          />

          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-2 z-10">
            {hasDiscount && (
              <Badge className="bg-destructive/90 hover:bg-destructive text-destructive-foreground backdrop-blur-sm shadow-sm border-0 px-2 py-1 text-xs">
                -{discountPercent}%
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-amber-500/90 hover:bg-amber-600 text-white backdrop-blur-sm shadow-sm border-0 px-2 py-1 text-xs">
                {t.products.featured}
              </Badge>
            )}
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute top-3 end-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75 z-20">
            <WishlistButton productId={product.id} className="bg-background/80 hover:bg-background text-foreground shadow-sm backdrop-blur-md rounded-full h-9 w-9 border border-border/50" size="icon" />
          </div>

          {product.stock_quantity > 0 ? (
            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-100 z-20">
              <Button
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="w-full bg-background/90 hover:bg-primary hover:text-primary-foreground text-foreground backdrop-blur-md shadow-lg border border-border/50 rounded-xl h-10 font-medium transition-all duration-300"
              >
                <ShoppingCart className="h-4 w-4 me-2" />
                {t.products.addToCart || "Add to Cart"}
              </Button>
            </div>
          ) : (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <Badge variant="outline" className="bg-background/80 border-destructive/50 text-destructive font-bold px-3 py-1 shadow-sm">
                {t.products.outOfStock}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2">
          {displayCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {displayCategories.slice(0, 2).map(cat => (
                <span key={cat.id} className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded-sm">
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {language === 'ar' ? (product.name_ar || product.name) : product.name}
          </h3>

          <div className="mt-auto pt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-bold text-primary">{product.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t.common.da}</span></span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through decoration-destructive/50 decoration-2">{product.compare_at_price!.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
