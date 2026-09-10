import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { getGAMeasurementId, initGA, trackGAPageView } from '@/lib/ga';
import { captureAndStoreUTM } from '@/lib/utm';

export const GoogleAnalytics = () => {
  const { data: settings } = useStoreSettings();
  const location = useLocation();
  const isFirstMount = useRef(true);

  // 1. Capture UTM parameters on any route transition
  useEffect(() => {
    captureAndStoreUTM();
  }, [location.pathname, location.search]);

  // 2. Initialize GA4 with settings or env
  const measurementId = getGAMeasurementId((settings as any)?.ga_measurement_id);

  useEffect(() => {
    if (measurementId) {
      initGA(measurementId);
    }
  }, [measurementId]);

  // 3. Track Page Views on navigation (skip /admin routes to avoid polluting store traffic)
  useEffect(() => {
    if (!measurementId) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Track initial page if not admin
      if (!location.pathname.startsWith('/admin')) {
        trackGAPageView(location.pathname + location.search);
      }
      return;
    }

    if (!location.pathname.startsWith('/admin')) {
      trackGAPageView(location.pathname + location.search);
    }
  }, [location.pathname, location.search, measurementId]);

  return null;
};
