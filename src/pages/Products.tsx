import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useLanguage();

  const categoryParam = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const selectedSlugs = categoryParam ? categoryParam.split(',').filter(Boolean) : [];

  const { data: allProducts = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  let products = allProducts;

  // Filter by search query
  if (searchQuery) {
    const lower = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower));
  }

  // Filter by category
  if (selectedSlugs.length > 0) {
    products = products.filter(p =>
      p.categories?.some(c => selectedSlugs.includes(c.slug)) ||
      (p.category && selectedSlugs.includes(p.category.slug))
    );
  }

  const toggleCategory = (slug: string) => {
    const newSlugs = selectedSlugs.includes(slug)
      ? selectedSlugs.filter(s => s !== slug)
      : [...selectedSlugs, slug];
    if (newSlugs.length > 0) {
      setSearchParams({ category: newSlugs.join(',') });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => setSearchParams({});

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedSlugs.length > 0 ? t.products.filteredProducts : t.products.allProducts}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.products.productsFound.replace('{count}', String(products.length))}
            </p>
          </div>
          <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 me-2" />
            {t.products.filters}
            {selectedSlugs.length > 0 && (
              <Badge variant="secondary" className="ms-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {selectedSlugs.length}
              </Badge>
            )}
          </Button>
        </div>

        {selectedSlugs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-sm text-muted-foreground">{t.products.activeFilters}</span>
            {selectedSlugs.map(slug => {
              const cat = categories.find(c => c.slug === slug);
              return (
                <Badge key={slug} variant="default" className="gap-1 cursor-pointer" onClick={() => toggleCategory(slug)}>
                  {cat?.name || slug}
                  <X className="h-3 w-3" />
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              {t.products.clearAll}
            </Button>
          </div>
        )}

        <div className="flex gap-8">
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{t.categories.title}</h3>
                {selectedSlugs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-auto p-1">
                    {t.products.clear}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted">
                    <Checkbox checked={selectedSlugs.includes(category.slug)} onCheckedChange={() => toggleCategory(category.slug)} />
                    <span className={`text-sm ${selectedSlugs.includes(category.slug) ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <ProductGrid products={products} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
