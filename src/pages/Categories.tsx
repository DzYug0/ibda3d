import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCategories } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n/LanguageContext';

import { SEO } from '@/components/SEO';

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const { t } = useLanguage();

  // Group categories into parents and children
  const topLevelCategories = categories.filter(c => !c.parent_id);
  const getSubCategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <Layout>
      <SEO
        title={t.categories?.title || 'Categories'}
        description={t.categories?.browseCategories || 'Browse our product categories'}
      />
      <div className="min-h-screen bg-muted/30 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              {t.categories?.title || 'Categories'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.categories?.browseCategories || 'Explore our wide range of 3D printing products and accessories.'}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topLevelCategories.map((category) => {
                const subCategories = getSubCategories(category.id);

                return (
                  <div key={category.id} className="group flex flex-col h-full">
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="relative block aspect-[4/3] overflow-hidden rounded-3xl bg-card border border-border/50 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary/30 group-hover:-translate-y-1"
                    >
                      {category.image_url ? (
                        <div className="absolute inset-0">
                          <img
                            src={category.image_url}
                            alt={category.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-70" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-6xl font-bold text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500">{category.name.charAt(0)}</span>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <h2 className="text-2xl font-bold text-white mb-2 translate-y-0 transition-transform duration-300 group-hover:-translate-y-1">{category.name}</h2>
                        {category.description && (
                          <p className="text-white/80 text-sm line-clamp-2 mb-0 opacity-0 h-0 transition-all duration-300 group-hover:opacity-100 group-hover:h-auto group-hover:mb-2">
                            {category.description}
                          </p>
                        )}
                        <span className="inline-flex items-center text-sm font-medium text-white/90 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                          {t.common?.viewDetails || 'Explore'} <span className="ml-1">→</span>
                        </span>
                      </div>
                    </Link>

                    {/* Sub-categories list */}
                    {subCategories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 px-2">
                        {subCategories.map(sub => (
                          <Link
                            key={sub.id}
                            to={`/products?category=${sub.slug}`}
                            className="text-xs px-3 py-1.5 bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-primary rounded-full transition-all duration-300"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && categories.length === 0 && (
            <div className="text-center py-24 bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 max-w-md mx-auto">
              <p className="text-muted-foreground">{t.categories?.noCategories || 'No categories found.'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
