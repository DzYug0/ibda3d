import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    schema?: Record<string, any>;
    productData?: {
        id: string;
        price: number;
        compareAtPrice?: number | null;
        currency?: string;
        availability?: 'in stock' | 'out of stock';
        condition?: string;
        brand?: string;
    };
}

export function SEO({
    title,
    description = "Discover our complete range of 3D printed products. Professional quality, fast delivery across Algeria.",
    image = "/og-image.png",
    url,
    type = "website",
    schema,
    productData
}: SEOProps) {
    const siteTitle = "Ibda3D";
    const fullTitle = `${title} | ${siteTitle}`;
    const currentUrl = url || window.location.href;
    const fullImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content="Ibda3D" />

            {/* Meta Commerce Manager Catalog Microdata Tags */}
            {type === 'product' && productData && (
                <>
                    <meta property="product:brand" content={productData.brand || "Ibda3D"} />
                    <meta property="product:availability" content={productData.availability || "in stock"} />
                    <meta property="product:condition" content={productData.condition || "new"} />
                    <meta property="product:price:amount" content={productData.price.toString()} />
                    <meta property="product:price:currency" content={productData.currency || "DZD"} />
                    <meta property="product:retailer_item_id" content={productData.id} />
                    <meta property="product:item_group_id" content={productData.id} />
                    {productData.compareAtPrice && productData.compareAtPrice > productData.price && (
                        <>
                            <meta property="product:sale_price:amount" content={productData.price.toString()} />
                            <meta property="product:sale_price:currency" content={productData.currency || "DZD"} />
                        </>
                    )}
                </>
            )}

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={fullImage} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}
