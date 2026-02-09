import { useRelatedProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { useLanguage } from '@/i18n/LanguageContext';

interface RelatedProductsProps {
    currentProductId: string;
    categories: { id: string; name: string; slug: string }[];
}

export function RelatedProducts({ currentProductId, categories }: RelatedProductsProps) {
    const categoryIds = categories.map(c => c.id);
    const { data: products, isLoading } = useRelatedProducts(currentProductId, categoryIds);
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="mt-16 space-y-6">
                <div className="h-8 w-48 skeleton rounded" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] skeleton rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t.products.relatedProducts || 'You might also like'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
