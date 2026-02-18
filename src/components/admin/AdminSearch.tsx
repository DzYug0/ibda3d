import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AdminSearchProps {
    onSearchClick?: () => void;
}

export function AdminSearch({ onSearchClick }: AdminSearchProps) {
    return (
        <div
            className="relative w-full max-w-md hidden sm:block group cursor-pointer"
            onClick={onSearchClick}
        >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            <div className="flex h-10 w-full rounded-full border border-input bg-card/60 backdrop-blur-sm px-3 py-2 text-sm text-muted-foreground shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 items-center hover:bg-accent/50 transition-colors duration-300">
                Search orders, products...
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>
        </div>
    );
}
