function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
    const { type, slug } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zgunrxduxkleoogrmdzs.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_PJGcQgFmB-4FpEoGA7id2Q_pZS0L621';
    const baseUrl = (process.env.SITE_URL || 'https://www.ibda3d.shop').replace(/\/$/, '');

    // Default SEO meta tags
    let title = "Ibda3D - Professional 3D Printing & Store";
    let description = "Discover our complete range of 3D printed products. Professional quality, fast delivery across Algeria.";
    let imageUrl = "https://www.ibda3d.shop/pwa-192x192.png";
    let url = baseUrl;
    let itemId = null;
    let price = null;
    let compareAtPrice = null;
    let inStock = true;
    let pixelId = '1057631003921366';

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    };

    try {
        // Fetch pixel ID from store_settings
        const settingsRes = await fetch(`${supabaseUrl}/rest/v1/store_settings?key=eq.facebook_pixel_id&select=value`, { headers });
        if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData && settingsData.length > 0) {
                const val = settingsData[0].value;
                const dynamicPixel = (val && typeof val === 'object' && 'val' in val) ? val.val : val;
                if (dynamicPixel) pixelId = dynamicPixel;
            }
        }

        if (type === 'product' && slug) {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/products?slug=eq.${slug}&select=id,name,description,image_url,price,compare_at_price,stock_quantity`,
                { headers }
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const prod = data[0];
                itemId = prod.id;
                title = `${prod.name} | Ibda3D`;
                description = prod.description ? prod.description.substring(0, 160) : `Buy ${prod.name} at Ibda3D. High quality 3D printed products in Algeria.`;
                imageUrl = prod.image_url || imageUrl;
                price = prod.price;
                compareAtPrice = prod.compare_at_price;
                inStock = prod.stock_quantity > 0;
                url = `${baseUrl}/products/${slug}`;
            }
        } else if (type === 'pack' && slug) {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/packs?slug=eq.${slug}&select=id,name,description,image_url,price,compare_at_price`,
                { headers }
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const pack = data[0];
                itemId = pack.id;
                title = `${pack.name} | Ibda3D Packs`;
                description = pack.description ? pack.description.substring(0, 160) : `Buy ${pack.name} bundle pack at Ibda3D.`;
                imageUrl = pack.image_url || imageUrl;
                price = pack.price;
                compareAtPrice = pack.compare_at_price;
                inStock = true;
                url = `${baseUrl}/packs/${slug}`;
            }
        }
    } catch (error) {
        console.error("Error fetching OG data:", error);
    }

    const isProduct = Boolean(itemId && price !== null);

    // Schema.org Product JSON-LD for Meta & Google
    const schemaJson = isProduct ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": title,
        "image": [imageUrl],
        "description": description,
        "sku": itemId,
        "productID": itemId,
        "brand": {
            "@type": "Brand",
            "name": "Ibda3D"
        },
        "offers": {
            "@type": "Offer",
            "url": url,
            "priceCurrency": "DZD",
            "price": price,
            "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    } : null;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${isProduct ? 'product' : 'website'}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:site_name" content="Ibda3D">

  ${isProduct ? `
  <!-- Meta Commerce Manager Catalog Microdata Tags -->
  <meta property="product:brand" content="Ibda3D">
  <meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}">
  <meta property="product:condition" content="new">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="DZD">
  <meta property="product:retailer_item_id" content="${escapeHtml(itemId)}">
  <meta property="product:item_group_id" content="${escapeHtml(itemId)}">
  ${compareAtPrice && compareAtPrice > price ? `
  <meta property="product:sale_price:amount" content="${price}">
  <meta property="product:sale_price:currency" content="DZD">
  ` : ''}
  ` : ''}

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${escapeHtml(url)}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${escapeHtml(imageUrl)}">

  ${schemaJson ? `
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(schemaJson)}
  </script>
  ` : ''}

  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
  ${isProduct ? `fbq('track', 'ViewContent', { content_ids: ['${itemId}'], content_type: 'product', contents: [{ id: '${itemId}', quantity: 1, item_price: ${price} }], value: ${price}, currency: 'DZD' });` : ''}
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />
  ${isProduct ? `<p>Price: ${price} DZD</p>` : ''}
</body>
</html>`;

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
}
