import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCategories } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t.categories.title}</h1>
          <p className="text-muted-foreground mt-1">{t.categories.browseCategories}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} to={`/products?category=${category.slug}`} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:border-primary hover:shadow-lg transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">{category.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t.categories.noCategories}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
