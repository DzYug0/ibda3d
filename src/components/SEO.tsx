import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export function SEO({
    title,
    description = "Discover our complete range of 3D printed products. Professional quality, fast delivery across Algeria.",
    image = "/og-image.png",
    url,
    type = "website"
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
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={fullImage} />
        </Helmet>
    );
}
