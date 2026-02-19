import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, CheckCircle, Truck, Building2, Home, Loader2, X, ChevronRight, ShoppingBag } from 'lucide-react';
import { z } from 'zod';
import { trackPixelEvent } from '@/components/analytics/FacebookPixel';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveShippingCompanies, useShippingRates } from '@/hooks/useShipping';
import { ALGERIA_WILAYAS } from '@/data/wilayas';
import { cn } from "@/lib/utils";

type DeliveryType = 'desk' | 'home';

interface CheckoutItem {
  product_id: string | null;
  pack_id: string | null;
  quantity: number;
  name: string;
  price: number;
  image_url: string | null;
  selected_color?: string | null;
  selected_version?: string | null;
  selected_options?: Record<string, string> | null;
}

interface UserAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

interface Coupon {
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
}

const shippingSchema = z.object({
  fullName: z.string().trim().min(3, 'Please enter your full name').max(100, 'Name must be less than 100 characters'),
  wilaya: z.string().min(1, 'Please select a wilaya'),
  companyId: z.string().min(1, 'Please select a shipping company'),
  deliveryType: z.enum(['desk', 'home'], { required_error: 'Please choose a delivery type' }),
  address: z.string().optional(),
  phone: z.string().min(9, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
}).refine((data) => {
  if (data.deliveryType === 'home') {
    return data.address && data.address.length >= 5;
  }
  return true;
}, {
  message: 'Please enter a valid address',
  path: ['address'],
});

export default function Checkout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const { data: companies = [], isLoading: companiesLoading } = useActiveShippingCompanies();
  const { data: allRates = [] } = useShippingRates();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<CheckoutItem | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    wilaya: '',
    companyId: '',
    deliveryType: 'desk' as DeliveryType,
    address: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Handle Buy Now URL params (for guests)
  const buyNowProductId = searchParams.get('buyNow');
  const buyNowQty = parseInt(searchParams.get('qty') || '1', 10);
  const buyNowColor = searchParams.get('color');
  const buyNowVersion = searchParams.get('version');
  const buyNowOptionsParam = searchParams.get('options');

  useEffect(() => {
    if (!buyNowProductId) return;
    setBuyNowLoading(true);

    let buyNowOptions: Record<string, string> | null = null;
    if (buyNowOptionsParam) {
      try {
        buyNowOptions = JSON.parse(decodeURIComponent(buyNowOptionsParam));
      } catch (e) {
        console.error('Failed to parse options', e);
      }
    }

    supabase
      .from('products')
      .select('id, name, price, image_url, stock_quantity')
      .eq('id', buyNowProductId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBuyNowItem({
            product_id: data.id,
            pack_id: null,
            quantity: Math.min(buyNowQty, data.stock_quantity),
            name: data.name,
            price: data.price,
            image_url: data.image_url,
            selected_color: buyNowColor,
            selected_version: buyNowVersion,
            selected_options: buyNowOptions,
          });
        }
        setBuyNowLoading(false);
      });
  }, [buyNowProductId, buyNowQty, buyNowColor, buyNowVersion, buyNowOptionsParam]);

  // Fetch saved addresses and pre-fill default
  useEffect(() => {
    if (!user) return; // Only fetch profile/addresses if logged in

    // Fetch profile first for fallback
    supabase
      .from('profiles')
      .select('full_name, phone, address')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data && !shippingInfo.fullName) {
          setShippingInfo((prev) => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
          }));
        }
      });

    // Fetch addresses
    supabase
      .from('user_addresses' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Cast data to UserAddress[] since types aren't generated yet
          const addresses = data as unknown as UserAddress[];
          setSavedAddresses(addresses);
          const defaultAddr = addresses.find(a => a.is_default);
          if (defaultAddr && !shippingInfo.fullName) {
            selectAddress(defaultAddr);
          }
        }
      });
  }, [user]);

  const selectAddress = (addr: UserAddress) => {
    setShippingInfo(prev => ({
      ...prev,
      fullName: addr.full_name,
      phone: addr.phone,
      address: addr.address_line1,
      wilaya: addr.zip_code || prev.wilaya, // Assuming zip_code stores wilaya code in this context
      deliveryType: 'home', // Default to home if selecting an address
    }));
  };

  // Determine checkout items: cart items for logged-in, buyNow item for guests
  const checkoutItems: CheckoutItem[] = useMemo(() => {
    if (cartItems.length > 0) {
      return cartItems.map(item => {
        const isPack = !!item.pack_id;
        return {
          product_id: isPack ? null : item.product_id,
          pack_id: isPack ? item.pack_id : null,
          quantity: item.quantity,
          name: isPack ? (item.pack?.name || '') : (item.product?.name || ''),
          price: isPack ? (item.pack?.price || 0) : (item.product?.price || 0),
          image_url: isPack ? (item.pack?.image_url || null) : (item.product?.image_url || null),
          selected_color: item.selected_color,
          selected_version: item.selected_version,
          selected_options: item.selected_options,
        };
      });
    }
    // Fallback for direct URL buyNow which might still be used externally or via old links
    if (buyNowItem) return [buyNowItem];
    if (buyNowItem) return [buyNowItem];
    return [];
  }, [cartItems, buyNowItem]);

  // Track InitiateCheckout
  useEffect(() => {
    if (checkoutItems.length > 0) {
      trackPixelEvent('InitiateCheckout', {
        content_ids: checkoutItems.map(i => i.product_id || i.pack_id),
        content_type: 'product',
        value: checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        currency: 'DZD',
        num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0)
      });
    }
  }, [checkoutItems.length]); // Track only when items are loaded

  const itemsTotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Get rate for selected company + wilaya
  const currentRate = useMemo(() => {
    if (!shippingInfo.companyId || !shippingInfo.wilaya) return null;
    return allRates.find(
      (r) => r.company_id === shippingInfo.companyId && r.wilaya_code === shippingInfo.wilaya
    ) || null;
  }, [allRates, shippingInfo.companyId, shippingInfo.wilaya]);

  const shippingCost = currentRate
    ? (shippingInfo.deliveryType === 'desk' ? currentRate.desk_price : currentRate.home_price)
    : 0;

  // Calculate Discount
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return itemsTotal * (appliedCoupon.discount_value / 100);
    }
    return appliedCoupon.discount_value;
  }, [appliedCoupon, itemsTotal]);

  const totalWithShipping = Math.max(0, itemsTotal - discountAmount) + shippingCost;

  const selectedWilaya = ALGERIA_WILAYAS.find(w => w.code === shippingInfo.wilaya);
  const selectedCompany = companies.find(c => c.id === shippingInfo.companyId);

  const availableCompaniesForWilaya = useMemo(() => {
    if (!shippingInfo.wilaya) return companies;
    const companyIdsWithRates = new Set(
      allRates
        .filter(r => r.wilaya_code === shippingInfo.wilaya && (r.desk_price > 0 || r.home_price > 0))
        .map(r => r.company_id)
    );
    return companies.filter(c => companyIdsWithRates.has(c.id));
  }, [companies, allRates, shippingInfo.wilaya]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      // Direct RPC call to validate coupon logic
      const { data, error } = await supabase.rpc('validate_coupon', {
        coupon_code: couponCode,
        cart_total: itemsTotal
      });

      if (error) throw error;

      const result = data as any;
      if (result.valid) {
        setAppliedCoupon({
          code: couponCode,
          discount_type: result.discount_type,
          discount_value: result.discount_value,
        });
      } else {
        setCouponError(result.reason || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error(err);
      setCouponError('Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  if (buyNowLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (checkoutItems.length === 0 && !orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <div className="bg-muted/30 p-12 rounded-full h-48 w-48 mx-auto mb-8 flex items-center justify-center animate-in zoom-in duration-500">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/50" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-4">{t.checkout?.cartEmpty || "Cart is Empty"}</h1>
          <Link to="/products"><Button size="xl" className="rounded-full px-8">{t.checkout?.viewProducts || "View Products"}</Button></Link>
        </div>
      </Layout>
    );
  }

  if (orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center max-w-lg">
          <div className="bg-success/10 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center animate-in zoom-in spin-in-180 duration-700">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">{t.checkout?.orderConfirmed || "Order Confirmed!"}</h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            {t.checkout?.thankYou || "Thank you for your purchase."}
            <br />
            <strong className="text-foreground">{t.checkout?.cashOnDelivery || "Cash on Delivery"}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/orders"><Button size="lg" className="rounded-full w-full sm:w-auto">{t.checkout?.viewMyOrders || "View My Orders"}</Button></Link>
            ) : (
              <Link to="/"><Button size="lg" className="rounded-full w-full sm:w-auto">{t.common?.home || 'Home'}</Button></Link>
            )}
            <Link to="/products"><Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto">{t.checkout?.continueShopping || "Continue Shopping"}</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = shippingSchema.safeParse(shippingInfo);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      // Scroll to top of error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!currentRate && shippingInfo.companyId && shippingInfo.wilaya) {
      setErrors({ companyId: 'No rates available for this company and wilaya' });
      return;
    }

    setIsProcessing(true);
    try {
      const items = checkoutItems.map((item) => ({
        product_id: item.product_id,
        pack_id: item.pack_id,
        quantity: item.quantity,
        selected_color: item.selected_color,
        selected_version: item.selected_version,
        selected_options: item.selected_options,
        // Snapshot data
        name: item.name,
        price: item.price
      }));

      const deliveryNote = shippingInfo.deliveryType === 'desk'
        ? 'Desk delivery (Desk Stop)'
        : 'Home delivery';

      await createOrder.mutateAsync({
        items,
        shippingInfo: {
          address: shippingInfo.deliveryType === 'home'
            ? shippingInfo.address
            : `Desk - ${selectedWilaya?.name}`,
          city: selectedWilaya?.name || '',
          country: 'Algeria',
          zip: shippingInfo.wilaya,
          email: shippingInfo.email || undefined,
        },
        notes: `${deliveryNote} | Company: ${selectedCompany?.name} | Name: ${shippingInfo.fullName} | Phone: ${shippingInfo.phone} | Shipping: ${shippingCost} DA`,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
      });

      // Clear cart for both users and guests
      if (cartItems.length > 0) {
        await clearCart.mutateAsync();
      }

      // Save checkout info back to user profile (optional now that we have addresses)
      if (user) {
        await supabase
          .from('profiles')
          .update({
            full_name: shippingInfo.fullName,
            phone: shippingInfo.phone,
            address: shippingInfo.deliveryType === 'home' ? shippingInfo.address : undefined,
          })
          .eq('user_id', user.id);
      }

      setOrderPlaced(true);

      // Track Purchase
      trackPixelEvent('Purchase', {
        content_ids: items.map(i => i.product_id || i.pack_id),
        content_type: 'product',
        value: totalWithShipping,
        currency: 'DZD',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0)
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-32 md:pb-12 max-w-6xl">
        <h1 className="text-4xl font-extrabold text-foreground mb-10 tracking-tight text-center lg:text-left">{t.checkout?.title || "Checkout"}</h1>

        <form id="checkout-form" onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Shipping info */}
            <div className="lg:col-span-7 space-y-8">

              {/* Saved Addresses Selector */}
              {user && savedAddresses.length > 0 && (
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Home className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Saved Addresses</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedAddresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => selectAddress(addr)}
                        className={cn(
                          "group border rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-md relative overflow-hidden",
                          shippingInfo.address === addr.address_line1 && shippingInfo.wilaya === addr.zip_code
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border/50 hover:border-primary/50 bg-background/50"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start relative z-10">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{addr.label}</span>
                          {(shippingInfo.address === addr.address_line1 && shippingInfo.wilaya === addr.zip_code) && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">{addr.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{addr.address_line1}, {addr.city}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal & Wilaya */}
              <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{t.checkout?.deliveryInfo || "Delivery Information"}</h2>
                </div>

                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-semibold mb-2 block">{t.checkout?.fullName || "Full Name"}</Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                      placeholder={t.checkout?.enterFullName || "Enter your full name"}
                      className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                    />
                    {errors.fullName && <p className="text-sm text-destructive mt-1 font-medium">{errors.fullName}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold mb-2 block">{t.checkout?.phoneNumber || "Phone Number"}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        placeholder="0555 123 456"
                        className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                      />
                      {errors.phone && <p className="text-sm text-destructive mt-1 font-medium">{errors.phone}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold mb-2 block">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                        placeholder="you@example.com"
                        className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1 font-medium">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="wilaya" className="text-sm font-semibold mb-2 block">{t.checkout?.selectWilaya || "Select Wilaya"}</Label>
                    <Select
                      value={shippingInfo.wilaya}
                      onValueChange={(value) =>
                        setShippingInfo({ ...shippingInfo, wilaya: value, companyId: '' })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50 w-full">
                        <SelectValue placeholder={t.checkout?.chooseWilaya || "Choose Wilaya"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] rounded-xl border-border/50 bg-card/95 backdrop-blur-md">
                        {ALGERIA_WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya.code} value={wilaya.code} className="cursor-pointer">
                            <span className="font-mono text-muted-foreground mr-2">{wilaya.code}</span> {wilaya.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.wilaya && <p className="text-sm text-destructive mt-1 font-medium">{errors.wilaya}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Company */}
            <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t.checkout?.shippingCompany || "Shipping Company"}</h2>
              </div>

              {companiesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.checkout?.loadingShipping || "Loading shipping options..."}
                </div>
              ) : availableCompaniesForWilaya.length === 0 ? (
                <div className="bg-muted/30 p-4 rounded-xl text-center border border-dashed border-border">
                  <p className="text-muted-foreground">
                    {shippingInfo.wilaya ? (t.checkout?.noCompanies || "No shipping companies available for this wilaya.") : (t.checkout?.selectWilayaFirst || "Please select a wilaya first.")}
                  </p>
                </div>
              ) : (
                <RadioGroup
                  value={shippingInfo.companyId}
                  onValueChange={(value) => setShippingInfo({ ...shippingInfo, companyId: value })}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {availableCompaniesForWilaya.map((company) => {
                    const rate = allRates.find(
                      r => r.company_id === company.id && r.wilaya_code === shippingInfo.wilaya
                    );
                    const isSelected = shippingInfo.companyId === company.id;

                    return (
                      <label
                        key={company.id}
                        htmlFor={company -}
                        className={cn(
                          "relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer text-center transition-all duration-300",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                            : "border-border/50 hover:border-primary/30 bg-card/60 hover:bg-card/80"
                        )}
                      >
                        <RadioGroupItem value={company.id} id={company -} className="absolute top-3 right-3 opacity-0" />
                        {isSelected && <div className="absolute top-3 right-3 text-primary"><CheckCircle className="h-5 w-5 fill-primary/10" /></div>}

                        {company.logo_url ? (
                          <div className="w-14 h-14 rounded-xl border border-border/50 bg-white p-1 flex items-center justify-center overflow-hidden shadow-sm">
                            <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl border border-border/50 bg-muted flex items-center justify-center shadow-sm">
                            <Truck className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-sm block mb-1">{company.name}</span>
                          {rate && (
                            <div className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full inline-block">
                              {rate.desk_price} / {rate.home_price} DA
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
              {errors.companyId && <p className="text-sm text-destructive mt-2 font-medium">{errors.companyId}</p>}
            </div>

            {/* Delivery Type */}
            <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t.checkout?.deliveryType || "Delivery Method"}</h2>
              </div>

              <RadioGroup
                value={shippingInfo.deliveryType}
                onValueChange={(value: DeliveryType) =>
                  setShippingInfo({ ...shippingInfo, deliveryType: value, address: '' })
                }
                className="space-y-4"
              >
                <label htmlFor="desk" className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer",
                  shippingInfo.deliveryType === 'desk'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-primary/30 bg-card/60"
                )}>
                  <RadioGroupItem value="desk" id="desk" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-bold text-lg">{t.checkout?.deskDelivery || "Stop Desk"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{t.checkout?.deskDeliveryDesc || "Pick up your package from the shipping company's office."}</p>
                    {currentRate && (
                      <span className="inline-block text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {currentRate.desk_price} DA
                      </span>
                    )}
                  </div>
                </label>

                <label htmlFor="home" className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer",
                  shippingInfo.deliveryType === 'home'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-primary/30 bg-card/60"
                )}>
                  <RadioGroupItem value="home" id="home" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="h-5 w-5 text-primary" />
                      <span className="font-bold text-lg">{t.checkout?.homeDelivery || "Home Delivery"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{t.checkout?.homeDeliveryDesc || "Delivered directly to your doorstep."}</p>
                    {currentRate && (
                      <span className="inline-block text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {currentRate.home_price} DA
                      </span>
                    )}
                  </div>
                </label>
              </RadioGroup>
              {errors.deliveryType && (
                <p className="text-sm text-destructive mt-2 font-medium">{errors.deliveryType}</p>
              )}

              {shippingInfo.deliveryType === 'home' && (
                <div className="mt-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="address" className="text-sm font-semibold mb-2 block">{t.checkout?.deliveryAddress || "Home Address"}</Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    placeholder={t.checkout?.addressPlaceholder || "Street address, Building, Apartment..."}
                    className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                  />
                  {errors.address && <p className="text-sm text-destructive mt-1 font-medium">{errors.address}</p>}
                </div>
              )}
            </div>

            {/* Payment info */}
            <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t.checkout?.payment || "Payment Method"}</h2>
              </div>
              <div className="flex items-center gap-4 p-5 bg-success/5 border border-success/20 rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{t.checkout?.cashOnDelivery || "Cash on Delivery"}</p>
                  <p className="text-sm text-muted-foreground">{t.checkout?.cashOnDeliveryDesc || "Pay when you receive your order."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-5 relative">
            <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-6 md:p-8 shadow-lg sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border/50">
                {t.cart?.orderSummary || "Order Summary"}
              </h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {checkoutItems.map((item) => (
                  <div key={item.product_id || item.pack_id} className="flex gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-colors">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-bold text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/50 inline-block px-1.5 py-0.5 rounded-md self-start">
                        {t.packs?.qty || "Qty"}: {item.quantity}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center text-right">
                      <span className="text-sm font-bold">
                        {(item.price * item.quantity).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">DA</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">{t.checkout?.promoCode || "Have a promo code?"}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t.checkout?.enterPromoCode || "Enter Code"}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={isValidatingCoupon || appliedCoupon !== null}
                    className="bg-background/50 border-border/50"
                  />
                  {appliedCoupon ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isValidatingCoupon}
                    >
                      {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : (t.common?.apply || "Apply")}
                    </Button>
                  )}
                </div>
                {couponError && <p className="text-xs text-destructive mt-2 font-medium flex items-center gap-1"><X className="h-3 w-3" /> {couponError}</p>}
                {appliedCoupon && <p className="text-xs text-success mt-2 font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Coupon applied!</p>}
              </div>

              <div className="border-t border-border/50 pt-4 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart?.subtotal || "Subtotal"}</span>
                  <span className="font-mono">{itemsTotal.toLocaleString()} {t.common?.da || "DA"}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-success font-medium">
                    <span>{t.common?.discount || "Discount"} ({appliedCoupon.code})</span>
                    <span>-{discountAmount.toLocaleString()} {t.common?.da || "DA"}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {t.checkout?.shippingCost || "Shipping"}
                    {selectedCompany && <span className="text-xs ml-1 bg-muted px-1.5 py-0.5 rounded-md text-foreground">{selectedCompany.name}</span>}
                  </span>
                  <span className={!currentRate ? "text-muted-foreground/50 italic" : "font-mono"}>
                    {currentRate ? ${shippingCost}  : "--"}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-border/50 mt-2">
                  <span className="text-lg font-bold text-foreground">{t.cart?.total || "Total"}</span>
                  <span className="text-3xl font-extrabold text-primary">{totalWithShipping.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">{t.common?.da || "DA"}</span></span>
                </div>
              </div>

              <div className="hidden lg:block mt-8">
                <Button
                  type="submit"
                  size="xl"
                  className="w-full text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1"
                  disabled={isProcessing || !shippingInfo.companyId}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t.checkout?.processing || "Processing..."}
                    </>
                  ) : (
                    <>
                      {t.checkout?.confirmOrder || "Confirm Order"}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {t.cart?.algeriaOnly || "Shipping to all 58 Wilayas"}
              </p>
            </div>
          </div>
      </div>
    </form>
    </div >

    {/* Mobile Sticky Place Order Bar */ }
    < div className = "fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 lg:hidden z-50 animate-in slide-in-from-bottom duration-300" >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t.cart?.total || "Total"}</span>
          <span className="text-xl font-bold text-primary">{totalWithShipping.toLocaleString()} DA</span>
        </div>
        <Button
          size="lg"
          className="flex-1 rounded-full shadow-lg font-bold"
          form="checkout-form"
          type="submit"
          disabled={isProcessing || !shippingInfo.companyId}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t.checkout?.confirmOrder || "Confirm Order"} <CheckCircle className="ms-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div >
  </Layout >
);
}
