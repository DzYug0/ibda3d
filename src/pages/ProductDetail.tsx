import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Minus, Plus, Check, Zap } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { ProductGallery } from '@/components/products/ProductGallery';
import { WishlistButton } from '@/components/products/WishlistButton';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { useLanguage } from '@/i18n/LanguageContext';
import { SEO } from '@/components/SEO';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

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
              <div className="h-10 w-40 skeleton rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t.products.productNotFound}</h1>
          <Link to="/products"><Button>{t.products.backToProducts}</Button></Link>
        </div>
      </Layout>
    );
  }

  const images = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100) : 0;

  // Check if options are required but not selected
  const hasColors = product.colors && product.colors.length > 0;
  const hasVersions = product.versions && product.versions.length > 0;
  const isSelectionMissing = (hasColors && !selectedColor) || (hasVersions && !selectedVersion);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    addToCart.mutate({
      productId: product.id,
      quantity,
      selectedColor: selectedColor || undefined,
      selectedVersion: selectedVersion || undefined
    });
  };

  const handleBuyNow = () => {
    if (user) {
      addToCart.mutate({
        productId: product.id,
        quantity,
        selectedColor: selectedColor || undefined,
        selectedVersion: selectedVersion || undefined
      }, {
        onSuccess: () => navigate('/checkout'),
      });
    } else {
      let url = `/checkout?buyNow=${product.id}&qty=${quantity}`;
      if (selectedColor) url += `&color=${encodeURIComponent(selectedColor)}`;
      if (selectedVersion) url += `&version=${encodeURIComponent(selectedVersion)}`;
      navigate(url);
    }
  };

  return (
    <Layout>
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} at Ibda3D. Best price in Algeria.`}
        image={product.image_url || undefined}
        type="product"
      />
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4 me-1" />
            {t.products.backToProducts}
          </Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <ProductGallery images={images} productName={product.name} />

          <div className="space-y-6">
            {product.categories && product.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.categories.map(cat => (
                  <Link key={cat.id} to={`/products?category=${cat.slug}`} className="text-sm text-primary font-medium uppercase tracking-wide hover:underline">
                    {cat.name}
                  </Link>
                ))}
              </div>
            ) : product.category ? (
              <Link to={`/products?category=${product.category.slug}`} className="text-sm text-primary font-medium uppercase tracking-wide hover:underline">
                {product.category.name}
              </Link>
            ) : null}

            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{product.name}</h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">{product.price.toFixed(0)} {t.common.da}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">{product.compare_at_price!.toFixed(0)} {t.common.da}</span>
                  <span className="badge-sale">-{discountPercent}%</span>
                </>
              )}
            </div>

            {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

            {/* Product Options */}
            <div className="space-y-4">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">{t.products.selectColor || 'Select Color'}:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <Button
                        key={color}
                        variant={selectedColor === color ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedColor(color)}
                        className={`min-w-[3rem] ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {product.versions && product.versions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">{t.products.selectVersion || 'Select Version'}:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.versions.map((version) => (
                      <Button
                        key={version}
                        variant={selectedVersion === version ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedVersion(version)}
                        className={`min-w-[3rem] ${selectedVersion === version ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      >
                        {version}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {product.stock_quantity > 0 ? (
                <>
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-success font-medium">{t.products.inStock} ({product.stock_quantity} {t.products.available})</span>
                </>
              ) : (
                <span className="text-destructive font-medium">{t.products.outOfStock}</span>
              )}
            </div>

            {product.stock_quantity > 0 && (
              <div className="flex items-center gap-4">
                <span className="font-medium text-foreground">{t.products.quantity}</span>
                <div className="flex items-center border border-border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={quantity >= product.stock_quantity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button size="xl" className="flex-1" onClick={handleAddToCart} disabled={product.stock_quantity === 0 || addToCart.isPending || isSelectionMissing}>
                <ShoppingCart className="h-5 w-5 me-2" />
                {addToCart.isPending ? t.products.adding : (isSelectionMissing ? t.products.selectOptions || 'Select Options' : t.products.addToCart)}
              </Button>
              <Button size="xl" className="flex-1" variant="outline" onClick={handleBuyNow} disabled={product.stock_quantity === 0 || isSelectionMissing}>
                <Zap className="h-5 w-5 me-2" />
                {t.products.buyNow}
              </Button>
              <WishlistButton productId={product.id} size="lg" className="h-14 w-14 rounded-xl border-2" variant="outline" />
            </div>
          </div>
        </div>

        <RelatedProducts
          currentProductId={product.id}
          categories={product.categories || (product.category ? [product.category] : [])}
        />
      </div>
    </Layout>
  );
}
