import { describe, it, expect } from 'vitest';
// @ts-ignore
import productFeedHandler from '../../api/meta/product-feed.js';
// @ts-ignore
import conversionsHandler from '../../api/meta/conversions.js';

describe('Meta Catalog Product Feed', () => {
  it('generates valid RSS 2.0 XML with Google Base namespace', async () => {
    let output = '';
    let status = 200;
    const headers: Record<string, string> = {};

    const req = { query: {} };
    const res = {
      setHeader: (k: string, v: string) => { headers[k] = v; },
      status: (code: number) => { status = code; return res; },
      send: (body: string) => { output = body; },
      json: (data: any) => { output = JSON.stringify(data); }
    };

    await productFeedHandler(req, res);

    expect(status).toBe(200);
    expect(headers['Content-Type']).toBe('application/xml; charset=utf-8');
    expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(output).toContain('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">');
    expect(output).toContain('<title>Ibda3D Product Catalog Feed</title>');
    expect(output).toContain('</rss>');

    // Check items exist
    expect(output).toContain('<item>');
    expect(output).toContain('<g:id>');
    expect(output).toContain('<g:title>');
    expect(output).toContain('<g:price>');
    expect(output).toContain('DZD</g:price>');
    expect(output).toContain('<g:availability>');
    expect(output).toContain('<g:condition>new</g:condition>');
    expect(output).toContain('<g:brand><![CDATA[Ibda3D]]></g:brand>');
    expect(output).toContain('https://www.ibda3d.shop/');
  });

  it('supports JSON format via ?format=json query', async () => {
    let outputJson: any = null;
    let status = 200;

    const req = { query: { format: 'json' } };
    const res = {
      setHeader: () => {},
      status: (code: number) => { status = code; return res; },
      send: () => {},
      json: (data: any) => { outputJson = data; }
    };

    await productFeedHandler(req, res);

    expect(status).toBe(200);
    expect(outputJson).toBeDefined();
    expect(outputJson.title).toBe('Ibda3D Product Catalog');
    expect(outputJson.items.length).toBeGreaterThan(0);
    const firstItem = outputJson.items[0];
    expect(firstItem.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(firstItem.price).toContain('DZD');
    expect(firstItem.brand).toBe('Ibda3D');
    expect(firstItem.condition).toBe('new');
    expect(['in stock', 'out of stock']).toContain(firstItem.availability);
  });
});

describe('Meta Conversions API Handler', () => {
  it('handles OPTIONS preflight requests', async () => {
    let status = 0;
    const req = { method: 'OPTIONS' };
    const res = {
      setHeader: () => {},
      status: (code: number) => { status = code; return res; },
      end: () => {}
    };

    await conversionsHandler(req, res);
    expect(status).toBe(200);
  });

  it('rejects non-POST methods with 405', async () => {
    let status = 0;
    let jsonBody: any = null;
    const req = { method: 'GET' };
    const res = {
      setHeader: () => {},
      status: (code: number) => { status = code; return res; },
      json: (data: any) => { jsonBody = data; }
    };

    await conversionsHandler(req, res);
    expect(status).toBe(405);
    expect(jsonBody.error).toContain('Method Not Allowed');
  });

  it('validates event_name requirement', async () => {
    let status = 0;
    let jsonBody: any = null;
    const req = {
      method: 'POST',
      body: {},
      headers: {}
    };
    const res = {
      setHeader: () => {},
      status: (code: number) => { status = code; return res; },
      json: (data: any) => { jsonBody = data; }
    };

    await conversionsHandler(req, res);
    expect(status).toBe(400);
    expect(jsonBody.error).toBe('event_name is required');
  });
});
