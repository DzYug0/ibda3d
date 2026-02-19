import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function CartDrawer() {
    const { isCartDrawerOpen, setIsCartDrawerOpen } = useCartDrawer();
    const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    return (
        <Sheet open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative cursor-pointer">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce-in">
                            {cartCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="p-6 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        {t.cart?.title || "Shopping Cart"}
                        <span className="text-muted-foreground text-sm font-normal">({cartCount})</span>
                    </SheetTitle>
                </SheetHeader>

                {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-muted/50 p-6 rounded-full h-32 w-32 mb-6 flex items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{t.cart?.emptyCart || "Your cart is empty"}</h3>
                        <p className="text-muted-foreground mb-6">
                            {t.cart?.startShopping || "Looks like you haven't added anything to your cart yet."}
                        </p>
                        <SheetTrigger asChild>
                            <Link to="/products" className="w-full">
                                <Button className="w-full rounded-xl">
                                    {t.cart?.browseProducts || "Start Shopping"}
                                </Button>
                            </Link>
                        </SheetTrigger>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {cartItems.map((item) => {
                                    const isPack = !!item.pack_id;
                                    const name = isPack
                                        ? (language === 'ar' ? (item.pack?.name_ar || item.pack?.name) : item.pack?.name)
                                        : (language === 'ar' ? (item.product?.name_ar || item.product?.name) : item.product?.name);
                                    const price = isPack ? (item.pack?.price || 0) : (item.product?.price || 0);
                                    const imageUrl = isPack ? item.pack?.image_url : item.product?.image_url;

                                    return (
                                        <div key={item.id} className="flex gap-4 items-start">
                                            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted/50 border border-border/50">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={name || ''} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{t.products?.noImage || "No Image"}</div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{name}</h4>
                                                    <button
                                                        onClick={() => removeFromCart.mutate(item.id)}
                                                        className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {(item.selected_color || item.selected_version) && (
                                                    <div className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-1">
                                                        {item.selected_color && <span>{item.selected_color}</span>}
                                                        {item.selected_color && item.selected_version && <span>•</span>}
                                                        {item.selected_version && <span>{item.selected_version}</span>}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center bg-muted/50 rounded-lg border border-border/50 scale-90 origin-left">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm shadow-none" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}>
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center font-bold font-mono text-xs">{item.quantity}</span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm shadow-none" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })} disabled={!isPack && item.quantity >= (item.product?.stock_quantity || 0)}>
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <p className="font-bold text-sm text-foreground">
                                                        {(price * item.quantity).toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">DA</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-muted/10 border-t border-border/50">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="text-sm">{t.cart?.subtotal || "Subtotal"}</span>
                                    <span className="font-mono text-sm">{cartTotal.toLocaleString()} DA</span>
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">{t.cart?.total || "Total"}</span>
                                    <span className="font-bold text-lg text-primary">{cartTotal.toLocaleString()} DA</span>
                                </div>
                            </div>

                            <SheetTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full rounded-xl shadow-lg font-bold"
                                    onClick={() => navigate('/checkout')}
                                >
                                    {t.cart?.placeOrder || "Checkout"} <ArrowRight className="ms-2 h-4 w-4" />
                                </Button>
                            </SheetTrigger>

                            <div className="mt-4 text-center">
                                <SheetTrigger asChild>
                                    <Link to="/cart" className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline">
                                        View full cart
                                    </Link>
                                </SheetTrigger>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
