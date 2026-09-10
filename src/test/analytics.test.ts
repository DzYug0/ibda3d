import { describe, it, expect, beforeEach } from 'vitest';
import { parseUTMFromUrl, formatUTMForOrderNotes } from '../lib/utm';
import { getGAMeasurementId } from '../lib/ga';

describe('UTM & Campaign Attribution', () => {
  it('parses valid UTM and click ID parameters from search string', () => {
    const search = '?utm_source=facebook&utm_medium=cpc&utm_campaign=winter_promo&utm_content=carousel_ad&utm_term=3d_printer&fbclid=fb12345';
    const parsed = parseUTMFromUrl(search);

    expect(parsed).toBeDefined();
    expect(parsed?.utm_source).toBe('facebook');
    expect(parsed?.utm_medium).toBe('cpc');
    expect(parsed?.utm_campaign).toBe('winter_promo');
    expect(parsed?.utm_content).toBe('carousel_ad');
    expect(parsed?.utm_term).toBe('3d_printer');
    expect(parsed?.fbclid).toBe('fb12345');
    expect(parsed?.captured_at).toBeDefined();
  });

  it('returns null if no UTM parameters are present in search string', () => {
    const search = '?category=filaments&sort=price_asc';
    const parsed = parseUTMFromUrl(search);
    expect(parsed).toBeNull();
  });

  it('formats UTM parameters cleanly for order notes', () => {
    const utm = {
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'black_friday',
      fbclid: '1234567890abcdef'
    };
    const formatted = formatUTMForOrderNotes(utm);

    expect(formatted).toBeDefined();
    expect(formatted).toContain('Source: facebook');
    expect(formatted).toContain('Medium: cpc');
    expect(formatted).toContain('Campaign: black_friday');
    expect(formatted).toContain('fbclid: 1234567890ab...');
    expect(formatted?.startsWith('[UTM:')).toBe(true);
  });

  it('returns null when formatting empty or null UTM for order notes', () => {
    expect(formatUTMForOrderNotes(null)).toBeNull();
    expect(formatUTMForOrderNotes({})).toBeNull();
  });
});

describe('Google Analytics 4 Configuration', () => {
  it('resolves measurement ID from store settings when provided', () => {
    const id = getGAMeasurementId('G-CUSTOM12345');
    expect(id).toBe('G-CUSTOM12345');
  });

  it('handles empty settings id gracefully', () => {
    const id = getGAMeasurementId('   ');
    expect(typeof id === 'string' || id === null).toBe(true);
  });
});
