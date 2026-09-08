import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useStoreSettings';

declare global {
    interface Window {
        fbq: any;
        _fbq: any;
    }
}

/**
 * Reads a specific cookie value by name
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Returns the Facebook browser cookie (_fbp)
 */
export function getFbp(): string | null {
    return getCookie('_fbp');
}

/**
 * Returns the Facebook click cookie (_fbc)
 */
export function getFbc(): string | null {
    return getCookie('_fbc');
}

export const FacebookPixel = () => {
    const { data: settings } = useStoreSettings();
    const location = useLocation();
    const activePixelId = settings?.facebook_pixel_id?.trim() || '1057631003921366';
    const isFirstMount = useRef(true);
    const lastInitializedPixel = useRef<string | null>('1057631003921366');

    // Initialize / Update Pixel
    useEffect(() => {
        if (!activePixelId) return;

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('ibda3d_pixel_id', activePixelId);
            } catch (e) {}

            // Standard Facebook Pixel initialization code (if not already loaded by index.html)
            if (!window.fbq) {
                !function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                    if (f.fbq) return; n = f.fbq = function () {
                        n.callMethod ?
                        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                    };
                    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                    n.queue = []; t = b.createElement(e); t.async = !0;
                    t.src = v; s = b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t, s)
                }(window, document, 'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
            }

            // Re-init if pixel changed or first initialization
            if (lastInitializedPixel.current !== activePixelId) {
                window.fbq('init', activePixelId);
                lastInitializedPixel.current = activePixelId;
            }
        }
    }, [activePixelId]);

    // Track PageView on route change (avoid duplicate PageView on first load since index.html already fired it)
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [location.pathname, activePixelId]);

    return null;
};

export interface TrackPixelOptions {
    eventID?: string;
}

/**
 * Helper utility to track standard & custom Meta Pixel events in browser
 * Supports optional eventID for deduplication with Meta Conversions API (CAPI).
 */
export const trackPixelEvent = (
    eventName: string,
    data?: Record<string, any>,
    options?: TrackPixelOptions
) => {
    if (typeof window !== 'undefined' && window.fbq) {
        if (options?.eventID) {
            window.fbq('track', eventName, data, { eventID: options.eventID });
        } else {
            window.fbq('track', eventName, data);
        }
    }
};

export interface CAPIEventPayload {
    eventName: string;
    eventId?: string;
    pixelId?: string;
    userData?: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        city?: string;
        zip?: string;
        country?: string;
    };
    customData?: {
        value?: number;
        currency?: string;
        content_ids?: string[];
        content_type?: string;
        contents?: Array<{ id: string; quantity: number; item_price?: number }>;
        num_items?: number;
    };
}

/**
 * Sends a server-side conversion event to Meta Conversions API (CAPI)
 * via the /api/meta/conversions serverless route.
 * Non-blocking and fails gracefully.
 */
export const sendCAPIEvent = async ({
    eventName,
    eventId,
    pixelId,
    userData = {},
    customData = {}
}: CAPIEventPayload) => {
    try {
        if (typeof window === 'undefined') return;

        const fbp = getFbp();
        const fbc = getFbc();

        let resolvedPixelId = pixelId;
        if (!resolvedPixelId) {
            try {
                resolvedPixelId = localStorage.getItem('ibda3d_pixel_id') || '1057631003921366';
            } catch (e) {
                resolvedPixelId = '1057631003921366';
            }
        }

        const payload = {
            event_name: eventName,
            event_id: eventId,
            pixel_id: resolvedPixelId,
            event_source_url: window.location.href,
            user_data: {
                ...userData,
                fbp: fbp || undefined,
                fbc: fbc || undefined
            },
            custom_data: customData
        };

        // Fire and forget / background request
        fetch('/api/meta/conversions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => {
            console.warn('[Meta CAPI] Event dispatch failed:', err);
        });
    } catch (err) {
        console.warn('[Meta CAPI] Error preparing event:', err);
    }
};
