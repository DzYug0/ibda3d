/**
 * UTM & Campaign Attribution Engine
 *
 * Captures, persists, and provides attribution parameters across visitor sessions:
 * - utm_source, utm_medium, utm_campaign, utm_content, utm_term
 * - gclid (Google Click ID), fbclid (Facebook Click ID)
 *
 * Implements First-Touch and Last-Touch attribution models stored in
 * sessionStorage and localStorage for order attribution.
 */

export interface UTMParams {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  captured_at?: string;
  landing_url?: string;
}

const STORAGE_KEYS = {
  FIRST_TOUCH: 'ibda3d_utm_first',
  LAST_TOUCH: 'ibda3d_utm_last',
  SESSION: 'ibda3d_utm_session',
};

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
] as const;

/**
 * Parses UTM and ad click ID parameters from the current URL or provided search string
 */
export function parseUTMFromUrl(search: string = window.location.search): UTMParams | null {
  if (!search) return null;

  try {
    const params = new URLSearchParams(search);
    const utmData: UTMParams = {};
    let hasAnyUtm = false;

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val && val.trim()) {
        utmData[key] = val.trim();
        hasAnyUtm = true;
      }
    }

    if (!hasAnyUtm) return null;

    utmData.captured_at = new Date().toISOString();
    utmData.landing_url = window.location.pathname + window.location.search;
    return utmData;
  } catch {
    return null;
  }
}

/**
 * Captures UTM parameters from current URL and preserves them in storage
 */
export function captureAndStoreUTM(): UTMParams | null {
  if (typeof window === 'undefined') return null;

  const currentUTM = parseUTMFromUrl();
  if (!currentUTM) return getStoredUTMParams();

  try {
    const serialized = JSON.stringify(currentUTM);

    // 1. Session Storage (active session)
    sessionStorage.setItem(STORAGE_KEYS.SESSION, serialized);

    // 2. Last Touch (always update when UTMs are present in URL)
    localStorage.setItem(STORAGE_KEYS.LAST_TOUCH, serialized);

    // 3. First Touch (only set if not already present)
    if (!localStorage.getItem(STORAGE_KEYS.FIRST_TOUCH)) {
      localStorage.setItem(STORAGE_KEYS.FIRST_TOUCH, serialized);
    }

    return currentUTM;
  } catch (err) {
    console.warn('[UTM] Error saving UTM params:', err);
    return currentUTM;
  }
}

/**
 * Retrieves the most relevant UTM parameters:
 * Priority: Current Session -> Last Touch -> First Touch
 */
export function getStoredUTMParams(): UTMParams | null {
  if (typeof window === 'undefined') return null;

  try {
    // Check session first
    const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    if (sessionData) return JSON.parse(sessionData);

    // Fallback to last touch
    const lastTouchData = localStorage.getItem(STORAGE_KEYS.LAST_TOUCH);
    if (lastTouchData) return JSON.parse(lastTouchData);

    // Fallback to first touch
    const firstTouchData = localStorage.getItem(STORAGE_KEYS.FIRST_TOUCH);
    if (firstTouchData) return JSON.parse(firstTouchData);

    return null;
  } catch (err) {
    console.warn('[UTM] Error reading stored UTM params:', err);
    return null;
  }
}

/**
 * Returns a human-readable attribution string for order notes fallback
 * e.g. "Campaign: facebook / winter_sale (cpc)"
 */
export function formatUTMForOrderNotes(utm: UTMParams | null): string | null {
  if (!utm) return null;

  const parts: string[] = [];
  if (utm.utm_source) parts.push(`Source: ${utm.utm_source}`);
  if (utm.utm_medium) parts.push(`Medium: ${utm.utm_medium}`);
  if (utm.utm_campaign) parts.push(`Campaign: ${utm.utm_campaign}`);
  if (utm.utm_content) parts.push(`Content: ${utm.utm_content}`);
  if (utm.utm_term) parts.push(`Term: ${utm.utm_term}`);
  if (utm.fbclid) parts.push(`fbclid: ${utm.fbclid.slice(0, 12)}...`);
  if (utm.gclid) parts.push(`gclid: ${utm.gclid.slice(0, 12)}...`);

  if (parts.length === 0) return null;
  return `[UTM: ${parts.join(' | ')}]`;
}
