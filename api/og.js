export default async function handler(req, res) {
    const { type, slug } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    // Default SEO meta tags
    let title = "Ibda3D - Professional 3D Printing & Store";
    let description = "Discover our complete range of 3D printed products. Professional quality, fast delivery across Algeria.";
    let imageUrl = "https://storage.googleapis.com/gpt-engineer-file-uploads/hrSdmatUUeWMqwYMRMjZ4eCIxSF3/social-images/social-1770339587855-logo2.png";
    let url = "https://ibda3d.com";

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    };

    try {
        if (type === 'product' && slug) {
            const response = await fetch(`${supabaseUrl}/rest/v1/products?slug=eq.${slug}&select=name,description,image_url`, { headers });
            const data = await response.json();

            if (data && data.length > 0) {
                title = `${data[0].name} | Ibda3D`;
                description = data[0].description ? data[0].description.substring(0, 160) : description;
                imageUrl = data[0].image_url || imageUrl;
                url = `https://ibda3d.com/products/${slug}`;
            }
        } else if (type === 'pack' && slug) {
            const response = await fetch(`${supabaseUrl}/rest/v1/packs?slug=eq.${slug}&select=name,description,image_url`, { headers });
            const data = await response.json();

            if (data && data.length > 0) {
                title = `${data[0].name} | Ibda3D Packs`;
                description = data[0].description ? data[0].description.substring(0, 160) : description;
                imageUrl = data[0].image_url || imageUrl;
                url = `https://ibda3d.com/packs/${slug}`;
            }
        }
    } catch (error) {
        console.error("Error fetching OG data:", error);
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">

  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <meta http-equiv="refresh" content="0;url=/${type === 'product' ? 'products' : type === 'pack' ? 'packs' : ''}/${slug || ''}">
</head>
<body>
  <p>Redirecting to <a href="/${type === 'product' ? 'products' : type === 'pack' ? 'packs' : ''}/${slug || ''}">${title}</a>...</p>
</body>
</html>`;

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
}
