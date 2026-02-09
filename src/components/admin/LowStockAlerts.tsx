import { AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/hooks/useProducts';

interface LowStockAlertsProps {
    products: Product[];
    threshold?: number;
}

export function LowStockAlerts({ products, threshold = 10 }: LowStockAlertsProps) {
    const lowStockProducts = products
        .filter((product) => product.stock_quantity <= threshold)
        .sort((a, b) => a.stock_quantity - b.stock_quantity);

    if (lowStockProducts.length === 0) return null;

    return (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
                <Badge variant="secondary" className="ml-auto">
                    {lowStockProducts.length} items
                </Badge>
            </div>
            <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-md bg-muted overflow-hidden shrink-0">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted-foreground/10">
                                            <span className="text-xs">No img</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.slug}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span
                                    className={`text-sm font-bold ${product.stock_quantity === 0 ? 'text-destructive' : 'text-warning'
                                        }`}
                                >
                                    {product.stock_quantity} left
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
