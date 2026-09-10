import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredUTMParams } from '@/lib/utm';

// Simple UUID generator
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Returns current visitor and session IDs (initialized if missing)
 */
export function getVisitorSession(): { visitorId: string; sessionId: string } {
    if (typeof window === 'undefined') {
        return { visitorId: 'server', sessionId: 'server' };
    }

    let vid = localStorage.getItem('ibda3d_visitor_id');
    if (!vid) {
        vid = generateUUID();
        localStorage.setItem('ibda3d_visitor_id', vid);
    }

    let sid = sessionStorage.getItem('ibda3d_session_id');
    if (!sid) {
        sid = generateUUID();
        sessionStorage.setItem('ibda3d_session_id', sid);
    }

    return { visitorId: vid, sessionId: sid };
}

export function getDeviceType() {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
}

/**
 * Internal funnel event logger to web_analytics table
 */
export async function trackInternalFunnelEvent(
    eventType: 'view_item' | 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout' | 'purchase' | 'custom',
    details: Record<string, any> = {}
) {
    if (typeof window === 'undefined') return;

    try {
        const { visitorId, sessionId } = getVisitorSession();
        const utm = getStoredUTMParams();

        await (supabase.from('web_analytics' as any) as any).insert({
            page_path: window.location.pathname + window.location.search,
            visitor_id: visitorId,
            session_id: sessionId,
            device_type: getDeviceType(),
            referrer: document.referrer || null,
            meta: {
                event_type: eventType,
                title: document.title,
                utm: utm || undefined,
                timestamp: new Date().toISOString(),
                ...details
            }
        });
    } catch (err) {
        // Non-blocking
        console.warn('[Internal Analytics] Failed to log funnel event:', err);
    }
}

export const AnalyticsTracker = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Initialize Visitor and Session
    useEffect(() => {
        const { visitorId: vid, sessionId: sid } = getVisitorSession();
        setVisitorId(vid);
        setSessionId(sid);
    }, []);

    // Track Pageview
    useEffect(() => {
        if (!visitorId || !sessionId) return;

        // Skip tracking admin routes to prevent skewing customer metrics
        if (location.pathname.startsWith('/admin')) return;

        const trackPage = async () => {
            try {
                const utm = getStoredUTMParams();

                await (supabase.from('web_analytics' as any) as any).insert({
                    page_path: location.pathname + location.search,
                    visitor_id: visitorId,
                    session_id: sessionId,
                    user_id: user?.id || null,
                    device_type: getDeviceType(),
                    referrer: document.referrer || null,
                    country: null,
                    meta: {
                        event_type: 'page_view',
                        title: document.title,
                        screen_width: window.innerWidth,
                        screen_height: window.innerHeight,
                        utm: utm || undefined,
                    }
                });
            } catch (error) {
                console.error('Failed to track pageview', error);
            }
        };

        // Debounce slightly to avoid duplicate tracking in StrictMode or rapid navigation
        const timeout = setTimeout(trackPage, 500);
        return () => clearTimeout(timeout);
    }, [location.pathname, location.search, visitorId, sessionId, user]);

    return null;
};
