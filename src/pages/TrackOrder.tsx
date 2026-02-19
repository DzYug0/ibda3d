import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, MapPin, Calendar, CircleDollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderDetails {
    id: string;
    status: string;
    created_at: string;
    total_amount: number;
    shipping_address: string | null;
    shipping_city: string | null;
    items: {
        product_name: string;
        quantity: number;
        price: number;
        image_url: string | null;
    }[];
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-500' },
    processing: { label: 'Processing', color: 'bg-purple-500/10 text-purple-500' },
    shipped: { label: 'Shipped', color: 'bg-indigo-500/10 text-indigo-500' },
    delivered: { label: 'Delivered', color: 'bg-green-500/10 text-green-500' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-500' },
};

export default function TrackOrder() {
    const { t } = useLanguage();
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState<OrderDetails | null>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !phone.trim()) {
            setError('Please enter both Order ID and Phone Number');
            return;
        }

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const { data, error } = await supabase.rpc('get_order_status', {
                p_order_id: orderId.trim(),
                p_phone: phone.trim()
            });

            if (error) throw error;

            const result = data as any;
            if (!result.found) {
                setError(result.error || 'Order not found');
            } else {
                setOrder(result);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to track order. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold tracking-tight mb-3">Track Your Order</h1>
                    <p className="text-muted-foreground">
                        Enter your Order ID and the Phone Number used during checkout to see the current status.
                    </p>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-lg mb-8">
                    <CardHeader>
                        <CardTitle>Track Order</CardTitle>
                        <CardDescription>Enter your details below</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTrack} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orderId">Order ID</Label>
                                    <Input
                                        id="orderId"
                                        placeholder="e.g. 123e4567-e89b..."
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="e.g. 0555123456"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Tracking...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Track Order
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {order && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">Order Status</CardTitle>
                                    <CardDescription className="font-mono text-xs mt-1">ID: {order.id}</CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`px-3 py-1 font-bold border-0 ${ORDER_STATUS_MAP[order.status]?.color || 'bg-gray-500/10 text-gray-500'}`}
                                >
                                    {ORDER_STATUS_MAP[order.status]?.label || order.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <span className="block font-medium text-foreground">Date Placed</span>
                                        <span className="text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CircleDollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <span className="block font-medium text-foreground">Total Amount</span>
                                        <span className="text-muted-foreground">{order.total_amount.toLocaleString()} DA</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 col-span-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <span className="block font-medium text-foreground">Shipping Address</span>
                                        <span className="text-muted-foreground">
                                            {order.shipping_address ? (
                                                <>{order.shipping_address}, {order.shipping_city}</>
                                            ) : (
                                                <>Desk Delivery ({order.shipping_city})</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Items
                                </h3>
                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50 shrink-0">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-muted-foreground/50" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{item.product_name}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="font-semibold text-sm">
                                                {(item.price * item.quantity).toLocaleString()} DA
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Layout>
    );
}
