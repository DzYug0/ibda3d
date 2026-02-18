import * as React from "react";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    Package,
    ShoppingBag,
    ExternalLink
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useAdminProducts } from "@/hooks/useProducts";
import { useAdminOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";

interface AdminSearchProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function AdminSearch({ open, setOpen }: AdminSearchProps) {
    const navigate = useNavigate();
    const { data: products = [] } = useAdminProducts();
    const { data: orders = [] } = useAdminOrders();
    const { signOut } = useAuth();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [setOpen]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, [setOpen]);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Suggestions">
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/dashboard"))}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/orders"))}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Orders</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/products"))}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Products</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>View Store</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Recent Orders">
                    {orders.slice(0, 5).map(order => (
                        <CommandItem key={order.id} onSelect={() => runCommand(() => navigate(`/admin/orders/${order.id}`))}>
                            <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Order #{order.id.slice(0, 8)}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{order.total_amount} DA</span>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandGroup heading="Products">
                    {products.slice(0, 5).map(product => (
                        <CommandItem key={product.id} onSelect={() => runCommand(() => navigate(`/admin/products/${product.id}`))}>
                            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{product.name}</span>
                            {product.stock_quantity <= 5 && (
                                <span className="ml-auto text-xs text-red-500">Low Stock</span>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>

            </CommandList>
        </CommandDialog>
    );
}
