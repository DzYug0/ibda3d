import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Simple UUID generator to avoid adding a dependency
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const AnalyticsTracker = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Initialize Visitor and Session
    useEffect(() => {
        // Visitor ID (Persistent)
        let vid = localStorage.getItem('ibda3d_visitor_id');
        if (!vid) {
            vid = generateUUID();
            localStorage.setItem('ibda3d_visitor_id', vid);
        }
        setVisitorId(vid);

        // Session ID (Per Session)
        let sid = sessionStorage.getItem('ibda3d_session_id');
        if (!sid) {
            sid = generateUUID();
            sessionStorage.setItem('ibda3d_session_id', sid);
        }
        setSessionId(sid);
    }, []);

    // Track Pageview
    useEffect(() => {
        if (!visitorId || !sessionId) return;

        const trackPage = async () => {
            try {
                await (supabase.from('web_analytics' as any) as any).insert({
                    page_path: location.pathname + location.search,
                    visitor_id: visitorId,
                    session_id: sessionId,
                    user_id: user?.id || null,
                    device_type: getDeviceType(),
                    referrer: document.referrer || null,
                    country: null,
                    meta: {
                        title: document.title,
                        screen_width: window.innerWidth,
                        screen_height: window.innerHeight,
                    }
                });
            } catch (error) {
                console.error('Failed to track pageview', error);
            }
        };

        // Debounce slightly to avoid duplicate tracking in StrictMode or rapid navigation
        const timeout = setTimeout(trackPage, 500);
        return () => clearTimeout(timeout);
    }, [location, visitorId, sessionId, user]);

    return null;
};

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
}
