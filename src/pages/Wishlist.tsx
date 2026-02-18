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
            <div className="min-h-screen bg-muted/30 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                <div className="container mx-auto px-4 py-12 relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="bg-red-500/10 p-3 rounded-2xl">
                            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                                {t.wishlist?.title || 'My Wishlist'}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {t.wishlist?.subtitle || 'Save your favorite items for later.'}
                            </p>
                        </div>
                    </div>

                    {wishlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 text-center max-w-2xl mx-auto shadow-sm">
                            <div className="bg-muted/50 h-24 w-24 rounded-full flex items-center justify-center mb-6 ring-8 ring-muted/20">
                                <Heart className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold font-foreground mb-3">{t.wishlist?.emptyTitle || 'Your wishlist is empty'}</h2>
                            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">{t.wishlist?.emptyDescription || 'Browse products and add your favorites to see them here.'}</p>
                            <Link to="/products">
                                <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 text-base font-bold">
                                    {t.products.backToProducts || 'Start Shopping'}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                            {wishlist.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
