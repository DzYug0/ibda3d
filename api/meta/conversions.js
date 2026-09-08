/**
 * Meta Conversions API (CAPI) Serverless Endpoint
 * Securely hashes customer and event data, and forwards conversion events
 * to Meta Graph API for high event match quality and deduplication with Meta Pixel.
 *
 * Endpoint: /api/meta/conversions
 */

import crypto from 'crypto';

function sha256(val) {
    if (!val || typeof val !== 'string') return null;
    const clean = val.trim().toLowerCase();
    if (!clean) return null;
    // Don't re-hash if already a 64-char hex string
    if (/^[a-f0-9]{64}$/i.test(clean)) return clean;
    return crypto.createHash('sha256').update(clean).digest('hex');
}

function normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    // Strip all non-digit characters
    let digits = phone.replace(/\D/g, '');
    if (!digits) return null;

    // Algerian phone number normalization
    // If starts with 0 (e.g. 0555123456, 0666123456, 0777123456), prepend country code 213
    if (digits.startsWith('0') && digits.length === 10) {
        digits = '213' + digits.substring(1);
    } else if (!digits.startsWith('213') && (digits.length === 9 || digits.length === 8)) {
        digits = '213' + digits;
    }

    return digits;
}

export default async function handler(req, res) {
    // CORS headers for client-side invocations
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        const {
            event_name,
            event_id,
            event_source_url,
            user_data = {},
            custom_data = {},
            test_event_code: reqTestCode
        } = req.body || {};

        if (!event_name) {
            return res.status(400).json({ error: 'event_name is required' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zgunrxduxkleoogrmdzs.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_PJGcQgFmB-4FpEoGA7id2Q_pZS0L621';

        let pixelId = req.body?.pixel_id || process.env.META_PIXEL_ID || process.env.VITE_FACEBOOK_PIXEL_ID || null;
        let accessToken = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || null;
        let testEventCode = reqTestCode || process.env.META_TEST_EVENT_CODE || null;

        // If either pixelId or accessToken is missing from env, check store_settings in DB
        if (!pixelId || !accessToken) {
            try {
                const settingsRes = await fetch(`${supabaseUrl}/rest/v1/store_settings?select=key,value`, {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    }
                });
                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    for (const s of settings) {
                        const val = (s.value && typeof s.value === 'object' && 'val' in s.value) ? s.value.val : s.value;
                        if (!pixelId && s.key === 'facebook_pixel_id' && val) pixelId = val;
                        if (!accessToken && (s.key === 'meta_conversions_api_token' || s.key === 'meta_access_token') && val) accessToken = val;
                        if (!testEventCode && (s.key === 'meta_test_event_code') && val) testEventCode = val;
                    }
                }
            } catch (err) {
                console.warn('Could not load settings from DB:', err);
            }
        }

        if (!pixelId) {
            return res.status(200).json({
                success: false,
                warning: 'Meta Pixel ID is not configured. Event skipped.'
            });
        }

        if (!accessToken) {
            return res.status(200).json({
                success: false,
                warning: 'Meta Conversions API access token is not configured. Event skipped.'
            });
        }

        // Extract client IP and user agent from request headers
        const clientIp = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : req.socket?.remoteAddress || null;
        const clientUserAgent = req.headers['user-agent'] || null;

        // Prepare User Data with SHA-256 Hashing
        const formattedUserData = {};

        if (user_data.email) {
            const hashedEmail = sha256(user_data.email);
            if (hashedEmail) formattedUserData.em = [hashedEmail];
        }

        if (user_data.phone) {
            const normalizedPhone = normalizePhone(user_data.phone);
            const hashedPhone = sha256(normalizedPhone);
            if (hashedPhone) formattedUserData.ph = [hashedPhone];
        }

        if (user_data.firstName) {
            const hashedFn = sha256(user_data.firstName);
            if (hashedFn) formattedUserData.fn = [hashedFn];
        }

        if (user_data.lastName) {
            const hashedLn = sha256(user_data.lastName);
            if (hashedLn) formattedUserData.ln = [hashedLn];
        }

        if (user_data.city) {
            const hashedCity = sha256(user_data.city);
            if (hashedCity) formattedUserData.ct = [hashedCity];
        }

        if (user_data.zip) {
            const hashedZip = sha256(user_data.zip);
            if (hashedZip) formattedUserData.zp = [hashedZip];
        }

        // Country default: DZ (Algeria)
        const countryCode = user_data.country || 'dz';
        formattedUserData.country = [sha256(countryCode)];

        // Pass client IP and user agent directly (unhashed) as per Meta specs
        if (clientIp) formattedUserData.client_ip_address = clientIp;
        if (clientUserAgent) formattedUserData.client_user_agent = clientUserAgent;

        // Pass first-party cookies if available
        if (user_data.fbp) formattedUserData.fbp = user_data.fbp;
        if (user_data.fbc) formattedUserData.fbc = user_data.fbc;

        // Construct Meta Graph API payload
        const eventPayload = {
            event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_id: event_id || undefined,
            event_source_url: event_source_url || `https://www.ibda3d.shop`,
            action_source: 'website',
            user_data: formattedUserData,
            custom_data: {
                currency: custom_data.currency || 'DZD',
                value: custom_data.value !== undefined ? Number(custom_data.value) : undefined,
                content_type: custom_data.content_type || 'product',
                content_ids: custom_data.content_ids || undefined,
                contents: custom_data.contents || undefined,
                num_items: custom_data.num_items || undefined,
            }
        };

        const metaApiUrl = `https://graph.facebook.com/v19.0/${pixelId}/events`;
        const bodyPayload = {
            data: [eventPayload]
        };

        if (testEventCode) {
            bodyPayload.test_event_code = testEventCode;
        }

        const metaResponse = await fetch(`${metaApiUrl}?access_token=${accessToken}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
        });

        const metaResult = await metaResponse.json();

        if (!metaResponse.ok) {
            console.error('Meta CAPI Error:', metaResult);
            return res.status(metaResponse.status).json({
                success: false,
                error: metaResult
            });
        }

        return res.status(200).json({
            success: true,
            events_received: metaResult.events_received,
            fbtrace_id: metaResult.fbtrace_id
        });

    } catch (error) {
        console.error('Meta CAPI Internal Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
