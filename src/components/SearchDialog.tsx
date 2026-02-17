import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { OptimizedImage } from './ui/OptimizedImage';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  type: 'product' | 'category';
  price?: number;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { history, addSearch, clearHistory, removeSearch } = useSearchHistory();
  const { data: trendingProducts = [] } = useFeaturedProducts(); // Using featured as trending for now

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);

    // Search Products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, image_url')
      .eq('is_active', true)
      .ilike('name', `%${term}%`)
      .limit(6);

    // Search Categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .ilike('name', `%${term}%`)
      .limit(3);

    const mixedResults: SearchResult[] = [
      ...(categories?.map(c => ({ ...c, type: 'category' as const })) || []),
      ...(products?.map(p => ({ ...p, type: 'product' as const })) || [])
    ];
    setResults(mixedResults);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const goToResult = (result: SearchResult) => {
    onOpenChange(false);
    if (result.type === 'category') {
      navigate(`/products?category=${result.slug}`);
    } else {
      navigate(`/products/${result.slug}`);
    }
  };

  const goToAll = () => {
    onOpenChange(false);
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="border-0 focus-visible:ring-0 text-base h-14"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addSearch(query);
                goToAll();
              }
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {query.trim().length === 0 ? (
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
            {/* Recent Searches */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                  <span className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> {t.common?.recentSearches || "Recent Searches"}</span>
                  <button onClick={clearHistory} className="text-xs hover:text-destructive transition-colors">{t.common?.clear || "Clear"}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map(term => (
                    <button
                      key={term}
                      onClick={() => { setQuery(term); addSearch(term); }}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-full text-sm transition-colors"
                    >
                      {term}
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); removeSearch(term); }}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Products */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground px-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> {t.common?.trending || "Trending Now"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trendingProducts.slice(0, 6).map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/products/${product.slug}`);
                    }}
                    className="flex flex-col gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-start group"
                  >
                    <div className="aspect-square rounded-md overflow-hidden bg-muted relative">
                      <OptimizedImage
                        src={product.image_url || ''}
                        alt={product.name}
                        width={150}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-semibold mt-1">
                        {product.price} {t.common.da}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : query.trim().length >= 2 && (
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">{t.common.loading}</div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">{t.common.searchNoResults}</div>
            ) : (
              <>
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => { addSearch(query); goToResult(result); }}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-start"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                      {result.image_url ? (
                        <OptimizedImage src={result.image_url} alt={result.name} width={50} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Search className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{result.name}</p>
                      {result.type === 'product' ? (
                        <p className="text-sm text-primary font-semibold">{result.price} {t.common.da}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.categories.title}</p>
                      )}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { addSearch(query); goToAll(); }}
                  className="w-full px-4 py-3 text-sm text-primary font-medium hover:bg-muted transition-colors text-center border-t border-border"
                >
                  {t.common.searchViewAll} →
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
