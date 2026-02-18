import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AdminSearch() {
    return (
        <div className="relative w-full max-w-md hidden sm:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            <Input
                type="search"
                placeholder="Search orders, products, customers..."
                className="pl-10 bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-0 transition-all duration-300 h-10 rounded-full"
            />
        </div>
    );
}
