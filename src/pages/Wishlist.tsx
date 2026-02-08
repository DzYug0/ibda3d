import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function Wishlist() {
    const { wishlist, isLoading } = useWishlist();
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">{t.wishlist?.title || 'My Wishlist'}</h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] skeleton rounded-xl" />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 min-h-[60vh]">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                    <Heart className="fill-red-500 text-red-500" />
                    {t.wishlist?.title || 'My Wishlist'}
                </h1>

                {wishlist.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">{t.wishlist?.emptyTitle || 'Your wishlist is empty'}</h2>
                        <p className="text-muted-foreground mb-6">{t.wishlist?.emptyDescription || 'Browse products and add your favorites to see them here.'}</p>
                        <Link to="/products">
                            <Button size="lg">{t.products.backToProducts || 'Start Shopping'}</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {wishlist.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
