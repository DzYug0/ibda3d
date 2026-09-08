/**
 * Meta Commerce Manager / Facebook & Instagram Product Feed Endpoint
 * Generates an official RSS 2.0 XML catalog feed (with Google Base namespace)
 * directly from the Supabase products and packs database.
 *
 * Endpoint: /api/meta/product-feed
 * Format: XML (default), or ?format=json / ?format=csv
 */

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function cleanDescription(text, fallbackTitle) {
    if (!text || typeof text !== 'string') {
        return `Discover ${fallbackTitle} at Ibda3D. High-quality 3D printed products and fast delivery across Algeria.`;
    }
    // Strip HTML tags and normalize whitespace
    const clean = text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    if (clean.length < 10) {
        return `${clean} - Discover ${fallbackTitle} at Ibda3D. Premium quality 3D printing in Algeria.`;
    }
    return clean;
}

function wrapCdata(text) {
    if (!text) return '';
    // Prevent CDATA closing tag injection
    const sanitized = text.toString().replace(/]]>/g, ']]]]><![CDATA[>');
    return `<![CDATA[${sanitized}]]>`;
}

export default async function handler(req, res) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zgunrxduxkleoogrmdzs.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_PJGcQgFmB-4FpEoGA7id2Q_pZS0L621';
    const baseUrl = (process.env.SITE_URL || 'https://www.ibda3d.shop').replace(/\/$/, '');
    const brand = 'Ibda3D';
    const format = req.query?.format || 'xml';

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    };

    try {
        // 1. Fetch categories for name mapping
        const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=id,name,slug`, { headers });
        const categories = catRes.ok ? await catRes.json() : [];
        const categoryMap = {};
        for (const cat of categories) {
            categoryMap[cat.id] = cat.name;
        }

        // 2. Fetch active products
        const prodRes = await fetch(
            `${supabaseUrl}/rest/v1/products?is_active=eq.true&select=id,name,slug,description,price,compare_at_price,stock_quantity,image_url,images,category_id,is_featured,created_at,updated_at`,
            { headers }
        );
        const products = prodRes.ok ? await prodRes.json() : [];

        // 3. Fetch active packs (bundles)
        const packRes = await fetch(
            `${supabaseUrl}/rest/v1/packs?is_active=eq.true&select=id,name,slug,description,price,compare_at_price,image_url,is_featured,created_at,updated_at`,
            { headers }
        );
        const packs = packRes.ok ? await packRes.json() : [];

        // Combine items
        const catalogItems = [];

        // Process Products
        for (const product of products) {
            const hasSale = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
            const regularPrice = hasSale ? Number(product.compare_at_price) : Number(product.price);
            const salePrice = hasSale ? Number(product.price) : null;
            const inStock = product.stock_quantity > 0;
            const categoryName = product.category_id ? (categoryMap[product.category_id] || '3D Printing') : '3D Printing';
            const desc = cleanDescription(product.description, product.name);

            // Filter valid image
            const mainImage = product.image_url || 'https://www.ibda3d.shop/pwa-192x192.png';
            const additionalImages = Array.isArray(product.images)
                ? product.images.filter(img => typeof img === 'string' && img.startsWith('http') && img !== mainImage).slice(0, 10)
                : [];

            catalogItems.push({
                id: product.id,
                title: product.name,
                description: desc,
                link: `${baseUrl}/products/${product.slug}`,
                image_link: mainImage,
                additional_image_links: additionalImages,
                availability: inStock ? 'in stock' : 'out of stock',
                condition: 'new',
                price: `${regularPrice.toFixed(2)} DZD`,
                sale_price: salePrice !== null ? `${salePrice.toFixed(2)} DZD` : null,
                brand,
                product_type: categoryName,
                custom_label_0: product.is_featured ? 'Featured' : 'Standard',
                item_group_id: product.id
            });
        }

        // Process Packs
        for (const pack of packs) {
            const hasSale = pack.compare_at_price && Number(pack.compare_at_price) > Number(pack.price);
            const regularPrice = hasSale ? Number(pack.compare_at_price) : Number(pack.price);
            const salePrice = hasSale ? Number(pack.price) : null;
            const desc = cleanDescription(pack.description, pack.name);
            const mainImage = pack.image_url || 'https://www.ibda3d.shop/pwa-192x192.png';

            catalogItems.push({
                id: pack.id,
                title: pack.name,
                description: desc,
                link: `${baseUrl}/packs/${pack.slug}`,
                image_link: mainImage,
                additional_image_links: [],
                availability: 'in stock',
                condition: 'new',
                price: `${regularPrice.toFixed(2)} DZD`,
                sale_price: salePrice !== null ? `${salePrice.toFixed(2)} DZD` : null,
                brand,
                product_type: 'Pack / Bundle',
                custom_label_0: pack.is_featured ? 'Featured Pack' : 'Pack',
                item_group_id: pack.id
            });
        }

        // Handle JSON format
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
            return res.status(200).json({
                title: 'Ibda3D Product Catalog',
                link: baseUrl,
                item_count: catalogItems.length,
                updated_at: new Date().toISOString(),
                items: catalogItems
            });
        }

        // Handle CSV format
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="meta-product-feed.csv"');
            res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');

            const headersCsv = [
                'id', 'title', 'description', 'availability', 'condition',
                'price', 'sale_price', 'link', 'image_link', 'brand',
                'product_type', 'custom_label_0'
            ];

            const escapeCsvCell = (val) => {
                if (val === null || val === undefined) return '""';
                const str = val.toString().replace(/"/g, '""');
                return `"${str}"`;
            };

            const csvRows = [headersCsv.join(',')];
            for (const item of catalogItems) {
                csvRows.push([
                    escapeCsvCell(item.id),
                    escapeCsvCell(item.title),
                    escapeCsvCell(item.description),
                    escapeCsvCell(item.availability),
                    escapeCsvCell(item.condition),
                    escapeCsvCell(item.price),
                    escapeCsvCell(item.sale_price || ''),
                    escapeCsvCell(item.link),
                    escapeCsvCell(item.image_link),
                    escapeCsvCell(item.brand),
                    escapeCsvCell(item.product_type),
                    escapeCsvCell(item.custom_label_0)
                ].join(','));
            }

            return res.status(200).send(csvRows.join('\n'));
        }

        // Default: Official Meta / Google Merchant Center RSS 2.0 XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(brand)} Product Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Official dynamic product feed for ${escapeXml(brand)} store in Algeria.</description>
`;

        for (const item of catalogItems) {
            xml += `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:title>${wrapCdata(item.title)}</g:title>
      <g:description>${wrapCdata(item.description)}</g:description>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.image_link)}</g:image_link>
`;

            for (const addImg of item.additional_image_links) {
                xml += `      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>\n`;
            }

            xml += `      <g:brand>${wrapCdata(item.brand)}</g:brand>
      <g:condition>${item.condition}</g:condition>
      <g:availability>${item.availability}</g:availability>
      <g:price>${item.price}</g:price>
`;

            if (item.sale_price) {
                xml += `      <g:sale_price>${item.sale_price}</g:sale_price>\n`;
            }

            xml += `      <g:product_type>${wrapCdata(item.product_type)}</g:product_type>
      <g:custom_label_0>${wrapCdata(item.custom_label_0)}</g:custom_label_0>
      <g:item_group_id>${escapeXml(item.item_group_id)}</g:item_group_id>
    </item>
`;
        }

        xml += `  </channel>
</rss>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
        return res.status(200).send(xml);

    } catch (error) {
        console.error('Error generating Meta product feed:', error);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Failed to generate product feed: ${escapeXml(error.message)}</description>
  </channel>
</rss>`);
    }
}
