/**
 * Google Analytics 4 (GA4) Integration
 *
 * Implements GA4 e-commerce tracking with official GA4 event taxonomy:
 * - page_view
 * - view_item
 * - search
 * - add_to_cart
 * - remove_from_cart
 * - view_cart
 * - begin_checkout
 * - purchase
 *
 * Credentials can be supplied via environment variable (VITE_GA_MEASUREMENT_ID or NEXT_PUBLIC_GA_MEASUREMENT_ID)
 * or dynamically from the database store settings (ga_measurement_id).
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let isInitialized = false;
let currentMeasurementId: string | null = null;

/**
 * Resolves the Google Analytics Measurement ID from env vars or settings
 */
export function getGAMeasurementId(settingsId?: string | null): string | null {
  if (settingsId && settingsId.trim()) {
    return settingsId.trim();
  }

  // Support Vite and Next.js style env variables
  const envId =
    (typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_GA_MEASUREMENT_ID || import.meta.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
      : null);

  if (envId && typeof envId === 'string' && envId.trim()) {
    return envId.trim();
  }

  return null;
}

/**
 * Initializes GA4 script and config
 */
export function initGA(measurementId: string): void {
  if (typeof window === 'undefined' || !measurementId) return;

  const cleanId = measurementId.trim();
  if (isInitialized && currentMeasurementId === cleanId) return;

  // Initialize dataLayer and gtag function if not present
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  // Only append script once
  const existingScript = document.getElementById('ga-gtag-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'ga-gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', cleanId, {
    send_page_view: false, // Pageviews are handled on router transitions
  });

  isInitialized = true;
  currentMeasurementId = cleanId;
}

/**
 * Generic GA4 Event Tracker
 */
export function trackGAEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/**
 * Tracks route / pageview change
 */
export function trackGAPageView(path: string, title?: string): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && currentMeasurementId) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }
}

export interface GAItem {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
  category?: string;
  brand?: string;
  variant?: string;
}

/**
 * Format helper for GA4 items array
 */
function formatGAItems(items: GAItem[]) {
  return items.map((item, index) => ({
    item_id: item.id,
    item_name: item.name,
    price: item.price !== undefined ? Number(item.price) : 0,
    quantity: item.quantity || 1,
    item_category: item.category || '3D Products',
    item_brand: item.brand || 'Ibda3D',
    item_variant: item.variant || undefined,
    index: index + 1,
  }));
}

/**
 * view_item (Product view)
 */
export function trackGAViewItem(item: GAItem): void {
  trackGAEvent('view_item', {
    currency: 'DZD',
    value: item.price || 0,
    items: formatGAItems([item]),
  });
}

/**
 * search
 */
export function trackGASearch(searchTerm: string): void {
  if (!searchTerm || !searchTerm.trim()) return;
  trackGAEvent('search', {
    search_term: searchTerm.trim(),
  });
}

/**
 * add_to_cart
 */
export function trackGAAddToCart(items: GAItem[], value?: number): void {
  const calculatedValue =
    value !== undefined
      ? value
      : items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  trackGAEvent('add_to_cart', {
    currency: 'DZD',
    value: calculatedValue,
    items: formatGAItems(items),
  });
}

/**
 * remove_from_cart
 */
export function trackGARemoveFromCart(items: GAItem[], value?: number): void {
  const calculatedValue =
    value !== undefined
      ? value
      : items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  trackGAEvent('remove_from_cart', {
    currency: 'DZD',
    value: calculatedValue,
    items: formatGAItems(items),
  });
}

/**
 * view_cart
 */
export function trackGAViewCart(items: GAItem[], value: number): void {
  trackGAEvent('view_cart', {
    currency: 'DZD',
    value,
    items: formatGAItems(items),
  });
}

/**
 * begin_checkout
 */
export function trackGABeginCheckout(items: GAItem[], value: number): void {
  trackGAEvent('begin_checkout', {
    currency: 'DZD',
    value,
    items: formatGAItems(items),
  });
}

/**
 * purchase
 */
export function trackGAPurchase(order: {
  id: string;
  value: number;
  shipping?: number;
  items: GAItem[];
}): void {
  trackGAEvent('purchase', {
    transaction_id: order.id,
    currency: 'DZD',
    value: order.value,
    shipping: order.shipping || 0,
    items: formatGAItems(order.items),
  });
}
