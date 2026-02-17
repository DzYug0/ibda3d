import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
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
  const { t, language } = useLanguage();
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
  };

  const displayCategories = product.categories && product.categories.length > 0
    ? product.categories
    : product.category ? [product.category] : [];

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-card rounded-2xl overflow-hidden shadow-card border border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <OptimizedImage
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            width={300} // Optimized for grid card size
          />
          <div className="absolute top-2 start-2 flex flex-col gap-1.5 sm:gap-2 sm:top-3 sm:start-3">
            {hasDiscount && <span className="badge-sale text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2 sm:py-1">-{discountPercent}%</span>}
            {product.is_featured && <span className="badge-new text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2 sm:py-1">{t.products.featured}</span>}
          </div>
          <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <WishlistButton productId={product.id} className="bg-white/80 hover:bg-white shadow-sm backdrop-blur-sm rounded-full h-8 w-8" size="icon" />
          </div>
          {product.stock_quantity > 0 && (
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
          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {language === 'ar' ? (product.name_ar || product.name) : product.name}
          </h3>
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
