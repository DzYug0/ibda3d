/**
 * Unified Analytics Dispatcher
 *
 * Coordinates multi-channel e-commerce event tracking across:
 * 1. Google Analytics 4 (GA4 via gtag)
 * 2. Meta Pixel (Browser fbq)
 * 3. Meta Conversions API (Server CAPI)
 * 4. Internal Database Web Analytics (Funnel Ground Truth)
 *
 * Guarantees:
 * - Product IDs match stably across all channels (catalog UUIDs)
 * - Browser/Server deduplication via consistent eventID (for Purchase, InitiateCheckout, AddToCart)
 * - Currency and value calculations match accurately
 */

import {
  trackGAViewItem,
  trackGASearch,
  trackGAAddToCart,
  trackGARemoveFromCart,
  trackGAViewCart,
  trackGABeginCheckout,
  trackGAPurchase,
  GAItem,
} from './ga';
import { trackPixelEvent, sendCAPIEvent } from '@/components/analytics/FacebookPixel';
import { trackInternalFunnelEvent } from '@/components/analytics/AnalyticsTracker';

export interface ProductTrackingData {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  brand?: string;
  variant?: string;
}

/**
 * 1. View Item / View Content (Product details view)
 */
export function trackProductView(product: ProductTrackingData): void {
  if (!product?.id) return;

  const gaItem: GAItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    category: product.category,
    brand: product.brand || 'Ibda3D',
  };

  // GA4
  trackGAViewItem(gaItem);

  // Meta Pixel
  trackPixelEvent('ViewContent', {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    contents: [
      {
        id: product.id,
        quantity: 1,
        item_price: product.price,
      },
    ],
    value: product.price,
    currency: 'DZD',
  });

  // Internal Funnel
  trackInternalFunnelEvent('view_item', {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
  });
}

/**
 * 2. Search
 */
export function trackProductSearch(query: string, category?: string): void {
  if (!query || !query.trim()) return;

  // GA4
  trackGASearch(query.trim());

  // Meta Pixel
  trackPixelEvent('Search', {
    search_string: query.trim(),
    content_category: category || undefined,
  });
}

/**
 * 3. Add to Cart
 */
export function trackAddToCartEvent(
  product: ProductTrackingData,
  userData?: { email?: string; phone?: string; fullName?: string }
): void {
  if (!product?.id) return;

  const qty = product.quantity || 1;
  const totalPrice = product.price * qty;
  const eventId = `atc_${product.id}_${Date.now()}`;

  const gaItem: GAItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: qty,
    category: product.category,
    variant: product.variant,
  };

  // GA4
  trackGAAddToCart([gaItem], totalPrice);

  // Meta Pixel (with eventID)
  trackPixelEvent(
    'AddToCart',
    {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      contents: [
        {
          id: product.id,
          quantity: qty,
          item_price: product.price,
        },
      ],
      value: totalPrice,
      currency: 'DZD',
    },
    { eventID: eventId }
  );

  // Meta CAPI
  sendCAPIEvent({
    eventName: 'AddToCart',
    eventId,
    userData: userData
      ? {
          email: userData.email,
          phone: userData.phone,
          firstName: userData.fullName?.split(' ')[0],
          lastName: userData.fullName?.split(' ').slice(1).join(' ') || undefined,
        }
      : undefined,
    customData: {
      content_ids: [product.id],
      content_type: 'product',
      contents: [
        {
          id: product.id,
          quantity: qty,
          item_price: product.price,
        },
      ],
      value: totalPrice,
      currency: 'DZD',
      num_items: qty,
    },
  });

  // Internal Funnel
  trackInternalFunnelEvent('add_to_cart', {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    quantity: qty,
    value: totalPrice,
  });
}

/**
 * 4. Remove from Cart
 */
export function trackRemoveFromCartEvent(product: ProductTrackingData): void {
  if (!product?.id) return;

  const qty = product.quantity || 1;
  const totalPrice = product.price * qty;

  const gaItem: GAItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: qty,
  };

  // GA4
  trackGARemoveFromCart([gaItem], totalPrice);

  // Internal Funnel
  trackInternalFunnelEvent('remove_from_cart', {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    quantity: qty,
  });
}

/**
 * 5. View Cart
 */
export function trackViewCartEvent(items: ProductTrackingData[], totalValue: number): void {
  if (!items || items.length === 0) return;

  const gaItems: GAItem[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
  }));

  // GA4
  trackGAViewCart(gaItems, totalValue);

  // Internal Funnel
  trackInternalFunnelEvent('view_cart', {
    items_count: items.length,
    total_value: totalValue,
  });
}

/**
 * 6. Initiate / Begin Checkout
 */
export function trackInitiateCheckoutEvent(
  items: ProductTrackingData[],
  totalValue: number,
  userData?: { email?: string; phone?: string; fullName?: string }
): void {
  if (!items || items.length === 0) return;

  const eventId = `init_chk_${Date.now()}`;
  const contentIds = items.map((i) => i.id);
  const contents = items.map((i) => ({
    id: i.id,
    quantity: i.quantity || 1,
    item_price: i.price,
  }));

  const gaItems: GAItem[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
  }));

  // GA4
  trackGABeginCheckout(gaItems, totalValue);

  // Meta Pixel (with eventID)
  trackPixelEvent(
    'InitiateCheckout',
    {
      content_ids: contentIds,
      content_type: 'product',
      contents,
      value: totalValue,
      currency: 'DZD',
      num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    },
    { eventID: eventId }
  );

  // Meta CAPI
  sendCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId,
    userData: userData
      ? {
          email: userData.email,
          phone: userData.phone,
          firstName: userData.fullName?.split(' ')[0],
          lastName: userData.fullName?.split(' ').slice(1).join(' ') || undefined,
        }
      : undefined,
    customData: {
      content_ids: contentIds,
      content_type: 'product',
      contents,
      value: totalValue,
      currency: 'DZD',
      num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    },
  });

  // Internal Funnel
  trackInternalFunnelEvent('begin_checkout', {
    items_count: items.length,
    total_value: totalValue,
    content_ids: contentIds,
  });
}

/**
 * 7. Purchase
 */
export function trackPurchaseEvent(order: {
  id: string;
  totalWithShipping: number;
  shippingCost?: number;
  items: ProductTrackingData[];
  shippingInfo?: {
    email?: string;
    phone?: string;
    fullName?: string;
    city?: string;
    wilaya?: string;
  };
}): void {
  if (!order?.id) return;

  const contentIds = order.items.map((i) => i.id);
  const contents = order.items.map((i) => ({
    id: i.id,
    quantity: i.quantity || 1,
    item_price: i.price,
  }));

  const gaItems: GAItem[] = order.items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
  }));

  // 1. GA4 Purchase
  trackGAPurchase({
    id: order.id,
    value: order.totalWithShipping,
    shipping: order.shippingCost || 0,
    items: gaItems,
  });

  // 2. Meta Pixel Purchase (deduplicated by order.id)
  trackPixelEvent(
    'Purchase',
    {
      content_ids: contentIds,
      content_type: 'product',
      contents,
      value: order.totalWithShipping,
      currency: 'DZD',
      num_items: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    },
    { eventID: order.id }
  );

  // 3. Meta Conversions API (CAPI) with matching eventId
  sendCAPIEvent({
    eventName: 'Purchase',
    eventId: order.id,
    userData: {
      email: order.shippingInfo?.email || undefined,
      phone: order.shippingInfo?.phone,
      firstName: order.shippingInfo?.fullName?.split(' ')[0] || order.shippingInfo?.fullName,
      lastName: order.shippingInfo?.fullName?.split(' ').slice(1).join(' ') || undefined,
      city: order.shippingInfo?.city,
      zip: order.shippingInfo?.wilaya,
      country: 'dz',
    },
    customData: {
      value: order.totalWithShipping,
      currency: 'DZD',
      content_ids: contentIds,
      content_type: 'product',
      contents,
      num_items: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    },
  });

  // 4. Internal Funnel
  trackInternalFunnelEvent('purchase', {
    order_id: order.id,
    total_amount: order.totalWithShipping,
    items_count: order.items.length,
    content_ids: contentIds,
  });
}
