import { useSearchParams } from 'react-router-dom';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useLanguage } from '@/i18n/LanguageContext';
import { SEO } from '@/components/SEO';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useLanguage();

  // URL Params State
  const categoryParam = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const minPriceParam = Number(searchParams.get('minPrice')) || 0;
  const maxPriceParam = Number(searchParams.get('maxPrice')) || 100000;
  const inStockParam = searchParams.get('inStock') === 'true';

  const selectedSlugs = useMemo(() => categoryParam ? categoryParam.split(',').filter(Boolean) : [], [categoryParam]);

  const { data: allProducts = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower));
    }

    // Category
    if (selectedSlugs.length > 0) {
      result = result.filter(p =>
        p.categories?.some(c => selectedSlugs.includes(c.slug)) ||
        (p.category && selectedSlugs.includes(p.category.slug))
      );
    }

    // Price
    result = result.filter(p => p.price >= minPriceParam && p.price <= maxPriceParam);

    // Stock
    if (inStockParam) {
      result = result.filter(p => p.stock_quantity > 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortParam) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest
      }
    });

    return result;
  }, [allProducts, searchQuery, selectedSlugs, minPriceParam, maxPriceParam, inStockParam, sortParam]);


  // Handlers
  const updateParams = (newParams: Record<string, string | null>) => {
    const prev = Object.fromEntries(searchParams.entries());
    const next = { ...prev, ...newParams };

    // Cleanup nulls/defaults
    Object.keys(next).forEach(key => {
      if (next[key] === null) delete next[key];
    });

    setSearchParams(next as any);
  };

  const toggleCategory = (slug: string) => {
    const newSlugs = selectedSlugs.includes(slug)
      ? selectedSlugs.filter(s => s !== slug)
      : [...selectedSlugs, slug];
    updateParams({ category: newSlugs.length > 0 ? newSlugs.join(',') : null });
  };

  const clearFilters = () => setSearchParams({});

  const handlePriceChange = (range: [number, number]) => {
    updateParams({ minPrice: range[0].toString(), maxPrice: range[1].toString() });
  };

  const activeFilterCount = selectedSlugs.length + (inStockParam ? 1 : 0) + (minPriceParam > 0 || maxPriceParam < 100000 ? 1 : 0);

  return (
    <Layout>
      <SEO
        title={t.products.allProducts}
        description="Browse our collection of high-quality 3D printed products. From decor to functional parts, find what you need."
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedSlugs.length > 0 ? t.products.filteredProducts : t.products.allProducts}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.products.productsFound.replace('{count}', String(filteredProducts.length))}
            </p>
          </div>
          <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 me-2" />
            {t.products.filters}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ms-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          {activeFilterCount > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
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
              {inStockParam && (
                <Badge variant="default" className="gap-1 cursor-pointer" onClick={() => updateParams({ inStock: null })}>
                  In Stock
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {(minPriceParam > 0 || maxPriceParam < 100000) && (
                <Badge variant="default" className="gap-1 cursor-pointer" onClick={() => updateParams({ minPrice: null, maxPrice: null })}>
                  Price: {minPriceParam} - {maxPriceParam}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                {t.products.clearAll}
              </Button>
            </div>
          ) : <div />}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
            <Select value={sortParam} onValueChange={(val) => updateParams({ sort: val })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <FilterSidebar
                selectedCategories={selectedSlugs}
                onCategoryChange={toggleCategory}
                priceRange={[minPriceParam, maxPriceParam]}
                onPriceChange={handlePriceChange}
                inStock={inStockParam}
                onInStockChange={(val) => updateParams({ inStock: val ? 'true' : null })}
                onClear={clearFilters}
                onClearCategories={() => updateParams({ category: null })}
              />
            </div>
          </aside>

          <div className="flex-1">
            <ProductGrid products={filteredProducts} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
