import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, CheckCircle, Truck, Building2, Home, Loader2, X } from 'lucide-react';
import { z } from 'zod';
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
    if (!user) return;

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
    if (buyNowItem) return [buyNowItem];
    return [];
  }, [cartItems, buyNowItem]);

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
      const { data, error } = await supabase.rpc('validate_coupon' as any, {
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
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  if (checkoutItems.length === 0 && !orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t.checkout.cartEmpty}</h1>
          <Link to="/products"><Button size="lg">{t.checkout.viewProducts}</Button></Link>
        </div>
      </Layout>
    );
  }

  if (orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <div className="bg-success/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{t.checkout.orderConfirmed}</h1>
          <p className="text-muted-foreground mb-8">
            {t.checkout.thankYou}
            <br />
            <strong className="text-foreground">{t.checkout.cashOnDelivery}</strong>
          </p>
          <div className="flex gap-4 justify-center">
            {user && <Link to="/orders"><Button>{t.checkout.viewMyOrders}</Button></Link>}
            <Link to="/products"><Button variant="outline">{t.checkout.continueShopping}</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'chargily'>('cod');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = shippingSchema.safeParse(shippingInfo);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
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
      }));

      const deliveryNote = shippingInfo.deliveryType === 'desk'
        ? 'Desk delivery (Desk Stop)'
        : 'Home delivery';

      const orderData = await createOrder.mutateAsync({
        items,
        shippingInfo: {
          address: shippingInfo.deliveryType === 'home'
            ? shippingInfo.address
            : `Desk - ${selectedWilaya?.name}`,
          city: selectedWilaya?.name || '',
          country: 'Algeria',
          zip: shippingInfo.wilaya,
        },
        notes: `${deliveryNote} | Company: ${selectedCompany?.name} | Name: ${shippingInfo.fullName} | Phone: ${shippingInfo.phone} | Shipping: ${shippingCost} DA`,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod,
      });

      // Clear cart only for logged-in users
      if (user && cartItems.length > 0) {
        await clearCart.mutateAsync();
      }

      // Save checkout info back to user profile
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

      if (paymentMethod === 'chargily') {
        const { data, error } = await supabase.functions.invoke('create-chargily-checkout', {
          body: {
            orderId: orderData.id,
            successUrl: `${window.location.origin}/payment/success`,
            failureUrl: `${window.location.origin}/payment/failed`
          }
        });

        if (error) throw error;
        if (data?.checkout_url) {
          window.location.href = data.checkout_url;
          return; // Don't set orderPlaced(true) yet
        } else {
          throw new Error('Failed to retrieve payment URL');
        }
      }

      setOrderPlaced(true);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        // useOrders already establishes toast error, but we might want to be specific
      }
    } finally {
      // If redirecting, we might not want to set processing to false immediately 
      // to prevent user interaction, but since we modify window.location, it's fine.
      if (paymentMethod !== 'chargily') {
        setIsProcessing(false);
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t.checkout.title}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Saved Addresses Selector */}
              {user && savedAddresses.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Home className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Saved Addresses</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedAddresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => selectAddress(addr)}
                        className="border border-border rounded-lg p-3 cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">{addr.label}</span>
                          {/* Simple visual check if this address matches current form state */}
                          {(shippingInfo.address === addr.address_line1 && shippingInfo.wilaya === addr.zip_code) && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{addr.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{addr.address_line1}, {addr.city}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal & Wilaya */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{t.checkout.deliveryInfo}</h2>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="fullName">{t.checkout.fullName}</Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                      placeholder={t.checkout.enterFullName}
                    />
                    {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="wilaya">{t.checkout.selectWilaya}</Label>
                    <Select
                      value={shippingInfo.wilaya}
                      onValueChange={(value) =>
                        setShippingInfo({ ...shippingInfo, wilaya: value, companyId: '' })
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder={t.checkout.chooseWilaya} />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50 max-h-[300px]">
                        {ALGERIA_WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya.code} value={wilaya.code}>
                            {wilaya.code} - {wilaya.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.wilaya && <p className="text-sm text-destructive mt-1">{errors.wilaya}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">{t.checkout.phoneNumber}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      placeholder="0555 123 456"
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Company */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{t.checkout.shippingCompany}</h2>
                </div>

                {companiesLoading ? (
                  <p className="text-muted-foreground">{t.checkout.loadingShipping}</p>
                ) : availableCompaniesForWilaya.length === 0 ? (
                  <p className="text-muted-foreground">
                    {shippingInfo.wilaya ? t.checkout.noCompanies : t.checkout.selectWilayaFirst}
                  </p>
                ) : (
                  <RadioGroup
                    value={shippingInfo.companyId}
                    onValueChange={(value) => setShippingInfo({ ...shippingInfo, companyId: value })}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {availableCompaniesForWilaya.map((company) => {
                      const rate = allRates.find(
                        r => r.company_id === company.id && r.wilaya_code === shippingInfo.wilaya
                      );
                      return (
                        <label
                          key={company.id}
                          htmlFor={`company-${company.id}`}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer text-center transition-all duration-200 hover:scale-105 hover:shadow-md ${shippingInfo.companyId === company.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <RadioGroupItem value={company.id} id={`company-${company.id}`} className="absolute top-2 right-2" />
                          {company.logo_url ? (
                            <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                              <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center">
                              <Truck className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-semibold text-sm">{company.name}</span>
                          {rate && (
                            <p className="text-xs text-muted-foreground">
                              {rate.desk_price} / {rate.home_price} DA
                            </p>
                          )}
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
                {errors.companyId && <p className="text-sm text-destructive mt-2">{errors.companyId}</p>}
              </div>

              {/* Delivery Type */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{t.checkout.deliveryType}</h2>
                </div>

                <RadioGroup
                  value={shippingInfo.deliveryType}
                  onValueChange={(value: DeliveryType) =>
                    setShippingInfo({ ...shippingInfo, deliveryType: value, address: '' })
                  }
                  className="space-y-4"
                >
                  <div className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${shippingInfo.deliveryType === 'desk'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}>
                    <RadioGroupItem value="desk" id="desk" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="desk" className="flex items-center gap-2 cursor-pointer">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{t.checkout.deskDelivery}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{t.checkout.deskDeliveryDesc}</p>
                      {currentRate && (
                        <span className="inline-block mt-2 text-sm font-medium text-primary">
                          {currentRate.desk_price} DA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${shippingInfo.deliveryType === 'home'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}>
                    <RadioGroupItem value="home" id="home" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer">
                        <Home className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{t.checkout.homeDelivery}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{t.checkout.homeDeliveryDesc}</p>
                      {currentRate && (
                        <span className="inline-block mt-2 text-sm font-medium text-primary">
                          {currentRate.home_price} DA
                        </span>
                      )}
                    </div>
                  </div>
                </RadioGroup>
                {errors.deliveryType && (
                  <p className="text-sm text-destructive mt-2">{errors.deliveryType}</p>
                )}

                {shippingInfo.deliveryType === 'home' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Label htmlFor="address">{t.checkout.deliveryAddress}</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      placeholder={t.checkout.addressPlaceholder}
                      className="mt-2"
                    />
                    {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                  </div>
                )}
              </div>

              {/* Payment info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{t.checkout.payment}</h2>
                </div>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: 'cod' | 'chargily') => setPaymentMethod(value)}
                  className="space-y-4"
                >
                  <div className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}>
                    <RadioGroupItem value="cod" id="cod" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer font-semibold">
                        {t.checkout.cashOnDelivery}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{t.checkout.cashOnDeliveryDesc}</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${paymentMethod === 'chargily'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}>
                    <RadioGroupItem value="chargily" id="chargily" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="chargily" className="flex items-center gap-2 cursor-pointer font-semibold">
                        <span>Chargily Pay (CIB / Edahabia)</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Secure</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">Pay securely online using your CIB or Edahabia card.</p>
                      <div className="flex gap-2 mt-2">
                        {/* You could add card icons here if available */}
                        <div className="h-6 w-10 bg-muted/50 rounded flex items-center justify-center text-[10px]">CIB</div>
                        <div className="h-6 w-10 bg-muted/50 rounded flex items-center justify-center text-[10px]">Edahabia</div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="text-xl font-bold text-foreground mb-4">{t.cart.orderSummary}</h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {checkoutItems.map((item) => (
                    <div key={item.product_id || item.pack_id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{t.packs.qty} {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {(item.price * item.quantity).toFixed(0)} {t.common.da}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.checkout?.enterPromoCode || "Enter Promo Code"}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={isValidatingCoupon || appliedCoupon !== null}
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
                  {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
                  {appliedCoupon && <p className="text-xs text-success mt-1">Coupon applied!</p>}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t.cart.subtotal}</span>
                    <span>{itemsTotal.toFixed(0)} {t.common.da}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-success">
                      <span>{t.common?.discount || "Discount"} ({appliedCoupon.code})</span>
                      <span>-{discountAmount.toFixed(0)} {t.common.da}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {t.checkout.shippingCost}
                      {selectedCompany && ` (${selectedCompany.name})`}
                    </span>
                    <span>{shippingCost} {t.common.da}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                    <span>{t.cart.total}</span>
                    <span>{totalWithShipping.toFixed(0)} {t.common.da}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6"
                  disabled={isProcessing || !shippingInfo.companyId}
                >
                  {isProcessing ? t.checkout.processing : t.checkout.confirmOrder}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t.cart.algeriaOnly}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
