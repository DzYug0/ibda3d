import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

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
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {query.trim().length >= 2 && (
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
                    onClick={() => goToResult(result)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-start"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                      {result.image_url ? (
                        <img src={result.image_url} alt={result.name} className="w-full h-full object-cover" />
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
                  onClick={goToAll}
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
