import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, ShoppingBag, Users, FileText, Command } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'; // Check if this exists or just use a sr-only span
import { DialogTitle } from '@/components/ui/dialog';

interface AdminSearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: 'product' | 'order' | 'user' | 'page';
    url: string;
    status?: string;
}

interface AdminSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AdminSearchDialog({ open, onOpenChange }: AdminSearchDialogProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdminSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const search = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        const searchResults: AdminSearchResult[] = [];

        try {
            // 1. Search Products
            const { data: products } = await supabase
                .from('products')
                .select('id, name, slug, stock_quantity')
                .ilike('name', `%${term}%`)
                .limit(3);

            if (products) {
                searchResults.push(...products.map(p => ({
                    id: p.id,
                    title: p.name,
                    subtitle: `Stock: ${p.stock_quantity}`,
                    type: 'product' as const,
                    url: `/admin/products?search=${p.name}`, // Or open edit modal if we could
                })));
            }

            // 2. Search Orders
            // Check if term is numeric (for ID) or string (for customer name - requires join or separate search)
            // For simplicity, search ID (text) or fetch orders with user join?
            // Let's just search by ID if it looks like an ID, or skip for now if complex joins needed directly here.
            // Actually, we can search orders by ID or total amount?
            // Let's search by ID (if UUID or short ID)
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total_amount, status')
                .ilike('id', `%${term}%`)
                .limit(3);

            if (orders) {
                searchResults.push(...orders.map(o => ({
                    id: o.id,
                    title: `Order #${o.id.slice(0, 8)}`,
                    subtitle: `${o.total_amount} DA • ${o.status}`,
                    type: 'order' as const,
                    url: `/admin/orders`, // We might need to implement filtering by ID on the page
                })));
            }

            // 3. Search Profiles (Users)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, email, role')
                .or(`username.ilike.%${term}%,email.ilike.%${term}%`)
                .limit(3);

            if (profiles) {
                searchResults.push(...profiles.map(p => ({
                    id: p.id,
                    title: p.username || 'Unknown',
                    subtitle: p.email,
                    status: p.role,
                    type: 'user' as const,
                    url: `/admin/users`,
                })));
            }

            // 4. Pages (Static)
            const pages = [
                { name: 'Dashboard', url: '/admin' },
                { name: 'Products', url: '/admin/products' },
                { name: 'Orders', url: '/admin/orders' },
                { name: 'Users', url: '/admin/users' },
                { name: 'Categories', url: '/admin/categories' },
                { name: 'Settings', url: '/admin/settings' },
            ].filter(p => p.name.toLowerCase().includes(term.toLowerCase()));

            searchResults.push(...pages.map(p => ({
                id: p.url,
                title: p.name,
                type: 'page' as const,
                url: p.url,
            })));

        } catch (error) {
            console.error('Search error:', error);
        }

        setResults(searchResults);
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

    const handleSelect = (url: string) => {
        onOpenChange(false);
        navigate(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl">
                <VisuallyHidden>
                    <DialogTitle>Admin Search</DialogTitle>
                </VisuallyHidden>
                <div className="flex items-center border-b border-border/50 px-4">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type to search..."
                        className="border-0 focus-visible:ring-0 text-lg h-14 bg-transparent"
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : results.length === 0 && query.trim().length >= 2 ? (
                        <div className="p-8 text-center text-muted-foreground">No results found.</div>
                    ) : (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result.url)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                                >
                                    <div className={`p-2 rounded-md shrink-0 ${result.type === 'product' ? 'bg-blue-500/10 text-blue-500' :
                                            result.type === 'order' ? 'bg-purple-500/10 text-purple-500' :
                                                result.type === 'user' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {result.type === 'product' && <Package className="h-5 w-5" />}
                                        {result.type === 'order' && <ShoppingBag className="h-5 w-5" />}
                                        {result.type === 'user' && <Users className="h-5 w-5" />}
                                        {result.type === 'page' && <FileText className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{result.title}</span>
                                            {result.status && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase">
                                                    {result.status}
                                                </Badge>
                                            )}
                                        </div>
                                        {result.subtitle && (
                                            <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {results.length === 0 && query.trim().length < 2 && (
                        <div className="p-12 text-center text-muted-foreground/50">
                            <Command className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Search products, orders, users, and pages...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
